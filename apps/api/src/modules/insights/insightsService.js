import { Submission } from '../submissions/submissionModel.js';
import { AuditEvent } from '../audit/auditEventModel.js';

export class InsightsService {
  /**
   * Aggregates real persisted submission and audit data for brand governance insights
   */
  static async getWorkspaceInsights({ workspaceId, from = null, to = null }) {
    const query = { workspaceId };
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    if (from || to) query.createdAt = dateFilter;

    const submissions = await Submission.find(query);
    const sampleSize = submissions.length;

    if (sampleSize === 0) {
      return {
        sampleSize: 0,
        totalSubmissions: 0,
        dateRange: { from, to },
        summary: 'No review submissions found in this workspace for the selected timeframe.',
        byClassification: {},
        byCategory: {},
        bySeverity: {},
        statusCounts: {
          PENDING_REVIEW: 0,
          IN_REVIEW: 0,
          CHANGES_REQUESTED: 0,
          APPROVED: 0,
          REJECTED: 0
        },
        firstTimeRightRate: 0,
        averageReviewTurnaroundHours: 0,
        totalOverrides: 0,
        topRecurringRules: [],
        topTriggeredRules: [],
        overriddenRules: [],
        topOverriddenRules: [],
        medianTurnaroundSeconds: null
      };
    }

    const classificationCounts = {
      CONFIRMED_RULE_CONFLICT: 0,
      NEEDS_VERIFICATION: 0,
      ADVISORY_STYLE_VISUAL_CONCERN: 0
    };

    const statusCounts = {
      PENDING_REVIEW: 0,
      IN_REVIEW: 0,
      CHANGES_REQUESTED: 0,
      APPROVED: 0,
      REJECTED: 0
    };

    const categoryCounts = {};
    const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
    const ruleViolationCounts = {};
    const turnarounds = [];
    let firstTimeRightCount = 0;

    for (const sub of submissions) {
      // Map status pipeline
      const rawStatus = String(sub.status || '').trim().toUpperCase();
      const decisionAction = String(sub.decision?.action || '').trim().toUpperCase();

      if (rawStatus === 'CHANGES_REQUESTED' || rawStatus === 'REQUEST_CHANGES' || decisionAction === 'REQUEST_CHANGES') {
        statusCounts.CHANGES_REQUESTED++;
      } else if (rawStatus === 'APPROVED' || rawStatus === 'APPROVE' || decisionAction === 'APPROVE') {
        statusCounts.APPROVED++;
        if (sub.revisionNumber === 1) {
          firstTimeRightCount++;
        }
      } else if (rawStatus === 'REJECTED' || rawStatus === 'REJECT' || decisionAction === 'REJECT') {
        statusCounts.REJECTED++;
      } else if (rawStatus === 'SUBMITTED' || rawStatus === 'DRAFT') {
        statusCounts.PENDING_REVIEW++;
      } else {
        statusCounts.IN_REVIEW++;
      }

      // Turnaround calculation
      if (sub.processing?.timestamps?.startedAt && sub.processing?.timestamps?.completedAt) {
        const diffSec = (new Date(sub.processing.timestamps.completedAt) - new Date(sub.processing.timestamps.startedAt)) / 1000;
        if (diffSec >= 0) turnarounds.push(diffSec);
      }

      for (const finding of sub.findings || []) {
        if (finding.classification && classificationCounts[finding.classification] !== undefined) {
          classificationCounts[finding.classification]++;
        }
        if (finding.category) {
          categoryCounts[finding.category] = (categoryCounts[finding.category] || 0) + 1;
        }
        if (finding.severity && severityCounts[finding.severity] !== undefined) {
          severityCounts[finding.severity]++;
        }
        for (const ref of finding.ruleRefs || []) {
          ruleViolationCounts[ref.ruleId] = (ruleViolationCounts[ref.ruleId] || 0) + 1;
        }
      }
    }

    // Top recurring rule violations
    const topRecurringRules = Object.entries(ruleViolationCounts)
      .map(([ruleId, count]) => ({ ruleId, count, triggerCount: count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Overridden findings count from real AuditEvents
    const overrideEvents = await AuditEvent.find({
      workspaceId,
      action: 'FINDING_OVERRIDDEN'
    });

    const overrideRuleCounts = {};
    for (const event of overrideEvents) {
      const ruleId = event.metadata?.ruleId || event.metadata?.category || 'general';
      overrideRuleCounts[ruleId] = (overrideRuleCounts[ruleId] || 0) + 1;
    }

    const overriddenRules = Object.entries(overrideRuleCounts)
      .map(([ruleId, count]) => ({ ruleId, count, overrideCount: count }))
      .sort((a, b) => b.count - a.count);

    const totalOverrides = Object.values(overrideRuleCounts).reduce((a, b) => a + b, 0);

    // Turnaround math
    turnarounds.sort((a, b) => a - b);
    let medianTurnaroundSeconds = null;
    let averageReviewTurnaroundHours = 0;
    if (turnarounds.length > 0) {
      const mid = Math.floor(turnarounds.length / 2);
      medianTurnaroundSeconds = turnarounds.length % 2 !== 0 ? turnarounds[mid] : parseFloat(((turnarounds[mid - 1] + turnarounds[mid]) / 2).toFixed(2));
      const avgSec = turnarounds.reduce((a, b) => a + b, 0) / turnarounds.length;
      averageReviewTurnaroundHours = parseFloat((avgSec / 3600).toFixed(2));
    }

    const firstTimeRightRate = sampleSize > 0 ? parseFloat((firstTimeRightCount / sampleSize).toFixed(2)) : 0;

    return {
      sampleSize,
      totalSubmissions: sampleSize,
      dateRange: { from, to },
      byClassification: classificationCounts,
      byCategory: categoryCounts,
      bySeverity: severityCounts,
      statusCounts,
      firstTimeRightRate,
      averageReviewTurnaroundHours,
      totalOverrides,
      topRecurringRules,
      topTriggeredRules: topRecurringRules,
      overriddenRules,
      topOverriddenRules: overriddenRules,
      medianTurnaroundSeconds
    };
  }
}
