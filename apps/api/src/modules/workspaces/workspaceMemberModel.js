import mongoose from 'mongoose';
import { createModelProxy } from '../../config/modelProxy.js';

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    roles: {
      type: [String],
      enum: ['CREATOR', 'REVIEWER', 'ADMIN'],
      default: ['CREATOR'],
      required: true
    },
    status: {
      type: String,
      enum: ['invited', 'active', 'suspended'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

const RawWorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);
export const WorkspaceMember = createModelProxy('WorkspaceMember', RawWorkspaceMember);
