import { WorkspaceMember } from '../modules/workspaces/workspaceMemberModel.js';
import { Workspace } from '../modules/workspaces/workspaceModel.js';
import { ForbiddenError, NotFoundError } from './errorHandler.js';

export async function requireWorkspaceMember(req, res, next) {
  try {
    const { workspaceId } = req.params;
    if (!workspaceId) {
      return next(new NotFoundError('Workspace ID is required.'));
    }

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      return next(new NotFoundError('Workspace not found.'));
    }

    const member = await WorkspaceMember.findOne({
      workspaceId,
      userId: req.user.userId,
      status: 'active'
    });

    if (!member) {
      // Do not leak internal workspace existence if policy prefers 404/403
      return next(new ForbiddenError('You do not have access to this workspace.'));
    }

    req.workspace = workspace;
    req.membership = member;
    next();
  } catch (err) {
    next(err);
  }
}

export function requirePermission(allowedRoles) {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.membership) {
      return next(new ForbiddenError('Workspace membership required.'));
    }

    const memberRoles = req.membership.roles || [];
    // ADMIN has supervisory privileges across standard roles
    const hasRole = memberRoles.includes('ADMIN') || rolesArray.some(role => memberRoles.includes(role));

    if (!hasRole) {
      return next(new ForbiddenError(`Action requires one of the following roles: ${rolesArray.join(', ')}`));
    }

    next();
  };
}
