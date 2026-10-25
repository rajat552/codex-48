import express from 'express';
import { BriefImportController } from './briefImportController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember, requirePermission } from '../../middleware/requireWorkspaceMember.js';
import { upload } from '../../middleware/uploadGuard.js';

export const briefImportRouter = express.Router({ mergeParams: true });

briefImportRouter.use(authenticate);
briefImportRouter.use(requireWorkspaceMember);

briefImportRouter.post(
  '/',
  upload.single('file'),
  BriefImportController.uploadAndParse
);

briefImportRouter.get('/:importId', BriefImportController.getById);

briefImportRouter.post(
  '/:importId/convert-to-rules',
  requirePermission(['ADMIN']),
  BriefImportController.convertToRules
);
