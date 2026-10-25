import express from 'express';
import { WorkspaceController } from './workspaceController.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireWorkspaceMember, requirePermission } from '../../middleware/requireWorkspaceMember.js';

export const workspaceRouter = express.Router();

workspaceRouter.use(authenticate);

workspaceRouter.get('/', WorkspaceController.listUserWorkspaces);
workspaceRouter.post('/', WorkspaceController.createWorkspace);

workspaceRouter.get('/:workspaceId', requireWorkspaceMember, WorkspaceController.getWorkspace);
workspaceRouter.get(
  '/:workspaceId/members',
  requireWorkspaceMember,
  requirePermission(['ADMIN']),
  WorkspaceController.listMembers
);
workspaceRouter.post(
  '/:workspaceId/members',
  requireWorkspaceMember,
  requirePermission(['ADMIN']),
  WorkspaceController.addMember
);
