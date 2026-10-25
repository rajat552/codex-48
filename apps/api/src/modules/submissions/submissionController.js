import { SubmissionService } from './submissionService.js';
import { RevisionDiffService } from '../revisions/revisionDiffService.js';
import { ReviewOrchestrator } from '../../services/reviewOrchestrator.js';
import { AuditService } from '../audit/auditService.js';
import { fileStorage } from '../../storage/fileStorage.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

export class SubmissionController {
  static async create(req, res, next) {
    try {
      const { contentType, text, campaignId, channel, altText } = req.body;
      const file = req.file || null;

      const submission = await SubmissionService.createSubmission({
        workspaceId: req.workspace._id,
        creatorId: req.user.userId,
        contentType: contentType || (file ? (file.mimetype.includes('png') ? 'PNG' : 'JPG') : 'TEXT'),
        text,
        file,
        campaignId,
        channel,
        altText
      });

      return res.status(202).json({
        data: {
          id: submission._id,
          submissionGroupId: submission.submissionGroupId,
          revisionNumber: submission.revisionNumber,
          status: submission.status
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async list(req, res, next) {
    try {
      const { status, campaignId, channel, creatorId } = req.query;
      const submissions = await SubmissionService.listSubmissions(req.workspace._id, {
        status,
        campaignId,
        channel,
        creatorId
      });

      return res.status(200).json({
        data: submissions,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const { submissionId } = req.params;
      const submission = await SubmissionService.getSubmission(req.workspace._id, submissionId);

      return res.status(200).json({
        data: submission,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createRevision(req, res, next) {
    try {
      const { submissionId } = req.params;
      const { text, altText } = req.body;
      const file = req.file || null;

      const revision = await SubmissionService.createRevision({
        workspaceId: req.workspace._id,
        creatorId: req.user.userId,
        parentSubmissionId: submissionId,
        text,
        file,
        altText
      });

      return res.status(201).json({
        data: revision,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async recordDecision(req, res, next) {
    try {
      const { submissionId } = req.params;
      const { action, findingId, reason, comment } = req.body;

      const updated = await SubmissionService.recordDecision({
        workspaceId: req.workspace._id,
        actorId: req.user.userId,
        submissionId,
        action,
        findingId,
        reason,
        comment
      });

      return res.status(200).json({
        data: updated,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async triggerReviewRun(req, res, next) {
    try {
      const { submissionId } = req.params;
      const submission = await ReviewOrchestrator.executeReview(submissionId);

      return res.status(200).json({
        data: submission,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getDiff(req, res, next) {
    try {
      const { submissionId } = req.params;
      const { fromRevision, toRevision } = req.query;

      const diffResult = await RevisionDiffService.compareRevisions({
        workspaceId: req.workspace._id,
        submissionId,
        fromRevision: fromRevision || 1,
        toRevision: toRevision || 2
      });

      return res.status(200).json({
        data: diffResult,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async streamFile(req, res, next) {
    try {
      const { submissionId } = req.params;
      const submission = await SubmissionService.getSubmission(req.workspace._id, submissionId);
      if (!submission.contentRef) {
        throw new NotFoundError('No file attachment associated with this submission.');
      }

      const buffer = await fileStorage.get(submission.contentRef);
      res.setHeader('Content-Type', submission.mimeType || 'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${submission.originalFilename || 'attachment'}"`);
      return res.send(buffer);
    } catch (err) {
      next(err);
    }
  }

  static async getAuditEvents(req, res, next) {
    try {
      const { submissionId } = req.params;
      const events = await AuditService.getEventsForEntity(req.workspace._id, 'Submission', submissionId);
      return res.status(200).json({
        data: events,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
