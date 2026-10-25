import mongoose from 'mongoose';

const processingJobSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      index: true
    },
    jobType: {
      type: String,
      enum: ['REVIEW_SUBMISSION', 'IMPORT_BRIEF'],
      required: true,
      default: 'REVIEW_SUBMISSION'
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    status: {
      type: String,
      enum: ['queued', 'running', 'succeeded', 'retryable_failed', 'failed'],
      default: 'queued',
      index: true
    },
    attempts: {
      type: Number,
      default: 0
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    availableAt: {
      type: Date,
      default: Date.now,
      index: true
    },
    leaseOwner: {
      type: String,
      default: null
    },
    leaseUntil: {
      type: Date,
      default: null
    },
    lastErrorCode: {
      type: String,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

processingJobSchema.index({ status: 1, availableAt: 1, createdAt: 1 });
processingJobSchema.index({ workspaceId: 1, submissionId: 1, createdAt: -1 });

export const ProcessingJob = mongoose.model('ProcessingJob', processingJobSchema);
