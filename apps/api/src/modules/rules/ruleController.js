import { RuleService } from './ruleService.js';
import { ConflictDetector } from './conflictDetector.js';

export class RuleController {
  static async listRules(req, res, next) {
    try {
      const { status, category, approvalStatus } = req.query;
      const rules = await RuleService.listRules(req.workspace._id, { status, category, approvalStatus });
      return res.status(200).json({
        data: rules,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createDraft(req, res, next) {
    try {
      const rule = await RuleService.createDraft(req.workspace._id, req.user.userId, req.body);
      return res.status(201).json({
        data: rule,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRuleVersions(req, res, next) {
    try {
      const { ruleId } = req.params;
      const versions = await RuleService.getRuleVersions(req.workspace._id, ruleId);
      return res.status(200).json({
        data: versions,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async createVersion(req, res, next) {
    try {
      const { ruleId } = req.params;
      const rule = await RuleService.createVersion(req.workspace._id, req.user.userId, ruleId, req.body);
      return res.status(201).json({
        data: rule,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async approve(req, res, next) {
    try {
      const { ruleId } = req.params;
      const { decision, reason, version } = req.body;
      const rule = await RuleService.approveRule(req.workspace._id, req.user.userId, ruleId, version, decision, reason);
      return res.status(200).json({
        data: rule,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async activate(req, res, next) {
    try {
      const { ruleId } = req.params;
      const { version } = req.body;
      const rule = await RuleService.activateRule(req.workspace._id, req.user.userId, ruleId, version);
      return res.status(200).json({
        data: rule,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async archive(req, res, next) {
    try {
      const { ruleId } = req.params;
      const { version, reason } = req.body;
      const rule = await RuleService.archiveRule(req.workspace._id, req.user.userId, ruleId, version, reason);
      return res.status(200).json({
        data: rule,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async checkConflicts(req, res, next) {
    try {
      const conflicts = await ConflictDetector.checkConflicts(req.workspace._id, req.body);
      return res.status(200).json({
        data: {
          hasConflicts: conflicts.length > 0,
          conflictCount: conflicts.length,
          conflicts
        },
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }

  static async importRules(req, res, next) {
    try {
      const { rules = [] } = req.body;
      const results = [];

      for (const ruleData of rules) {
        const conflicts = await ConflictDetector.checkConflicts(req.workspace._id, ruleData);
        if (conflicts.length > 0) {
          results.push({
            ruleId: ruleData.ruleId,
            status: 'conflict_flagged',
            conflicts
          });
        } else {
          const draft = await RuleService.createDraft(req.workspace._id, req.user.userId, ruleData);
          results.push({
            ruleId: ruleData.ruleId,
            status: 'draft_created',
            rule: draft
          });
        }
      }

      return res.status(200).json({
        data: results,
        meta: { requestId: req.requestId }
      });
    } catch (err) {
      next(err);
    }
  }
}
