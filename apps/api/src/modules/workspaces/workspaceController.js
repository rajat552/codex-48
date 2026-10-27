import { Workspace } from './workspaceModel.js';
import { WorkspaceMember } from './workspaceMemberModel.js';
import { User } from '../auth/userModel.js';
import { ValidationError, ConflictError, NotFoundError } from '../../middleware/errorHandler.js';

export class WorkspaceController {
  static async listUserWorkspaces(req, res, next) {
    try {
      const memberships = await WorkspaceMember.find({
        userId: req.user.userId,
        status: 'active'
      }).populate('workspaceId');

      const workspaces = await Promise.all(
        memberships.map(async m => {
          let ws = m.workspaceId;
          if (ws && typeof ws === 'object' && ws.name) {
            return { workspace: ws, roles: m.roles, status: m.status };
          }
          // If not populated by driver/mock, resolve from Workspace collection
          const wsDoc = await Workspace.findById(ws?._id || ws);
          return {
            workspace: wsDoc || { _id: ws, name: 'Default Workspace' },
            roles: m.roles,
            status: m.status
          };
        })
      );

      let validWorkspaces = workspaces.filter(w => w.workspace);
      if (validWorkspaces.length === 0) {
        const userDoc = await User.findById(req.user.userId);
        const wsName = `${userDoc?.displayName || 'Brand'}'s Workspace`;
        const slug = `${(userDoc?.email || 'user').split('@')[0]}-${Date.now().toString(36)}`;
        const wsDoc = await Workspace.create({
          name: wsName,
          slug,
          createdBy: req.user.userId
        });
        const member = await WorkspaceMember.create({
          workspaceId: wsDoc._id,
          userId: req.user.userId,
          roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
          status: 'active'
        });
        validWorkspaces = [{
          workspace: wsDoc,
          roles: member.roles,
          status: member.status
        }];
      }

      return res.status(200).json({
        data: validWorkspaces,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createWorkspace(req, res, next) {
    try {
      const { name, settings } = req.body;
      if (!name || !name.trim()) {
        throw new ValidationError('Workspace name is required.');
      }

      const slug = `${name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;
      const workspace = await Workspace.create({
        name: name.trim(),
        slug,
        createdBy: req.user.userId,
        settings: settings || {}
      });

      const member = await WorkspaceMember.create({
        workspaceId: workspace._id,
        userId: req.user.userId,
        roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
        status: 'active'
      });

      return res.status(201).json({
        data: {
          workspace,
          membership: member
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getWorkspace(req, res, next) {
    try {
      return res.status(200).json({
        data: {
          workspace: req.workspace,
          membership: req.membership
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async listMembers(req, res, next) {
    try {
      const members = await WorkspaceMember.find({
        workspaceId: req.workspace._id
      }).populate('userId', 'displayName email status lastLoginAt');

      return res.status(200).json({
        data: members,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async addMember(req, res, next) {
    try {
      const { email, roles } = req.body;
      if (!email || !email.trim()) {
        throw new ValidationError('Email is required.');
      }
      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        throw new ValidationError('At least one role (CREATOR, REVIEWER, ADMIN) is required.');
      }

      const targetUser = await User.findOne({ email: email.trim().toLowerCase() });
      if (!targetUser) {
        throw new NotFoundError('User with provided email not found.');
      }

      const existingMember = await WorkspaceMember.findOne({
        workspaceId: req.workspace._id,
        userId: targetUser._id
      });

      if (existingMember) {
        existingMember.roles = [...new Set([...existingMember.roles, ...roles])];
        existingMember.status = 'active';
        await existingMember.save();
        return res.status(200).json({
          data: existingMember,
          meta: { requestId: req.requestId }
        });
      }

      const member = await WorkspaceMember.create({
        workspaceId: req.workspace._id,
        userId: targetUser._id,
        roles,
        status: 'active'
      });

      return res.status(201).json({
        data: member,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
