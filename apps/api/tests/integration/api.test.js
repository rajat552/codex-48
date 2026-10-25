import { test, describe, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { connectDatabase, disconnectDatabase } from '../../src/config/database.js';

describe('Cohesora End-to-End API Integration Suite (REQ-01 to REQ-18)', () => {
  let app;
  let adminToken;
  let creatorToken;
  let adminUser;
  let creatorUser;
  let workspaceId;
  let otherWorkspaceId;
  let submissionId;
  let revision2Id;

  before(async () => {
    await connectDatabase();
    app = createApp();
  });

  after(async () => {
    await disconnectDatabase();
  });

  test('Step 1: POST /auth/register creates user, default workspace, and issues tokens', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Brand Admin',
        email: `admin-${Date.now()}@cohesora.test`,
        password: 'Password123!',
        workspaceName: 'Acme Brand Co'
      });

    assert.strictEqual(res.status, 201);
    assert.ok(res.body.data.tokens.accessToken);
    assert.ok(res.body.data.workspace._id);

    adminToken = res.body.data.tokens.accessToken;
    adminUser = res.body.data.user;
    workspaceId = res.body.data.workspace._id;
  });

  test('Step 2: Register second user to test workspace isolation and RBAC', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        displayName: 'Other Tenant',
        email: `other-${Date.now()}@cohesora.test`,
        password: 'Password123!',
        workspaceName: 'Isolated Other Workspace'
      });

    assert.strictEqual(res.status, 201);
    creatorToken = res.body.data.tokens.accessToken;
    creatorUser = res.body.data.user;
    otherWorkspaceId = res.body.data.workspace._id;
  });

  test('Step 3: Admin creates draft rule PR-104 (REQ-01)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/rules`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ruleId: 'PR-104',
        category: 'promotional_condition',
        severity: 'high',
        ruleText: 'Free shipping is available on orders above INR 999 (Rs. 999).',
        ruleConfig: {
          type: 'minimum_order_value',
          currency: 'INR',
          minimumExclusive: 999,
          benefit: 'free_shipping'
        },
        scope: { campaignIds: ['campaign-summer'], channels: ['instagram', 'web'] },
        sourceId: 'policy-pr-104',
        sourceVersion: 'v1.2'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.ruleId, 'PR-104');
    assert.strictEqual(res.body.data.status, 'draft');
    assert.strictEqual(res.body.data.approvalStatus, 'draft');
  });

  test('Step 4: Admin approves and activates PR-104 (REQ-01, REQ-02)', async () => {
    // Approve
    const approveRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/rules/PR-104/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ decision: 'approve', version: 1 });

    assert.strictEqual(approveRes.status, 200);
    assert.strictEqual(approveRes.body.data.approvalStatus, 'approved');

    // Activate
    const activateRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/rules/PR-104/activate`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ version: 1 });

    assert.strictEqual(activateRes.status, 200);
    assert.strictEqual(activateRes.body.data.status, 'active');
  });

  test('Step 5: Creator submits text with seeded violation (REQ-03)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        contentType: 'TEXT',
        text: 'Enjoy free shipping on every order this summer! Shop now.',
        campaignId: 'campaign-summer',
        channel: 'instagram'
      });

    assert.strictEqual(res.status, 202);
    assert.strictEqual(res.body.data.status, 'submitted');
    assert.strictEqual(res.body.data.revisionNumber, 1);
    submissionId = res.body.data.id;
  });

  test('Step 6: Review run triggers checks, snapshots active rules, and flags PR-104 (REQ-04, REQ-05, REQ-08)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions/${submissionId}/review-runs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'review_ready');
    assert.ok(res.body.data.ruleVersionSnapshot.length > 0, 'Snapshot must contain PR-104');
    assert.strictEqual(res.body.data.ruleVersionSnapshot[0].ruleId, 'PR-104');

    // Verify finding citing PR-104
    const pr104Finding = res.body.data.findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'PR-104'));
    assert.ok(pr104Finding, 'Expected finding citing PR-104');
    assert.strictEqual(pr104Finding.classification, 'CONFIRMED_RULE_CONFLICT');
    assert.ok(pr104Finding.suggestedCorrection.includes('above INR 999'));
  });

  test('Step 7: Creator creates Revision 2 with corrected text (REQ-10)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions/${submissionId}/revisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        text: 'Enjoy free shipping on orders above INR 999 this summer! Shop now.'
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.data.revisionNumber, 2);
    assert.strictEqual(res.body.data.parentSubmissionId, submissionId);
    revision2Id = res.body.data._id;
  });

  test('Step 8: Review run on Revision 2 confirms PR-104 resolved (REQ-10)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions/${revision2Id}/review-runs`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();

    assert.strictEqual(res.status, 200);
    const pr104Finding = res.body.data.findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'PR-104'));
    assert.strictEqual(pr104Finding, undefined, 'PR-104 should be resolved on Revision 2');
  });

  test('Step 9: Revision diff endpoint compares Revision 1 vs 2 (REQ-16, Named Improvement 3)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/submissions/${submissionId}/diff?fromRevision=1&toRevision=2`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.fromRevision, 1);
    assert.strictEqual(res.body.data.toRevision, 2);
    assert.strictEqual(res.body.data.findingsDiff.resolvedCount, 1);
    assert.strictEqual(res.body.data.findingsDiff.resolved[0].ruleRefs[0].ruleId, 'PR-104');
  });

  test('Step 10: Human reviewer decision approves Revision 2 (REQ-11)', async () => {
    const res = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions/${revision2Id}/decisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'approve',
        comment: 'Compliance verified. Ready for publication.'
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.status, 'approved');
  });

  test('Step 11: Reason is strictly required when overriding a finding (REQ-11, T-10)', async () => {
    // Attempt override without reason -> must reject with 400
    const failRes = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/submissions/${submissionId}/decisions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        action: 'override_finding',
        findingId: 'f_dummy_1',
        reason: '' // empty reason
      });

    assert.strictEqual(failRes.status, 400);
    assert.strictEqual(failRes.body.error.code, 'VALIDATION_ERROR');
  });

  test('Step 12: Audit trail records 100% of lifecycle decisions (REQ-12)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/submissions/${revision2Id}/audit-events`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    const events = res.body.data;
    assert.ok(events.length >= 2, 'Expected at least revision and approval events');
    const approvalEvent = events.find(e => e.action === 'SUBMISSION_APPROVED');
    assert.ok(approvalEvent, 'Expected SUBMISSION_APPROVED audit event');
    assert.strictEqual(approvalEvent.toState, 'approved');
  });

  test('Step 13: Governance insights returns real stored metrics (REQ-13)', async () => {
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/insights`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.data.sampleSize >= 2, 'Expected real sample size >= 2');
    assert.ok(res.body.data.byClassification.CONFIRMED_RULE_CONFLICT >= 1);
  });

  test('Step 14: Cross-workspace access returns 403/404 without leaking records (REQ-18, T-09)', async () => {
    // Other tenant attempts to read Workspace 1 submission
    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}/submissions/${submissionId}`)
      .set('Authorization', `Bearer ${creatorToken}`); // from other workspace

    assert.ok(res.status === 403 || res.status === 404, `Expected 403 or 404, got ${res.status}`);
    assert.strictEqual(res.body.data, undefined, 'No private data must be leaked');
  });
});
