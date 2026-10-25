import mongoose from 'mongoose';
import { createModelProxy } from '../../config/modelProxy.js';

const workspaceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    settings: {
      defaultTimezone: {
        type: String,
        default: 'UTC'
      },
      allowedChannels: {
        type: [String],
        default: ['instagram', 'web', 'twitter', 'facebook', 'linkedin', 'print']
      }
    }
  },
  {
    timestamps: true
  }
);

const RawWorkspace = mongoose.model('Workspace', workspaceSchema);
export const Workspace = createModelProxy('Workspace', RawWorkspace);
