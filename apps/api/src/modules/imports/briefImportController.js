import path from 'path';
import { BriefImport } from './briefImportModel.js';
import { BriefParser } from './briefParser.js';
import { fileStorage } from '../../storage/fileStorage.js';
import { validateFileSignature } from '../../middleware/uploadGuard.js';
import { ConflictDetector } from '../rules/conflictDetector.js';
import { RuleService } from '../rules/ruleService.js';
import { ValidationError, NotFoundError } from '../../middleware/errorHandler.js';

export class BriefImportController {
  static async uploadAndParse(req, res, next) {
    try {
      const file = req.file;
      if (!file) {
        throw new ValidationError('A PDF or DOCX file must be uploaded.');
      }

      // Validate signature & format
      validateFileSignature(file.buffer, file.mimetype, file.originalname);
      const ext = path.extname(file.originalname).toLowerCase();

      // Save file privately
      const storageKey = fileStorage.generateKey(file.originalname);
      const saved = await fileStorage.save(file.buffer, storageKey);

      // Parse brief text & headings
      const parsed = await BriefParser.parseBrief(file.buffer, file.originalname);

      // Inferred candidate rules from headings/statements (stay unapproved candidates)
      const candidateRules = parsed.headings.map((heading, idx) => ({
        candidateId: `cand_${idx + 1}`,
        ruleId: `BRIEF-${idx + 101}`,
        category: 'product_fact',
        ruleText: heading,
        ruleConfig: {},
        sourceId: `brief-${saved.contentHash.slice(0, 8)}`,
        sourceVersion: 'v1.0'
      }));

      const briefImport = await BriefImport.create({
        workspaceId: req.workspace._id,
        creatorId: req.user.userId,
        originalFilename: file.originalname,
        format: ext,
        contentRef: saved.key,
        contentHash: saved.contentHash,
        extractedText: parsed.extractedText,
        headings: parsed.headings,
        pageCount: parsed.pageCount,
        status: 'extracted',
        candidateRules
      });

      return res.status(201).json({
        data: briefImport,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getById(req, res, next) {
    try {
      const { importId } = req.params;
      const briefImport = await BriefImport.findOne({
        _id: importId,
        workspaceId: req.workspace._id
      });

      if (!briefImport) {
        throw new NotFoundError('Brief import record not found.');
      }

      return res.status(200).json({
        data: briefImport,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async convertToRules(req, res, next) {
    try {
      const { importId } = req.params;
      const { selectedCandidateIds = [] } = req.body;

      const briefImport = await BriefImport.findOne({
        _id: importId,
        workspaceId: req.workspace._id
      });

      if (!briefImport) {
        throw new NotFoundError('Brief import record not found.');
      }

      const createdDrafts = [];
      const conflictWarnings = [];

      const candidatesToConvert = briefImport.candidateRules.filter(
        c => selectedCandidateIds.length === 0 || selectedCandidateIds.includes(c.candidateId)
      );

      for (const candidate of candidatesToConvert) {
        const conflicts = await ConflictDetector.checkConflicts(req.workspace._id, candidate);
        if (conflicts.length > 0) {
          conflictWarnings.push({
            candidateId: candidate.candidateId,
            ruleText: candidate.ruleText,
            conflicts
          });
        }

        // Create as unapproved draft rule (Section K1: Admin must review and activate)
        const draft = await RuleService.createDraft(req.workspace._id, req.user.userId, {
          ruleId: candidate.ruleId,
          category: candidate.category || 'product_fact',
          severity: 'medium',
          ruleText: candidate.ruleText,
          ruleConfig: {},
          sourceId: candidate.sourceId,
          sourceVersion: 'v1.0',
          sourceMetadata: {
            title: briefImport.originalFilename,
            reference: `Imported from ${briefImport.originalFilename}`
          }
        });

        createdDrafts.push(draft);
      }

      briefImport.status = 'converted';
      await briefImport.save();

      return res.status(200).json({
        data: {
          convertedCount: createdDrafts.length,
          drafts: createdDrafts,
          conflictWarnings
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
