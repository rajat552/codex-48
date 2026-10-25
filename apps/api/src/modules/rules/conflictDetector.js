import { BrandRule } from './brandRuleModel.js';

export class ConflictDetector {
  /**
   * Detects deterministic conflicts between candidate rule and existing active rules
   */
  static async checkConflicts(workspaceId, candidate) {
    const conflicts = [];
    const activeRules = await BrandRule.find({
      workspaceId,
      status: 'active',
      approvalStatus: 'approved'
    });

    const candidateConfig = candidate.ruleConfig || {};
    const candidateScope = candidate.scope || { campaignIds: [], channels: [] };
    const candidateEffective = candidate.effectiveFrom ? new Date(candidate.effectiveFrom) : null;
    const candidateExpires = candidate.expiresAt ? new Date(candidate.expiresAt) : null;

    for (const rule of activeRules) {
      // Skip if evaluating against the same logical rule being updated
      if (candidate.ruleId && rule.ruleId === candidate.ruleId) {
        continue;
      }

      // Check scope overlap
      const scopeOverlaps = this.doScopesOverlap(candidateScope, rule.scope || {});
      if (!scopeOverlaps) {
        continue;
      }

      // Check date window overlap
      const dateOverlaps = this.doDatesOverlap(
        candidateEffective,
        candidateExpires,
        rule.effectiveFrom,
        rule.expiresAt
      );
      if (!dateOverlaps) {
        continue;
      }

      const existingConfig = rule.ruleConfig || {};

      // 1. Terminology conflicts (opposing prohibited vs preferred/required terms)
      if (candidate.category === 'terminology' && rule.category === 'terminology') {
        const candidateProhibited = (candidateConfig.prohibitedTerms || []).map(t => t.toLowerCase());
        const candidatePreferred = (candidateConfig.preferredTerm || '').toLowerCase();
        const existingProhibited = (existingConfig.prohibitedTerms || []).map(t => t.toLowerCase());
        const existingPreferred = (existingConfig.preferredTerm || '').toLowerCase();

        // If candidate's preferred term is prohibited in existing rule
        if (candidatePreferred && existingProhibited.includes(candidatePreferred)) {
          conflicts.push({
            conflictType: 'TERMINOLOGY_CONTRADICTION',
            severity: 'critical',
            isDeterministic: true,
            existingRuleId: rule.ruleId,
            existingRuleVersion: rule.ruleVersion,
            overlapReason: `Candidate rule prefers term "${candidateConfig.preferredTerm}", but existing active rule ${rule.ruleId} explicitly prohibits it.`
          });
        }

        // If existing rule's preferred term is prohibited in candidate
        if (existingPreferred && candidateProhibited.includes(existingPreferred)) {
          conflicts.push({
            conflictType: 'TERMINOLOGY_CONTRADICTION',
            severity: 'critical',
            isDeterministic: true,
            existingRuleId: rule.ruleId,
            existingRuleVersion: rule.ruleVersion,
            overlapReason: `Candidate rule prohibits term "${existingConfig.preferredTerm}", which is required/preferred by existing active rule ${rule.ruleId}.`
          });
        }
      }

      // 2. Promotional Condition conflicts (incompatible minimum order values or benefits)
      if (candidate.category === 'promotional_condition' && rule.category === 'promotional_condition') {
        if (
          candidateConfig.benefit === 'free_shipping' &&
          existingConfig.benefit === 'free_shipping'
        ) {
          const candidateMin = candidateConfig.minimumExclusive !== undefined ? candidateConfig.minimumExclusive : candidateConfig.minimumOrderValue;
          const existingMin = existingConfig.minimumExclusive !== undefined ? existingConfig.minimumExclusive : existingConfig.minimumOrderValue;

          if (candidateMin !== undefined && existingMin !== undefined && candidateMin !== existingMin) {
            conflicts.push({
              conflictType: 'PROMOTIONAL_CONDITION_CONTRADICTION',
              severity: 'critical',
              isDeterministic: true,
              existingRuleId: rule.ruleId,
              existingRuleVersion: rule.ruleVersion,
              overlapReason: `Candidate specifies free shipping minimum threshold ${candidateMin}, contradicting active rule ${rule.ruleId} threshold ${existingMin} during overlapping validity period.`
            });
          }
        }
      }

      // 3. Required vs Prohibited phrase conflicts
      if (
        (candidate.category === 'disclaimer' && rule.category === 'terminology') ||
        (candidate.category === 'terminology' && rule.category === 'disclaimer')
      ) {
        const requiredPhrase = (candidateConfig.requiredPhrase || existingConfig.requiredPhrase || '').toLowerCase();
        const prohibitedList = [
          ...(candidateConfig.prohibitedTerms || []),
          ...(existingConfig.prohibitedTerms || [])
        ].map(t => t.toLowerCase());

        if (requiredPhrase && prohibitedList.some(p => requiredPhrase.includes(p))) {
          conflicts.push({
            conflictType: 'DISCLAIMER_PHRASE_CONFLICT',
            severity: 'high',
            isDeterministic: true,
            existingRuleId: rule.ruleId,
            existingRuleVersion: rule.ruleVersion,
            overlapReason: `Required disclaimer phrase contains prohibited term from active rule ${rule.ruleId}.`
          });
        }
      }

      // 4. Overlapping validity window with opposing severity or duplicate rule intent
      if (candidate.category === rule.category && candidate.ruleText.toLowerCase() === rule.ruleText.toLowerCase()) {
        conflicts.push({
          conflictType: 'DUPLICATE_ACTIVE_RULE',
          severity: 'medium',
          isDeterministic: true,
          existingRuleId: rule.ruleId,
          existingRuleVersion: rule.ruleVersion,
          overlapReason: `Identical rule text already active under rule ${rule.ruleId} v${rule.ruleVersion}.`
        });
      }
    }

    return conflicts;
  }

  static doScopesOverlap(scopeA, scopeB) {
    const campaignsA = scopeA.campaignIds || [];
    const campaignsB = scopeB.campaignIds || [];
    const channelsA = scopeA.channels || [];
    const channelsB = scopeB.channels || [];

    // If both specify campaigns, they must have at least one common campaign
    if (campaignsA.length > 0 && campaignsB.length > 0) {
      const hasCommon = campaignsA.some(c => campaignsB.includes(c));
      if (!hasCommon) return false;
    }

    // If both specify channels, they must have at least one common channel
    if (channelsA.length > 0 && channelsB.length > 0) {
      const hasCommon = channelsA.some(c => channelsB.map(x => x.toLowerCase()).includes(c.toLowerCase()));
      if (!hasCommon) return false;
    }

    return true;
  }

  static doDatesOverlap(startA, endA, startB, endB) {
    // If either has no start/end date, it spans all time
    const aFrom = startA ? startA.getTime() : -Infinity;
    const aTo = endA ? endA.getTime() : Infinity;
    const bFrom = startB ? new Date(startB).getTime() : -Infinity;
    const bTo = endB ? new Date(endB).getTime() : Infinity;

    return aFrom < bTo && aTo > bFrom;
  }
}
