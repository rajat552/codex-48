import express from 'express';
import { RuleController } from './ruleController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember, requirePermission } from '../../middleware/requireWorkspaceMember.js';

export const ruleRouter = express.Router({ mergeParams: true });

ruleRouter.use(authenticate);
ruleRouter.use(requireWorkspaceMember);

ruleRouter.get('/', RuleController.listRules);
ruleRouter.post('/', requirePermission(['ADMIN']), RuleController.createDraft);
ruleRouter.post('/conflict-check', requirePermission(['ADMIN']), RuleController.checkConflicts);
ruleRouter.post('/import', requirePermission(['ADMIN']), RuleController.importRules);

ruleRouter.get('/:ruleId', RuleController.getRuleVersions);
ruleRouter.post('/:ruleId/versions', requirePermission(['ADMIN']), RuleController.createVersion);
ruleRouter.post('/:ruleId/approve', requirePermission(['ADMIN', 'REVIEWER']), RuleController.approve);
ruleRouter.post('/:ruleId/activate', requirePermission(['ADMIN']), RuleController.activate);
ruleRouter.post('/:ruleId/archive', requirePermission(['ADMIN']), RuleController.archive);
