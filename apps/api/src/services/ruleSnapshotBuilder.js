import crypto from 'crypto';
import { BrandRule } from '../modules/rules/brandRuleModel.js';

export class RuleSnapshotBuilder {
  /**
   * Resolves and freezes the exact active rules applicable for a review run
   */
  static async buildSnapshot({ workspaceId, campaignId = null, channel = null, reviewTime = new Date() }) {
    const query = {
      workspaceId,
      approvalStatus: 'approved',
      status: 'active',
      $and: [
        {
          $or: [
            { effectiveFrom: { $exists: false } },
            { effectiveFrom: null },
            { effectiveFrom: { $lte: reviewTime } }
          ]
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: reviewTime } }
          ]
        }
      ]
    };

    const candidateRules = await BrandRule.find(query);

    // Apply campaign and channel scoping filter
    const matchingRules = candidateRules.filter(rule => {
      // If rule specifies campaignIds, target must match
      if (rule.scope?.campaignIds?.length > 0) {
        if (!campaignId || !rule.scope.campaignIds.includes(campaignId)) {
          return false;
        }
      }
      // If rule specifies channels, target must match
      if (rule.scope?.channels?.length > 0) {
        if (!channel || !rule.scope.channels.includes(channel.toLowerCase())) {
          return false;
        }
      }
      return true;
    });

    // Build immutable snapshot items
    const snapshotItems = matchingRules.map(rule => {
      const normalizedContent = JSON.stringify({
        ruleId: rule.ruleId,
        ruleVersion: rule.ruleVersion,
        ruleText: rule.ruleText,
        ruleConfig: rule.ruleConfig,
        category: rule.category,
        severity: rule.severity,
        sourceId: rule.sourceId,
        sourceVersion: rule.sourceVersion
      });
      const contentHash = crypto.createHash('sha256').update(normalizedContent).digest('hex');

      return {
        ruleId: rule.ruleId,
        ruleVersion: rule.ruleVersion,
        sourceId: rule.sourceId,
        sourceVersion: rule.sourceVersion,
        contentHash,
        category: rule.category,
        severity: rule.severity,
        ruleText: rule.ruleText,
        ruleConfig: rule.ruleConfig,
        snapshotAt: reviewTime
      };
    });

    return snapshotItems;
  }
}
