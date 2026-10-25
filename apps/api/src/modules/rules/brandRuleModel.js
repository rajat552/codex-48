import mongoose from 'mongoose';
import { createModelProxy } from '../../config/modelProxy.js';

const brandRuleSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    ruleId: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    ruleVersion: {
      type: Number,
      required: true,
      default: 1
    },
    category: {
      type: String,
      enum: [
        'terminology',
        'product_fact',
        'promotional_condition',
        'disclaimer',
        'tone',
        'visual_palette',
        'accessibility',
        'other'
      ],
      required: true,
      index: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      required: true
    },
    ruleText: {
      type: String,
      required: true,
      trim: true
    },
    ruleConfig: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    scope: {
      campaignIds: {
        type: [String],
        default: []
      },
      channels: {
        type: [String],
        default: []
      }
    },
    sourceId: {
      type: String,
      required: true,
      trim: true
    },
    sourceVersion: {
      type: String,
      required: true,
      default: 'v1.0',
      trim: true
    },
    sourceMetadata: {
      title: { type: String, default: '' },
      reference: { type: String, default: '' },
      url: { type: String, default: '' }
    },
    approvalStatus: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'superseded', 'expired', 'archived'],
      default: 'draft',
      required: true,
      index: true
    },
    effectiveFrom: {
      type: Date
    },
    expiresAt: {
      type: Date
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    approvedAt: {
      type: Date
    },
    contentHash: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

brandRuleSchema.index({ workspaceId: 1, ruleId: 1, ruleVersion: 1 }, { unique: true });
brandRuleSchema.index({ workspaceId: 1, status: 1, approvalStatus: 1, effectiveFrom: 1, expiresAt: 1 });

const RawBrandRule = mongoose.model('BrandRule', brandRuleSchema);
export const BrandRule = createModelProxy('BrandRule', RawBrandRule);
