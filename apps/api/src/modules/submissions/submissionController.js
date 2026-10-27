import { SubmissionService } from './submissionService.js';
import { RevisionDiffService } from '../revisions/revisionDiffService.js';
import { ReviewOrchestrator } from '../../services/reviewOrchestrator.js';
import { AuditService } from '../audit/auditService.js';
import { fileStorage } from '../../storage/fileStorage.js';
import { NotFoundError } from '../../middleware/errorHandler.js';

export class SubmissionController {
  static async create(req, res, next) {
    try {
      const { contentType, campaignId, channel, title } = req.body;
      const text = req.body.text || req.body.copyText || '';
      const altText = req.body.altText || req.body.assetAltText || null;
      const file = req.file || null;

      let resolvedContentType = contentType;
      if (!resolvedContentType) {
        if (file) {
          const mime = (file.mimetype || '').toLowerCase();
          if (mime.includes('png')) resolvedContentType = 'PNG';
          else if (mime.includes('jpeg') || mime.includes('jpg')) resolvedContentType = 'JPG';
          else if (mime.includes('pdf')) resolvedContentType = 'PDF_BRIEF';
          else if (mime.includes('docx') || mime.includes('word')) resolvedContentType = 'DOCX_BRIEF';
          else resolvedContentType = 'PNG';
        } else {
          resolvedContentType = 'TEXT';
        }
      }

      const submission = await SubmissionService.createSubmission({
        workspaceId: req.workspace._id,
        creatorId: req.user.userId,
        title: title || null,
        contentType: resolvedContentType,
        text,
        file,
        campaignId: campaignId || 'CAMPAIGN-001',
        channel: channel || 'general',
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
      const text = req.body.text || req.body.copyText || '';
      const altText = req.body.altText || req.body.assetAltText || null;
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
      let { action, status, findingId, reason, comment, comments } = req.body;

      const rawAction = String(action || status || '').toLowerCase();
      let normalizedAction = rawAction;
      if (rawAction === 'approved') normalizedAction = 'approve';
      else if (rawAction === 'rejected') normalizedAction = 'reject';
      else if (rawAction === 'changes_requested') normalizedAction = 'request_changes';

      const decisionReason = String(reason || comment || comments || '').trim();

      const updated = await SubmissionService.recordDecision({
        workspaceId: req.workspace._id,
        actorId: req.user.userId,
        submissionId,
        action: normalizedAction,
        findingId,
        reason: decisionReason,
        comment: decisionReason
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
