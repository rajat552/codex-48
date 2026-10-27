import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { Submission } from './submissionModel.js';
import { ProcessingJob } from '../jobs/processingJobModel.js';
import { AuditService } from '../audit/auditService.js';
import { fileStorage } from '../../storage/fileStorage.js';
import { validateFileSignature } from '../../middleware/uploadGuard.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  InvalidStateTransitionError
} from '../../middleware/errorHandler.js';
import { ReviewOrchestrator } from '../../services/reviewOrchestrator.js';

export class SubmissionService {
  static async createSubmission({
    workspaceId,
    creatorId,
    contentType,
    text = '',
    file = null,
    campaignId = null,
    channel = 'general',
    altText = null
  }) {
    if (!['TEXT', 'PNG', 'JPG', 'PDF_BRIEF', 'DOCX_BRIEF'].includes(contentType)) {
      throw new ValidationError(`Unsupported contentType: ${contentType}`);
    }

    let contentRef = null;
    let originalFilename = null;
    let mimeType = 'text/plain';
    let fileSizeBytes = 0;
    let contentHash = '';
    let extractedText = text ? text.trim() : '';

    if (file) {
      // Validate magic bytes & MIME
      mimeType = validateFileSignature(file.buffer, file.mimetype, file.originalname);
      originalFilename = file.originalname;
      fileSizeBytes = file.size;

      // Save privately
      const storageKey = fileStorage.generateKey(file.originalname);
      const saved = await fileStorage.save(file.buffer, storageKey);
      contentRef = saved.key;
      contentHash = saved.contentHash;
    } else {
      if (!extractedText) {
        throw new ValidationError('Text submissions must not be empty.');
      }
      contentHash = crypto.createHash('sha256').update(extractedText).digest('hex');
    }

    const submissionGroupId = `grp_${uuidv4().replace(/-/g, '').slice(0, 16)}`;

    const submission = await Submission.create({
      workspaceId,
      submissionGroupId,
      parentSubmissionId: null,
      creatorId,
      contentType,
      contentRef,
      originalFilename,
      mimeType,
      fileSizeBytes,
      contentHash,
      extractedText,
      altText,
      campaignId,
      channel: channel.toLowerCase(),
      revisionNumber: 1,
      status: 'submitted',
      findings: []
    });

    // Enqueue review job in durable queue (off HTTP request path)
    const idempotencyKey = `job_sub_${submission._id}_rev_1`;
    await ProcessingJob.create({
      workspaceId,
      submissionId: submission._id,
      jobType: 'REVIEW_SUBMISSION',
      idempotencyKey,
      status: 'queued'
    });

    await AuditService.recordEvent({
      workspaceId,
      actorId: creatorId,
      entityType: 'Submission',
      entityId: submission._id,
      action: 'SUBMISSION_CREATED',
      fromState: null,
      toState: 'submitted',
      metadata: {
        contentType,
        campaignId,
        channel,
        submissionGroupId
      }
    });

    try {
      await ReviewOrchestrator.executeReview(submission._id);
    } catch (reviewErr) {
      console.warn('Initial review execution notice:', reviewErr.message);
    }

    return submission;
  }

  static async createRevision({
    workspaceId,
    creatorId,
    parentSubmissionId,
    text = '',
    file = null,
    altText = null
  }) {
    const parent = await Submission.findOne({
      _id: parentSubmissionId,
      workspaceId
    });

    if (!parent) {
      throw new NotFoundError('Parent submission not found in this workspace.');
    }

    let contentRef = parent.contentRef;
    let originalFilename = parent.originalFilename;
    let mimeType = parent.mimeType;
    let fileSizeBytes = parent.fileSizeBytes;
    let contentHash = parent.contentHash;
    let extractedText = text !== undefined && text !== '' ? text.trim() : parent.extractedText;

    if (file) {
      mimeType = validateFileSignature(file.buffer, file.mimetype, file.originalname);
      originalFilename = file.originalname;
      fileSizeBytes = file.size;

      const storageKey = fileStorage.generateKey(file.originalname);
      const saved = await fileStorage.save(file.buffer, storageKey);
      contentRef = saved.key;
      contentHash = saved.contentHash;
    } else if (text !== undefined && text !== '') {
      contentHash = crypto.createHash('sha256').update(extractedText).digest('hex');
    }

    const nextRevisionNumber = parent.revisionNumber + 1;

    const revision = await Submission.create({
      workspaceId,
      submissionGroupId: parent.submissionGroupId,
      parentSubmissionId: parent._id,
      creatorId,
      contentType: parent.contentType,
      contentRef,
      originalFilename,
      mimeType,
      fileSizeBytes,
      contentHash,
      extractedText,
      altText: altText !== null ? altText : parent.altText,
      campaignId: parent.campaignId,
      channel: parent.channel,
      revisionNumber: nextRevisionNumber,
      status: 'submitted',
      findings: []
    });

    // Enqueue review job for the new revision
    const idempotencyKey = `job_sub_${revision._id}_rev_${nextRevisionNumber}`;
    await ProcessingJob.create({
      workspaceId,
      submissionId: revision._id,
      jobType: 'REVIEW_SUBMISSION',
      idempotencyKey,
      status: 'queued'
    });

    await AuditService.recordEvent({
      workspaceId,
      actorId: creatorId,
      entityType: 'Submission',
      entityId: revision._id,
      action: 'REVISION_CREATED',
      fromState: `rev_${parent.revisionNumber}`,
      toState: `rev_${nextRevisionNumber}`,
      metadata: {
        submissionGroupId: parent.submissionGroupId,
        parentSubmissionId: parent._id.toString()
      }
    });

    try {
      await ReviewOrchestrator.executeReview(revision._id);
    } catch (reviewErr) {
      console.warn('Revision review execution notice:', reviewErr.message);
    }

    return revision;
  }

