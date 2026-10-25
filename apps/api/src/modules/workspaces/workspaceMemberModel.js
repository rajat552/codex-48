import mongoose from 'mongoose';

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

// Compound unique index for tenant membership
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);
