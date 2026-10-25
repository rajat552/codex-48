import express from 'express';
import { SubmissionController } from './submissionController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember, requirePermission } from '../../middleware/requireWorkspaceMember.js';
import { upload } from '../../middleware/uploadGuard.js';

export const submissionRouter = express.Router({ mergeParams: true });

submissionRouter.use(authenticate);
submissionRouter.use(requireWorkspaceMember);

submissionRouter.post('/', upload.single('file'), SubmissionController.create);
submissionRouter.get('/', SubmissionController.list);
submissionRouter.get('/:submissionId', SubmissionController.getById);

submissionRouter.post(
  '/:submissionId/revisions',
  upload.single('file'),
  requirePermission(['CREATOR', 'ADMIN']),
  SubmissionController.createRevision
);

submissionRouter.post(
  '/:submissionId/decisions',
  requirePermission(['REVIEWER', 'ADMIN']),
  SubmissionController.recordDecision
);

submissionRouter.post(
  '/:submissionId/review-runs',
  SubmissionController.triggerReviewRun
);

submissionRouter.get('/:submissionId/diff', SubmissionController.getDiff);
submissionRouter.get('/:submissionId/file', SubmissionController.streamFile);
submissionRouter.get('/:submissionId/audit-events', SubmissionController.getAuditEvents);
