import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { BrandRule } from '../../src/modules/rules/brandRuleModel.js';
import { Workspace } from '../../src/modules/workspaces/workspaceModel.js';
import { User } from '../../src/modules/auth/userModel.js';
import { ConflictDetector } from '../../src/modules/rules/conflictDetector.js';

describe('Automated Rule Conflict Detector (REQ-15, Named Improvement 2)', () => {
  let workspace;
  let user;

  before(async () => {
    await connectDatabase();
    user = await User.create({
      displayName: 'Test Admin',
      email: `admin-conflict-${Date.now()}@test.com`,
      passwordHash: 'hash'
    });
    workspace = await Workspace.create({
      name: 'Conflict Test Workspace',
      slug: `conflict-ws-${Date.now()}`,
      createdBy: user._id
    });

    // Seed baseline active rules
    await BrandRule.create([
      {
        workspaceId: workspace._id,
        ruleId: 'TERM-BASE',
        ruleVersion: 1,
        category: 'terminology',
        severity: 'high',
        ruleText: 'Never use the term "guaranteed". Use "verified" instead.',
        ruleConfig: {
          prohibitedTerms: ['guaranteed'],
          preferredTerm: 'verified'
        },
        scope: { campaignIds: ['campaign-global'], channels: ['web'] },
        sourceId: 'term-source',
        approvalStatus: 'approved',
        status: 'active',
        createdBy: user._id
      },
      {
        workspaceId: workspace._id,
        ruleId: 'PR-BASE',
        ruleVersion: 1,
        category: 'promotional_condition',
        severity: 'high',
        ruleText: 'Free shipping on orders above INR 999.',
        ruleConfig: {
          benefit: 'free_shipping',
          minimumExclusive: 999
        },
        scope: { campaignIds: ['summer-2026'], channels: ['instagram'] },
        effectiveFrom: new Date('2026-06-01T00:00:00Z'),
        expiresAt: new Date('2026-08-31T23:59:59Z'),
        sourceId: 'promo-source',
        approvalStatus: 'approved',
        status: 'active',
        createdBy: user._id
      },
      {
        workspaceId: workspace._id,
        ruleId: 'DISC-BASE',
        ruleVersion: 1,
        category: 'disclaimer',
        severity: 'medium',
        ruleText: 'Promotions must state "*Terms and conditions apply".',
        ruleConfig: {
          requiredPhrase: '*Terms and conditions apply'
        },
        scope: { campaignIds: ['campaign-global'], channels: ['web'] },
        sourceId: 'disc-source',
        approvalStatus: 'approved',
        status: 'active',
        createdBy: user._id
      }
    ]);
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('Planted Conflict 1: Candidate requiring prohibited term "guaranteed" is detected', async () => {
    const candidate = {
      ruleId: 'CAND-TERM-1',
      category: 'terminology',
      ruleText: 'Always emphasize "guaranteed" results in copy.',
      ruleConfig: {
        preferredTerm: 'guaranteed'
      },
      scope: { campaignIds: ['campaign-global'], channels: ['web'] }
    };

    const conflicts = await ConflictDetector.checkConflicts(workspace._id, candidate);
    assert.ok(conflicts.length > 0, 'Expected conflict to be flagged');
    assert.strictEqual(conflicts[0].conflictType, 'TERMINOLOGY_CONTRADICTION');
    assert.strictEqual(conflicts[0].existingRuleId, 'TERM-BASE');
  });

  test('Planted Conflict 2: Candidate with incompatible free shipping threshold (499 vs 999) in overlapping date window is detected', async () => {
    const candidate = {
      ruleId: 'CAND-PROMO-1',
      category: 'promotional_condition',
      ruleText: 'Free shipping on orders above INR 499.',
      ruleConfig: {
        benefit: 'free_shipping',
        minimumExclusive: 499
      },
      scope: { campaignIds: ['summer-2026'], channels: ['instagram'] },
      effectiveFrom: new Date('2026-07-01T00:00:00Z'), // overlaps summer-2026
      expiresAt: new Date('2026-07-31T23:59:59Z')
    };

    const conflicts = await ConflictDetector.checkConflicts(workspace._id, candidate);
    assert.ok(conflicts.length > 0, 'Expected promotional conflict to be flagged');
    assert.strictEqual(conflicts[0].conflictType, 'PROMOTIONAL_CONDITION_CONTRADICTION');
    assert.strictEqual(conflicts[0].existingRuleId, 'PR-BASE');
  });

  test('Planted Conflict 3: Candidate prohibiting a term required by existing active rule is detected', async () => {
    const candidate = {
      ruleId: 'CAND-TERM-2',
      category: 'terminology',
      ruleText: 'Prohibit term "verified" in promotional context.',
      ruleConfig: {
        prohibitedTerms: ['verified']
      },
      scope: { campaignIds: ['campaign-global'], channels: ['web'] }
    };

    const conflicts = await ConflictDetector.checkConflicts(workspace._id, candidate);
    assert.ok(conflicts.length > 0, 'Expected conflict for prohibiting preferred term');
    assert.strictEqual(conflicts[0].conflictType, 'TERMINOLOGY_CONTRADICTION');
  });

  test('Planted Conflict 4: Candidate with identical duplicate rule text is detected', async () => {
    const candidate = {
      ruleId: 'CAND-DUP-1',
      category: 'disclaimer',
      ruleText: 'Promotions must state "*Terms and conditions apply".',
      scope: { campaignIds: ['campaign-global'], channels: ['web'] }
    };

    const conflicts = await ConflictDetector.checkConflicts(workspace._id, candidate);
    assert.ok(conflicts.length > 0, 'Expected duplicate rule conflict');
    assert.strictEqual(conflicts[0].conflictType, 'DUPLICATE_ACTIVE_RULE');
  });

  test('Compatible Control: Rule with non-overlapping campaign/channel scope produces zero conflicts', async () => {
    const candidate = {
      ruleId: 'CAND-COMPAT-1',
      category: 'promotional_condition',
      ruleText: 'Free shipping on orders above INR 499 for winter offline print.',
      ruleConfig: {
        benefit: 'free_shipping',
        minimumExclusive: 499
      },
      scope: { campaignIds: ['winter-2026'], channels: ['print'] }, // disjoint from summer-2026 instagram
      effectiveFrom: new Date('2026-11-01T00:00:00Z'),
      expiresAt: new Date('2026-12-31T23:59:59Z')
    };

    const conflicts = await ConflictDetector.checkConflicts(workspace._id, candidate);
    assert.strictEqual(conflicts.length, 0, 'Disjoint scope should produce 0 false conflicts');
  });
});
