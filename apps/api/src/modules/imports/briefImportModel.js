import mongoose from 'mongoose';
import { createModelProxy } from '../../config/modelProxy.js';

const briefImportSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    format: {
      type: String,
      enum: ['.pdf', '.docx'],
      required: true
    },
    contentRef: {
      type: String,
      required: true
    },
    contentHash: {
      type: String,
      required: true
    },
    extractedText: {
      type: String,
      default: ''
    },
    headings: {
      type: [String],
      default: []
    },
    pageCount: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['pending', 'extracted', 'failed', 'converted'],
      default: 'extracted',
      index: true
    },
    candidateRules: {
      type: [mongoose.Schema.Types.Mixed],
      default: []
    }
  },
  {
    timestamps: true
  }
);

const RawBriefImport = mongoose.model('BriefImport', briefImportSchema);
export const BriefImport = createModelProxy('BriefImport', RawBriefImport);
