import { v4 as uuidv4 } from 'uuid';
import { Submission } from '../modules/submissions/submissionModel.js';
import { RuleSnapshotBuilder } from './ruleSnapshotBuilder.js';
import { DeterministicEngine } from './deterministicEngine.js';
import { VisualEngine } from '../modules/visual/visualEngine.js';
import { GeminiProvider } from '../providers/geminiProvider.js';
import { EvidenceValidator } from './evidenceValidator.js';
import { AuditService } from '../modules/audit/auditService.js';
import { fileStorage } from '../storage/fileStorage.js';
import { logger } from '../config/logger.js';

export class ReviewOrchestrator {
  static async executeReview(submissionId) {
    const reviewRunId = `run_${uuidv4().replace(/-/g, '').slice(0, 16)}`;
    const startedAt = new Date();

    const submission = await Submission.findById(submissionId);
    if (!submission) {
      throw new Error(`Submission ${submissionId} not found.`);
    }

    logger.info('Starting review orchestration', {
      submissionId: submission._id.toString(),
      reviewRunId,
      contentType: submission.contentType
    });

    const isDecided = ['approved', 'rejected', 'changes_requested'].includes(submission.status);
    if (!isDecided) {
      submission.status = 'processing';
      await submission.save();
    }

    const completedLayers = [];
    const failedLayers = [];
    const errorCodes = [];

    // 1. Build and freeze active rules snapshot
    const activeRules = await RuleSnapshotBuilder.buildSnapshot({
      workspaceId: submission.workspaceId,
      campaignId: submission.campaignId,
      channel: submission.channel,
      reviewTime: startedAt
    });

    submission.ruleVersionSnapshot = activeRules;
    await submission.save();
    completedLayers.push('rule_snapshot');

    let textToAnalyze = submission.extractedText || '';
    let visualMetrics = null;

    // 2. Visual / OCR layer if static creative image
    if (submission.contentType === 'PNG' || submission.contentType === 'JPG') {
      try {
        if (submission.contentRef) {
          const imageBuffer = await fileStorage.get(submission.contentRef);
          const visualResult = await VisualEngine.processImage(imageBuffer, activeRules);

          visualMetrics = visualResult.visualMetrics;
          submission.processing.visualMetrics = visualMetrics;

          if (visualResult.extractedText) {
            textToAnalyze = `${textToAnalyze} ${visualResult.extractedText}`.trim();
            submission.extractedText = textToAnalyze;
          }

          if (visualResult.ocrError) {
            failedLayers.push('ocr');
            errorCodes.push('OCR_EXTRACTION_FAILED');
          } else {
            completedLayers.push('ocr_visual');
          }
        }
      } catch (err) {
        logger.error('Visual layer processing error', { error: err.message, submissionId: submission._id });
        failedLayers.push('ocr_visual');
        errorCodes.push('VISUAL_PROCESSING_ERROR');
      }
    }

    // 3. Deterministic Validation Layer
    let deterministicFindings = [];
    try {
      deterministicFindings = DeterministicEngine.evaluate({
        text: textToAnalyze,
        visualMetrics,
        activeRules
      });
      completedLayers.push('deterministic');
    } catch (err) {
      logger.error('Deterministic engine error', { error: err.message, submissionId: submission._id });
      failedLayers.push('deterministic');
      errorCodes.push('DETERMINISTIC_EVAL_ERROR');
    }

    // 4. Semantic AI Review Layer (Gemini)
    let aiResult = null;
    try {
      aiResult = await GeminiProvider.analyzeContent({
        text: textToAnalyze,
        activeRules,
        requestId: reviewRunId
      });

      if (aiResult.success) {
        completedLayers.push('gemini_semantic');
      } else if (aiResult.skipped) {
        completedLayers.push('gemini_semantic_skipped');
      } else {
        failedLayers.push('gemini_semantic');
        errorCodes.push(aiResult.error || 'GEMINI_PROVIDER_FAILURE');
      }
    } catch (err) {
      logger.error('Gemini layer error', { error: err.message, submissionId: submission._id });
      failedLayers.push('gemini_semantic');
      errorCodes.push('GEMINI_UNEXPECTED_ERROR');
    }

    // 5. Evidence & Citation Validation
    const validatedFindings = EvidenceValidator.validate({
      deterministicFindings,
      aiResult,
      activeRules
    });
    completedLayers.push('evidence_validation');

    // 6. Update Submission status & processing metadata
    const completedAt = new Date();
    submission.findings = validatedFindings;
    const finalVisualMetrics = visualMetrics || submission.processing?.visualMetrics;
    const processingData = {
      reviewRunId,
      modelId: aiResult?.modelId || 'none',
      ruleEngineVersion: '1.0.0',
      completedLayers,
      failedLayers,
      timestamps: {
        startedAt,
        completedAt
      },
      errorCodes
    };
    if (finalVisualMetrics && typeof finalVisualMetrics === 'object' && Object.keys(finalVisualMetrics).length > 0) {
      processingData.visualMetrics = finalVisualMetrics;
    }
    submission.processing = processingData;

    // Safe Failure Semantics (Section G5 & Non-negotiable principle 7)
    // If OCR failed or an AI call was attempted and failed, mark INCOMPLETE
    // Preserve human reviewer decision if already made (e.g. approved / rejected)
    if (!isDecided) {
      if (failedLayers.includes('ocr') || (failedLayers.includes('gemini_semantic') && !aiResult?.skipped)) {
        submission.status = 'incomplete';
      } else {
        submission.status = 'review_ready';
      }
    }

    await submission.save();

    await AuditService.recordEvent({
      workspaceId: submission.workspaceId,
      actorId: 'SYSTEM',
      entityType: 'Submission',
      entityId: submission._id,
      action: 'REVIEW_COMPLETED',
      fromState: 'processing',
      toState: submission.status,
      metadata: {
        reviewRunId,
        findingsCount: validatedFindings.length,
        status: submission.status
      }
    });

    logger.info('Review orchestration completed', {
      submissionId: submission._id.toString(),
      status: submission.status,
      findingsCount: validatedFindings.length
    });

    return submission;
  }
}