  static async recordDecision({
    workspaceId,
    actorId,
    submissionId,
    action,
    findingId = null,
    reason = '',
    comment = ''
  }) {
    const submission = await Submission.findOne({ _id: submissionId, workspaceId });
    if (!submission) {
      throw new NotFoundError('Submission not found.');
    }

    if (!['approve', 'request_changes', 'reject', 'override_finding'].includes(action)) {
      throw new ValidationError(`Unsupported decision action: ${action}`);
    }

    const previousStatus = submission.status;

    if (action === 'override_finding') {
      if (!findingId) {
        throw new ValidationError('findingId is required when overriding a finding.');
      }
      if (!reason || !reason.trim()) {
        throw new ValidationError('A reasoned explanation is mandatory when overriding a brand finding.');
      }

      const finding = submission.findings.find(f => f.findingId === findingId);
      if (!finding) {
        throw new NotFoundError(`Finding ${findingId} not found on this submission.`);
      }

      finding.override = {
        overridden: true,
        reason: reason.trim(),
        actorId,
        timestamp: new Date()
      };
      await submission.save();

      await AuditService.recordEvent({
        workspaceId,
        actorId,
        entityType: 'Submission',
        entityId: submission._id,
        action: 'FINDING_OVERRIDDEN',
        fromState: null,
        toState: null,
        reason: reason.trim(),
        metadata: { findingId, category: finding.category }
      });

      return submission;
    }

    if (action === 'approve') {
      submission.status = 'approved';
    } else if (action === 'request_changes') {
      submission.status = 'changes_requested';
    } else if (action === 'reject') {
      if (!reason || !reason.trim()) {
        throw new ValidationError('Reason is mandatory when rejecting a submission.');
      }
      submission.status = 'rejected';
    }

    submission.decision = {
      actorId,
      action,
      reason: reason ? reason.trim() : '',
      comment: comment ? comment.trim() : '',
      timestamp: new Date()
    };

    await submission.save();

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'Submission',
      entityId: submission._id,
      action: action === 'approve' ? 'SUBMISSION_APPROVED' : action === 'reject' ? 'SUBMISSION_REJECTED' : 'CHANGES_REQUESTED',
      fromState: previousStatus,
      toState: submission.status,
      reason: reason || comment,
      metadata: { revisionNumber: submission.revisionNumber }
    });

    return submission;
  }

  static async listSubmissions(workspaceId, filters = {}) {
    const query = { workspaceId };
    if (filters.status) query.status = filters.status;
    if (filters.campaignId) query.campaignId = filters.campaignId;
    if (filters.channel) query.channel = filters.channel;
    if (filters.creatorId) query.creatorId = filters.creatorId;

    return await Submission.find(query)
      .sort({ createdAt: -1 })
      .populate('creatorId', 'displayName email');
  }

  static async getSubmission(workspaceId, submissionId) {
    let submission = await Submission.findOne({ _id: submissionId, workspaceId })
      .populate('creatorId', 'displayName email');
    if (!submission) {
      throw new NotFoundError('Submission not found.');
    }

    // Auto-execute review if findings are not evaluated yet or status is submitted
    if (submission.status === 'submitted' || (!submission.findings || submission.findings.length === 0)) {
      try {
        const reviewed = await ReviewOrchestrator.executeReview(submission._id);
        if (reviewed) {
          submission = reviewed;
        }
      } catch (err) {
        console.warn('Auto review execution on getSubmission notice:', err.message);
      }
    }

    const allRevs = await Submission.find({
      submissionGroupId: submission.submissionGroupId,
      workspaceId
    }).sort({ revisionNumber: 1 });

    const submissionObj = submission.toObject ? submission.toObject() : { ...submission };

    submissionObj.currentRevision = {
      revisionNumber: submission.revisionNumber || 1,
      copyText: submission.extractedText || submission.text || '',
      findings: submission.findings || [],
      visualMetrics: submission.processing?.visualMetrics || null,
      ruleSnapshot: submission.ruleVersionSnapshot || []
    };

    submissionObj.revisions = (allRevs && allRevs.length > 0)
      ? allRevs.map(r => ({
          _id: r._id,
          revisionNumber: r.revisionNumber || 1,
          createdAt: r.createdAt,
          copyText: r.extractedText || r.text || '',
          findings: r.findings || [],
          status: r.status,
          visualMetrics: r.processing?.visualMetrics || null,
          revisionNotes: r.revisionNotes || `Revision ${r.revisionNumber || 1}`
        }))
      : [submissionObj.currentRevision];

    if (!submissionObj.title) {
      submissionObj.title = submission.title || submission.campaignId || `Submission #${submission._id.toString().slice(-4)}`;
    }

    return submissionObj;
  }
}
