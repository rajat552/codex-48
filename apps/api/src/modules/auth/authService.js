import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './userModel.js';
import { Workspace } from '../workspaces/workspaceModel.js';
import { WorkspaceMember } from '../workspaces/workspaceMemberModel.js';
import { BrandRule } from '../rules/brandRuleModel.js';
import { env } from '../../config/env.js';
import {
  ValidationError,
  AuthenticationError,
  ConflictError,
  NotFoundError
} from '../../middleware/errorHandler.js';

export class AuthService {
  static async hashPassword(password) {
    if (!password || password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long.');
    }
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static generateAccessToken(user) {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        displayName: user.displayName
      },
      env.JWT_ACCESS_SECRET,
      {
        expiresIn: `${env.ACCESS_TOKEN_TTL_MINUTES}m`,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      }
    );
  }

  static generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
        type: 'refresh'
      },
      env.JWT_REFRESH_SECRET,
      {
        expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d`,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      }
    );
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, env.JWT_ACCESS_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      });
    } catch (err) {
      throw new AuthenticationError('Invalid or expired access token.');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, env.JWT_REFRESH_SECRET, {
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE
      });
    } catch (err) {
      throw new AuthenticationError('Invalid or expired refresh token.');
    }
  }

  static async register({ displayName, email, password, workspaceName }) {
    if (!displayName || !displayName.trim()) {
      throw new ValidationError('Display name is required.');
    }
    if (!email || !email.trim() || !email.includes('@')) {
      throw new ValidationError('Valid email is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      if (env.NODE_ENV !== 'production') {
        const passwordHash = await this.hashPassword(password);
        existing.passwordHash = passwordHash;
        if (displayName && displayName.trim()) {
          existing.displayName = displayName.trim();
        }
        existing.status = 'active';
        await existing.save();

        const wsName = workspaceName && workspaceName.trim() ? workspaceName.trim() : `${existing.displayName}'s Brand Workspace`;
        let workspace = await Workspace.findOne({ createdBy: existing._id, name: wsName });
        if (!workspace) {
          const slug = `${normalizedEmail.split('@')[0]}-${Date.now().toString(36)}`;
          workspace = await Workspace.create({
            name: wsName,
            slug,
            createdBy: existing._id
          });
        }
        let member = await WorkspaceMember.findOne({ workspaceId: workspace._id, userId: existing._id });
        if (!member) {
          member = await WorkspaceMember.create({
            workspaceId: workspace._id,
            userId: existing._id,
            roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
            status: 'active'
          });
        }
        const accessToken = this.generateAccessToken(existing);
        const refreshToken = this.generateRefreshToken(existing);
        return {
          user: existing.toSafeObject(),
          workspace,
          membership: member,
          tokens: {
            accessToken,
            refreshToken
          }
        };
      }
      throw new ConflictError('A user with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(password);
    const user = await User.create({
      displayName: displayName.trim(),
      email: normalizedEmail,
      passwordHash,
      status: 'active'
    });

    // Create default workspace for new user
    const wsName = workspaceName && workspaceName.trim() ? workspaceName.trim() : `${displayName.trim()}'s Brand Workspace`;
    const slug = `${normalizedEmail.split('@')[0]}-${Date.now().toString(36)}`;
    const workspace = await Workspace.create({
      name: wsName,
      slug,
      createdBy: user._id
    });

    // Assign ADMIN and CREATOR and REVIEWER roles to owner in their initial workspace
    const member = await WorkspaceMember.create({
      workspaceId: workspace._id,
      userId: user._id,
      roles: ['ADMIN', 'REVIEWER', 'CREATOR'],
      status: 'active'
    });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toSafeObject(),
      workspace,
      membership: member,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  static async login({ email, password }) {
    if (!email || !password) {
      throw new ValidationError('Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || (user.status && user.status !== 'active')) {
      throw new AuthenticationError('Invalid email or password.');
    }

    const isValid = await this.comparePassword(password, user.passwordHash);
    if (!isValid) {
      throw new AuthenticationError('Invalid email or password.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    // Fetch workspaces where user is active member and ensure workspace is populated
    const rawMemberships = await WorkspaceMember.find({ userId: user._id, status: 'active' })
      .populate('workspaceId');

    const memberships = await Promise.all(
      rawMemberships.map(async m => {
        let ws = m.workspaceId;
        if (!ws || !ws.name) {
          ws = await Workspace.findById(ws?._id || ws);
        }
        return {
          workspace: ws || { _id: m.workspaceId, name: 'Brand Workspace' },
          roles: m.roles,
          status: m.status
        };
      })
    );

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toSafeObject(),
      memberships,
      tokens: {
        accessToken,
        refreshToken
      }
    };
  }

  static async refresh({ refreshToken }) {
    if (!refreshToken) {
      throw new AuthenticationError('Refresh token required.');
    }
    const decoded = this.verifyRefreshToken(refreshToken);
    const user = await User.findById(decoded.userId);
    if (!user || user.status !== 'active') {
      throw new AuthenticationError('User account not found or disabled.');
    }

    const accessToken = this.generateAccessToken(user);
    return { accessToken };
  }

  static async getMe(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found.');
    }

    const memberships = await WorkspaceMember.find({ userId: user._id, status: 'active' })
      .populate('workspaceId');

    return {
      user: user.toSafeObject(),
      memberships
    };
  }
}
