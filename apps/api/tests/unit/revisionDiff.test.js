import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';
import { Submission } from '../../src/modules/submissions/submissionModel.js';
import { Workspace } from '../../src/modules/workspaces/workspaceModel.js';
import { User } from '../../src/modules/auth/userModel.js';
import { RevisionDiffService } from '../../src/modules/revisions/revisionDiffService.js';

describe('Side-by-Side Visual & Text Revision Diffing (REQ-16, Named Improvement 3)', () => {
  let workspace;
  let otherWorkspace;
  let user;
  let subRev1;
  let subRev2;

  before(async () => {
    await connectDatabase();
    user = await User.create({
      displayName: 'Creator One',
      email: `diff-creator-${Date.now()}@test.com`,
      passwordHash: 'hash'
    });

    workspace = await Workspace.create({
      name: 'Diff Test Workspace',
      slug: `diff-ws-${Date.now()}`,
      createdBy: user._id
    });

    otherWorkspace = await Workspace.create({
      name: 'Other Workspace',
      slug: `other-ws-${Date.now()}`,
      createdBy: user._id
    });

    const groupId = 'grp_test_diff_123';

    // Revision 1: initial text with seeded violation
    subRev1 = await Submission.create({
      workspaceId: workspace._id,
      submissionGroupId: groupId,
      revisionNumber: 1,
      creatorId: user._id,
      contentType: 'TEXT',
      extractedText: 'Enjoy free shipping on every order! Get the cheapest price now.',
      status: 'review_ready',
      processing: {
        visualMetrics: {
          contrastRatio: 1.12,
          textColor: '#FFF3B0',
          bgColor: '#FFFFFF'
        }
      },
      findings: [
        {
          findingId: 'f_old_1',
          category: 'promotional_condition',
          severity: 'high',
          classification: 'CONFIRMED_RULE_CONFLICT',
          ruleRefs: [{ ruleId: 'PR-104', ruleVersion: 1 }]
        },
        {
          findingId: 'f_old_2',
          category: 'terminology',
          severity: 'high',
          classification: 'CONFIRMED_RULE_CONFLICT',
          ruleRefs: [{ ruleId: 'TERM-01', ruleVersion: 1 }]
        }
      ]
    });

    // Revision 2: fixed free shipping violation, but kept cheapest
    subRev2 = await Submission.create({
      workspaceId: workspace._id,
      submissionGroupId: groupId,
      parentSubmissionId: subRev1._id,
      revisionNumber: 2,
      creatorId: user._id,
      contentType: 'TEXT',
      extractedText: 'Enjoy free shipping on orders above INR 999! Get the cheapest price now.',
      status: 'review_ready',
      processing: {
        visualMetrics: {
          contrastRatio: 14.22,
          textColor: '#1B2A4A',
          bgColor: '#FFFFFF'
        }
      },
      findings: [
        // PR-104 is resolved (not present here)
        {
          findingId: 'f_old_2',
          category: 'terminology',
          severity: 'high',
          classification: 'CONFIRMED_RULE_CONFLICT',
          ruleRefs: [{ ruleId: 'TERM-01', ruleVersion: 1 }] // persisting
        },
        {
          findingId: 'f_new_3',
          category: 'disclaimer',
          severity: 'medium',
          classification: 'CONFIRMED_RULE_CONFLICT',
          ruleRefs: [{ ruleId: 'DISC-01', ruleVersion: 1 }] // new
        }
      ]
    });
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('Text diff detects inserted text and preserves revision lineage', async () => {
    const diff = await RevisionDiffService.compareRevisions({
      workspaceId: workspace._id,
      submissionId: subRev1._id,
      fromRevision: 1,
      toRevision: 2
    });

    assert.strictEqual(diff.fromRevision, 1);
    assert.strictEqual(diff.toRevision, 2);
    assert.ok(diff.textDiff.hasChanges);

    const addedChunk = diff.textDiff.chunks.find(c => c.added);
    assert.ok(addedChunk, 'Expected added chunk');
    assert.ok(addedChunk.value.includes('orders above INR 999'));
  });

  test('Visual comparison computes contrast ratio delta (14.22 vs 1.12 = +13.10)', async () => {
    const diff = await RevisionDiffService.compareRevisions({
      workspaceId: workspace._id,
      submissionId: subRev1._id,
      fromRevision: 1,
      toRevision: 2
    });

    assert.strictEqual(diff.visualComparison.contrast.oldValue, 1.12);
    assert.strictEqual(diff.visualComparison.contrast.newValue, 14.22);
    assert.strictEqual(diff.visualComparison.contrast.delta, 13.10);
    assert.strictEqual(diff.visualComparison.colors.oldTextColor, '#FFF3B0');
    assert.strictEqual(diff.visualComparison.colors.newTextColor, '#1B2A4A');
  });

  test('Findings diff classifies resolved, persisting, and new findings', async () => {
    const diff = await RevisionDiffService.compareRevisions({
      workspaceId: workspace._id,
      submissionId: subRev1._id,
      fromRevision: 1,
      toRevision: 2
    });

    assert.strictEqual(diff.findingsDiff.resolvedCount, 1);
    assert.strictEqual(diff.findingsDiff.persistingCount, 1);
    assert.strictEqual(diff.findingsDiff.newCount, 1);

    // Resolved was PR-104
    assert.strictEqual(diff.findingsDiff.resolved[0].ruleRefs[0].ruleId, 'PR-104');
    // Persisting was TERM-01
    assert.strictEqual(diff.findingsDiff.persisting[0].ruleRefs[0].ruleId, 'TERM-01');
    // New was DISC-01
    assert.strictEqual(diff.findingsDiff.newlyIntroduced[0].ruleRefs[0].ruleId, 'DISC-01');
  });

  test('Cross-workspace diff is strictly rejected (REQ-18)', async () => {
    await assert.rejects(
      async () => {
        await RevisionDiffService.compareRevisions({
          workspaceId: otherWorkspace._id,
          submissionId: subRev1._id,
          fromRevision: 1,
          toRevision: 2
        });
      },
      {
        name: 'NotFoundError'
      }
    );
  });
});
