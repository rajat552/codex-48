import mongoose from 'mongoose';

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

export const Workspace = mongoose.model('Workspace', workspaceSchema);
