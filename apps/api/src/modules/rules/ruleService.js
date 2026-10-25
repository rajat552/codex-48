import crypto from 'crypto';
import { BrandRule } from './brandRuleModel.js';
import { AuditService } from '../audit/auditService.js';
import { ValidationError, NotFoundError, ConflictError } from '../../middleware/errorHandler.js';

export class RuleService {
  static computeContentHash(data) {
    const serialized = JSON.stringify({
      ruleId: data.ruleId,
      ruleText: data.ruleText,
      ruleConfig: data.ruleConfig,
      category: data.category,
      severity: data.severity,
      scope: data.scope,
      sourceId: data.sourceId,
      sourceVersion: data.sourceVersion
    });
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  static async createDraft(workspaceId, actorId, data) {
    if (!data.ruleId || !data.ruleText || !data.category || !data.sourceId) {
      throw new ValidationError('ruleId, ruleText, category, and sourceId are required.');
    }

    const existing = await BrandRule.findOne({
      workspaceId,
      ruleId: data.ruleId.trim()
    });

    if (existing) {
      throw new ConflictError(`Rule with ruleId ${data.ruleId} already exists. Create a new version instead.`);
    }

    const contentHash = this.computeContentHash(data);

    const rule = await BrandRule.create({
      workspaceId,
      ruleId: data.ruleId.trim(),
      ruleVersion: 1,
      category: data.category,
      severity: data.severity || 'medium',
      ruleText: data.ruleText.trim(),
      ruleConfig: data.ruleConfig || {},
      scope: data.scope || { campaignIds: [], channels: [] },
      sourceId: data.sourceId.trim(),
      sourceVersion: data.sourceVersion || 'v1.0',
      sourceMetadata: data.sourceMetadata || {},
      approvalStatus: 'draft',
      status: 'draft',
      effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
      createdBy: actorId,
      contentHash
    });

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'BrandRule',
      entityId: rule._id,
      action: 'RULE_CREATED',
      fromState: null,
      toState: 'draft',
      metadata: { ruleId: rule.ruleId, ruleVersion: 1 }
    });

    return rule;
  }

  static async createVersion(workspaceId, actorId, ruleId, data) {
    const latest = await BrandRule.findOne({ workspaceId, ruleId }).sort({ ruleVersion: -1 });
    if (!latest) {
      throw new NotFoundError(`Rule ${ruleId} not found.`);
    }

    const newVersionNumber = latest.ruleVersion + 1;
    const mergedData = {
      ruleId,
      ruleText: data.ruleText !== undefined ? data.ruleText : latest.ruleText,
      ruleConfig: data.ruleConfig !== undefined ? data.ruleConfig : latest.ruleConfig,
      category: data.category || latest.category,
      severity: data.severity || latest.severity,
      scope: data.scope || latest.scope,
      sourceId: data.sourceId || latest.sourceId,
      sourceVersion: data.sourceVersion || latest.sourceVersion,
      sourceMetadata: data.sourceMetadata || latest.sourceMetadata,
      effectiveFrom: data.effectiveFrom !== undefined ? data.effectiveFrom : latest.effectiveFrom,
      expiresAt: data.expiresAt !== undefined ? data.expiresAt : latest.expiresAt
    };

    const contentHash = this.computeContentHash(mergedData);

    const newRuleVersion = await BrandRule.create({
      workspaceId,
      ruleId,
      ruleVersion: newVersionNumber,
      category: mergedData.category,
      severity: mergedData.severity,
      ruleText: mergedData.ruleText,
      ruleConfig: mergedData.ruleConfig,
      scope: mergedData.scope,
      sourceId: mergedData.sourceId,
      sourceVersion: mergedData.sourceVersion,
      sourceMetadata: mergedData.sourceMetadata,
      approvalStatus: 'draft',
      status: 'draft',
      effectiveFrom: mergedData.effectiveFrom ? new Date(mergedData.effectiveFrom) : null,
      expiresAt: mergedData.expiresAt ? new Date(mergedData.expiresAt) : null,
      createdBy: actorId,
      contentHash
    });

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'BrandRule',
      entityId: newRuleVersion._id,
      action: 'RULE_VERSIONED',
      fromState: `v${latest.ruleVersion}`,
      toState: `v${newVersionNumber}`,
      metadata: { ruleId, ruleVersion: newVersionNumber }
    });

    return newRuleVersion;
  }

  static async approveRule(workspaceId, actorId, ruleId, version, decision = 'approve', reason = '') {
    const rule = await BrandRule.findOne({
      workspaceId,
      ruleId,
      ruleVersion: version || 1
    });

    if (!rule) {
      throw new NotFoundError(`Rule ${ruleId} version ${version || 1} not found.`);
    }

    if (decision === 'reject') {
      if (!reason) throw new ValidationError('Reason is required when rejecting a rule.');
      rule.approvalStatus = 'rejected';
      await rule.save();

      await AuditService.recordEvent({
        workspaceId,
        actorId,
        entityType: 'BrandRule',
        entityId: rule._id,
        action: 'RULE_REJECTED',
        fromState: 'draft',
        toState: 'rejected',
        reason
      });
      return rule;
    }

    rule.approvalStatus = 'approved';
    rule.approvedBy = actorId;
    rule.approvedAt = new Date();
    await rule.save();

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'BrandRule',
      entityId: rule._id,
      action: 'RULE_APPROVED',
      fromState: 'draft',
      toState: 'approved',
      reason
    });

    return rule;
  }

  static async activateRule(workspaceId, actorId, ruleId, version) {
    const rule = await BrandRule.findOne({
      workspaceId,
      ruleId,
      ruleVersion: version || 1
    });

    if (!rule) {
      throw new NotFoundError(`Rule ${ruleId} version ${version || 1} not found.`);
    }

    if (rule.approvalStatus !== 'approved') {
      throw new ValidationError('Only approved rules can be activated.');
    }

    // Supersede previously active versions of this same logical rule
    await BrandRule.updateMany(
      {
        workspaceId,
        ruleId,
        status: 'active',
        _id: { $ne: rule._id }
      },
      {
        status: 'superseded'
      }
    );

    rule.status = 'active';
    await rule.save();

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'BrandRule',
      entityId: rule._id,
      action: 'RULE_ACTIVATED',
      fromState: 'approved',
      toState: 'active',
      metadata: { ruleId, version: rule.ruleVersion }
    });

    return rule;
  }

  static async archiveRule(workspaceId, actorId, ruleId, version, reason = '') {
    const rule = await BrandRule.findOne({
      workspaceId,
      ruleId,
      ruleVersion: version || 1
    });

    if (!rule) {
      throw new NotFoundError(`Rule ${ruleId} not found.`);
    }

    const previousStatus = rule.status;
    rule.status = 'archived';
    await rule.save();

    await AuditService.recordEvent({
      workspaceId,
      actorId,
      entityType: 'BrandRule',
      entityId: rule._id,
      action: 'RULE_ARCHIVED',
      fromState: previousStatus,
      toState: 'archived',
      reason
    });

    return rule;
  }

  static async listRules(workspaceId, filters = {}) {
    const query = { workspaceId };
    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.approvalStatus) query.approvalStatus = filters.approvalStatus;

    return await BrandRule.find(query).sort({ ruleId: 1, ruleVersion: -1 });
  }

  static async getRuleVersions(workspaceId, ruleId) {
    const rules = await BrandRule.find({ workspaceId, ruleId }).sort({ ruleVersion: -1 });
    if (!rules || rules.length === 0) {
      throw new NotFoundError(`Rule ${ruleId} not found.`);
    }
    return rules;
  }
}
