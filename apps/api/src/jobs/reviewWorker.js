import { v4 as uuidv4 } from 'uuid';
import { ProcessingJob } from '../modules/jobs/processingJobModel.js';
import { ReviewOrchestrator } from '../services/reviewOrchestrator.js';
import { connectDatabase } from '../config/database.js';
import { logger } from '../config/logger.js';

export class ReviewWorker {
  constructor(workerId = `worker_${uuidv4().slice(0, 8)}`, pollIntervalMs = 1500) {
    this.workerId = workerId;
    this.pollIntervalMs = pollIntervalMs;
    this.isRunning = false;
  }

  async claimJob() {
    const now = new Date();
    const leaseDurationMs = 5 * 60 * 1000; // 5 minute lease
    const leaseUntil = new Date(now.getTime() + leaseDurationMs);

    // Atomic claim of queued job OR expired lease job
    const job = await ProcessingJob.findOneAndUpdate(
      {
        $or: [
          { status: 'queued', availableAt: { $lte: now } },
          { status: 'running', leaseUntil: { $lt: now } } // Reclaim expired lease
        ]
      },
      {
        $set: {
          status: 'running',
          leaseOwner: this.workerId,
          leaseUntil
        },
        $inc: { attempts: 1 }
      },
      {
        sort: { availableAt: 1, createdAt: 1 },
        new: true
      }
    );

    return job;
  }

  async processSingleJob(job) {
    try {
      logger.info('Claimed review job', { jobId: job._id.toString(), submissionId: job.submissionId.toString() });

      if (job.jobType === 'REVIEW_SUBMISSION') {
        await ReviewOrchestrator.executeReview(job.submissionId);
      }

      job.status = 'succeeded';
      job.completedAt = new Date();
      await job.save();

      logger.info('Review job succeeded', { jobId: job._id.toString() });
    } catch (err) {
      logger.error('Review job execution failed', { jobId: job._id.toString(), error: err.message });
      job.lastErrorCode = err.message || 'UNKNOWN_ERROR';

      if (job.attempts >= job.maxAttempts) {
        job.status = 'failed';
      } else {
        job.status = 'retryable_failed';
        // Exponential backoff
        job.availableAt = new Date(Date.now() + Math.pow(2, job.attempts) * 2000);
      }
      await job.save();
    }
  }

  async start() {
    this.isRunning = true;
    logger.info('ReviewWorker started polling for jobs', { workerId: this.workerId });

    while (this.isRunning) {
      try {
        const job = await this.claimJob();
        if (job) {
          await this.processSingleJob(job);
        } else {
          // No job available, wait poll interval
          await new Promise(resolve => setTimeout(resolve, this.pollIntervalMs));
        }
      } catch (err) {
        logger.error('Worker loop iteration error', { error: err.message });
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  stop() {
    this.isRunning = false;
    logger.info('ReviewWorker stopped', { workerId: this.workerId });
  }
}

// Standalone execution when invoked directly via node
const isMain = process.argv[1] && process.argv[1].endsWith('reviewWorker.js');
if (isMain) {
  connectDatabase()
    .then(() => {
      const worker = new ReviewWorker();
      worker.start();
    })
    .catch(err => {
      logger.error('Worker failed to connect to database', { error: err.message });
      process.exit(1);
    });
}
