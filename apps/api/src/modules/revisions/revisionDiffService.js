import * as diff from 'diff';
import { Submission } from '../submissions/submissionModel.js';
import { NotFoundError, ValidationError } from '../../middleware/errorHandler.js';

export class RevisionDiffService {
  /**
   * Compares two revisions belonging to the same logical submission group
   */
  static async compareRevisions({ workspaceId, submissionId, fromRevision, toRevision }) {
    const baseSubmission = await Submission.findOne({ _id: submissionId, workspaceId });
    if (!baseSubmission) {
      throw new NotFoundError('Base submission not found in this workspace.');
    }

    const groupId = baseSubmission.submissionGroupId;

    const fromSub = await Submission.findOne({
      workspaceId,
      submissionGroupId: groupId,
      revisionNumber: parseInt(fromRevision, 10)
    });

    const toSub = await Submission.findOne({
      workspaceId,
      submissionGroupId: groupId,
      revisionNumber: parseInt(toRevision, 10)
    });

    if (!fromSub || !toSub) {
      throw new NotFoundError(`Could not find revisions ${fromRevision} and ${toRevision} in submission group ${groupId}.`);
    }

    // 1. Text difference analysis
    const oldText = fromSub.extractedText || '';
    const newText = toSub.extractedText || '';
    const wordDiff = diff.diffWords(oldText, newText);

    const textSummary = {
      oldLength: oldText.length,
      newLength: newText.length,
      hasChanges: oldText !== newText,
      chunks: wordDiff.map(part => ({
        value: part.value,
        added: Boolean(part.added),
        removed: Boolean(part.removed)
      }))
    };

    // 2. Visual metrics comparison
    const oldMetrics = fromSub.processing?.visualMetrics || {};
    const newMetrics = toSub.processing?.visualMetrics || {};

    const visualComparison = {
      contrast: {
        oldValue: oldMetrics.contrastRatio !== undefined ? oldMetrics.contrastRatio : null,
        newValue: newMetrics.contrastRatio !== undefined ? newMetrics.contrastRatio : null,
        delta: (newMetrics.contrastRatio !== undefined && oldMetrics.contrastRatio !== undefined)
          ? parseFloat((newMetrics.contrastRatio - oldMetrics.contrastRatio).toFixed(2))
          : null
      },
      paletteDeltaE: {
        oldValue: oldMetrics.paletteDeltaE !== undefined ? oldMetrics.paletteDeltaE : null,
        newValue: newMetrics.paletteDeltaE !== undefined ? newMetrics.paletteDeltaE : null
      },
      colors: {
        oldTextColor: oldMetrics.textColor || null,
        newTextColor: newMetrics.textColor || null,
        oldBgColor: oldMetrics.bgColor || null,
        newBgColor: newMetrics.bgColor || null
      }
    };

    // 3. Findings resolution status
    const oldFindings = fromSub.findings || [];
    const newFindings = toSub.findings || [];

    const oldRuleIds = new Set(oldFindings.flatMap(f => (f.ruleRefs || []).map(r => r.ruleId)));
    const newRuleIds = new Set(newFindings.flatMap(f => (f.ruleRefs || []).map(r => r.ruleId)));

    const resolved = oldFindings.filter(of => {
      const ids = (of.ruleRefs || []).map(r => r.ruleId);
      return ids.length > 0 && ids.every(id => !newRuleIds.has(id));
    });

    const persisting = newFindings.filter(nf => {
      const ids = (nf.ruleRefs || []).map(r => r.ruleId);
      return ids.some(id => oldRuleIds.has(id));
    });

    const newlyIntroduced = newFindings.filter(nf => {
      const ids = (nf.ruleRefs || []).map(r => r.ruleId);
      return ids.length === 0 || ids.every(id => !oldRuleIds.has(id));
    });

    return {
      submissionGroupId: groupId,
      fromRevision: fromSub.revisionNumber,
      toRevision: toSub.revisionNumber,
      fromSubmissionId: fromSub._id,
      toSubmissionId: toSub._id,
      textDiff: textSummary,
      visualComparison,
      findingsDiff: {
        resolvedCount: resolved.length,
        persistingCount: persisting.length,
        newCount: newlyIntroduced.length,
        resolved,
        persisting,
        newlyIntroduced
      }
    };
  }
}
