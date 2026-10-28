import express from 'express';
import { SubmissionController } from './submissionController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember, requirePermission } from '../../middleware/requireWorkspaceMember.js';
import { upload } from '../../middleware/uploadGuard.js';

export const submissionRouter = express.Router({ mergeParams: true });

submissionRouter.use(authenticate);
submissionRouter.use(requireWorkspaceMember);

// Accept either 'file' or 'asset' field name from multipart uploads
const uploadSubmissionFile = (req, res, next) => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'asset', maxCount: 1 }
  ])(req, res, (err) => {
    if (err) return next(err);
    if (req.files) {
      req.file = req.files['file']?.[0] || req.files['asset']?.[0] || null;
    }
    next();
  });
};

submissionRouter.post('/', uploadSubmissionFile, SubmissionController.create);
submissionRouter.get('/', SubmissionController.list);
submissionRouter.get('/:submissionId', SubmissionController.getById);

submissionRouter.post(
  '/:submissionId/revisions',
  uploadSubmissionFile,
  requirePermission(['CREATOR', 'ADMIN']),
  SubmissionController.createRevision
);

submissionRouter.post(
  '/:submissionId/decisions',
  requirePermission(['REVIEWER', 'ADMIN']),
  SubmissionController.recordDecision
);

submissionRouter.post(
  '/:submissionId/findings/:findingId/override',
  requirePermission(['REVIEWER', 'ADMIN']),
  (req, res, next) => {
    req.body.action = 'override_finding';
    req.body.findingId = req.params.findingId;
    return SubmissionController.recordDecision(req, res, next);
  }
);

submissionRouter.post(
  '/:submissionId/review-runs',
  SubmissionController.triggerReviewRun
);

submissionRouter.get('/:submissionId/diff', SubmissionController.getDiff);
submissionRouter.get('/:submissionId/revisions/diff', SubmissionController.getDiff);
submissionRouter.get('/:submissionId/file', SubmissionController.streamFile);
submissionRouter.get('/:submissionId/audit-events', SubmissionController.getAuditEvents);
