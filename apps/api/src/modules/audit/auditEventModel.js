import mongoose from 'mongoose';
import { createModelProxy } from '../../config/modelProxy.js';

const auditEventSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    actorId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true
    },
    entityType: {
      type: String,
      enum: ['BrandRule', 'Submission', 'WorkspaceMember', 'BriefImport'],
      required: true,
      index: true
    },
    entityId: {
      type: String,
      required: true,
      index: true
    },
    action: {
      type: String,
      required: true,
      index: true
    },
    fromState: {
      type: String,
      default: null
    },
    toState: {
      type: String,
      default: null
    },
    reason: {
      type: String,
      default: null
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true,
      index: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: false,
    versionKey: false
  }
);

auditEventSchema.index({ workspaceId: 1, entityType: 1, entityId: 1, timestamp: 1 });
auditEventSchema.index({ workspaceId: 1, action: 1, timestamp: -1 });

const RawAuditEvent = mongoose.model('AuditEvent', auditEventSchema);
export const AuditEvent = createModelProxy('AuditEvent', RawAuditEvent);
