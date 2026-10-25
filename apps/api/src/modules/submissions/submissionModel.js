import mongoose from 'mongoose';

const findingSchema = new mongoose.Schema(
  {
    findingId: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium'
    },
    classification: {
      type: String,
      enum: ['CONFIRMED_RULE_CONFLICT', 'NEEDS_VERIFICATION', 'ADVISORY_STYLE_VISUAL_CONCERN'],
      required: true
    },
    sourceExcerpt: {
      type: String,
      default: ''
    },
    explanation: {
      type: String,
      required: true
    },
    ruleRefs: [
      {
        ruleId: { type: String, required: true },
        ruleVersion: { type: Number, required: true },
        sourceVersion: { type: String, default: 'v1.0' }
      }
    ],
    sourceRefs: [
      {
        sourceId: { type: String },
        sourceVersion: { type: String }
      }
    ],
    suggestedCorrection: {
      type: String,
      default: null
    },
    suggestionStatus: {
      type: String,
      enum: ['proposed', 'accepted', 'rejected', 'modified', 'none'],
      default: 'none'
    },
    detector: {
      type: String,
      enum: ['deterministic', 'ocr_visual', 'gemini_semantic'],
      default: 'deterministic'
    },
    override: {
      overridden: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      timestamp: { type: Date }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const submissionSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    submissionGroupId: {
      type: String,
      required: true,
      index: true
    },
    parentSubmissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      default: null
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    contentType: {
      type: String,
      enum: ['TEXT', 'PNG', 'JPG', 'PDF_BRIEF', 'DOCX_BRIEF'],
      required: true
    },
    contentRef: {
      type: String,
      default: null
    },
    originalFilename: {
      type: String,
      default: null
    },
    mimeType: {
      type: String,
      default: 'text/plain'
    },
    fileSizeBytes: {
      type: Number,
      default: 0
    },
    contentHash: {
      type: String,
      default: ''
    },
    extractedText: {
      type: String,
      default: ''
    },
    altText: {
      type: String,
      default: null
    },
    campaignId: {
      type: String,
      default: null,
      index: true
    },
    channel: {
      type: String,
      default: 'general',
      index: true
    },
    revisionNumber: {
      type: Number,
      required: true,
      default: 1
    },
    ruleVersionSnapshot: [
      {
        ruleId: { type: String, required: true },
        ruleVersion: { type: Number, required: true },
        sourceId: { type: String },
        sourceVersion: { type: String },
        contentHash: { type: String },
        category: { type: String },
        severity: { type: String },
        ruleText: { type: String },
        ruleConfig: { type: mongoose.Schema.Types.Mixed },
        snapshotAt: { type: Date, default: Date.now }
      }
    ],
    findings: [findingSchema],
    processing: {
      reviewRunId: { type: String },
      modelId: { type: String },
      ruleEngineVersion: { type: String, default: '1.0.0' },
      completedLayers: { type: [String], default: [] },
      failedLayers: { type: [String], default: [] },
      timestamps: {
        startedAt: { type: Date },
        completedAt: { type: Date }
      },
      errorCodes: { type: [String], default: [] },
      visualMetrics: {
        contrastRatio: { type: Number },
        paletteDeltaE: { type: Number },
        textColor: { type: String },
        bgColor: { type: String },
        ocrConfidence: { type: Number }
      }
    },
    status: {
      type: String,
      enum: [
        'draft',
        'submitted',
        'processing',
        'review_ready',
        'changes_requested',
        'approved',
        'rejected',
        'incomplete'
      ],
      default: 'submitted',
      index: true
    },
    decision: {
      actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      action: {
        type: String,
        enum: ['approve', 'request_changes', 'reject', 'override_finding']
      },
      reason: { type: String },
      comment: { type: String },
      timestamp: { type: Date }
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true
    }
  },
  {
    timestamps: true
  }
);

submissionSchema.index({ workspaceId: 1, submissionGroupId: 1, revisionNumber: 1 }, { unique: true });
submissionSchema.index({ workspaceId: 1, status: 1, submittedAt: -1 });
submissionSchema.index({ workspaceId: 1, creatorId: 1, createdAt: -1 });

export const Submission = mongoose.model('Submission', submissionSchema);
