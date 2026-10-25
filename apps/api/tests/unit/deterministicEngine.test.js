import { test, describe } from 'node:test';
import assert from 'node:assert';
import { DeterministicEngine } from '../../src/services/deterministicEngine.js';

describe('Deterministic Review Engine (REQ-05, T-01, T-03)', () => {
  const activeRules = [
    {
      ruleId: 'PR-104',
      ruleVersion: 1,
      sourceId: 'policy-pr-104',
      sourceVersion: 'v1.2',
      category: 'promotional_condition',
      severity: 'high',
      ruleText: 'Free shipping is available on orders above INR 999 (Rs. 999).',
      ruleConfig: {
        type: 'minimum_order_value',
        currency: 'INR',
        minimumExclusive: 999,
        benefit: 'free_shipping'
      }
    },
    {
      ruleId: 'TERM-01',
      ruleVersion: 1,
      sourceId: 'term-guide-2026',
      sourceVersion: 'v2.0',
      category: 'terminology',
      severity: 'high',
      ruleText: 'Never use hyperbolic claims like "cheapest" or "100% risk-free". Use "affordable" instead.',
      ruleConfig: {
        prohibitedTerms: ['cheapest', '100% risk-free'],
        preferredTerm: 'affordable'
      }
    },
    {
      ruleId: 'DISC-01',
      ruleVersion: 1,
      sourceId: 'legal-disclaimer-doc',
      sourceVersion: 'v1.0',
      category: 'disclaimer',
      severity: 'medium',
      ruleText: 'All promotional copy must include "*T&C apply".',
      ruleConfig: {
        requiredPhrase: '*T&C apply'
      }
    },
    {
      ruleId: 'A11Y-01',
      ruleVersion: 1,
      sourceId: 'wcag-brand-guide',
      sourceVersion: 'v1.0',
      category: 'accessibility',
      severity: 'medium',
      ruleText: 'Standard body text must satisfy WCAG AA 4.5:1 minimum contrast ratio.',
      ruleConfig: {
        minContrastRatio: 4.5
      }
    }
  ];

  test('T-01: Seeded violation "free shipping on every order" flags PR-104 CONFIRMED_RULE_CONFLICT', () => {
    const text = 'Enjoy free shipping on every order this weekend! *T&C apply';
    const findings = DeterministicEngine.evaluate({ text, activeRules });

    const pr104Finding = findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'PR-104'));
    assert.ok(pr104Finding, 'Expected finding citing PR-104');
    assert.strictEqual(pr104Finding.classification, 'CONFIRMED_RULE_CONFLICT');
    assert.strictEqual(pr104Finding.category, 'promotional_condition');
    assert.ok(pr104Finding.suggestedCorrection.includes('above INR 999'));
  });

  test('Properly qualified text "free shipping on orders above INR 999" passes PR-104', () => {
    const text = 'Enjoy free shipping on orders above INR 999 this weekend! *T&C apply';
    const findings = DeterministicEngine.evaluate({ text, activeRules });

    const pr104Finding = findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'PR-104'));
    assert.strictEqual(pr104Finding, undefined, 'Qualified order value should not trigger PR-104 conflict');
  });

  test('Prohibited terminology "cheapest" is caught reproducibly', () => {
    const text = 'Get the cheapest subscription today! *T&C apply';
    const findings = DeterministicEngine.evaluate({ text, activeRules });

    const termFinding = findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'TERM-01'));
    assert.ok(termFinding, 'Expected finding citing TERM-01');
    assert.strictEqual(termFinding.classification, 'CONFIRMED_RULE_CONFLICT');
    assert.ok(termFinding.suggestedCorrection.includes('affordable'));
  });

  test('Missing disclaimer "*T&C apply" is caught deterministically', () => {
    const text = 'Summer sale is here with 50% discount!';
    const findings = DeterministicEngine.evaluate({ text, activeRules });

    const discFinding = findings.find(f => f.ruleRefs?.some(r => r.ruleId === 'DISC-01'));
    assert.ok(discFinding, 'Expected finding citing DISC-01');
    assert.strictEqual(discFinding.classification, 'CONFIRMED_RULE_CONFLICT');
  });

  test('T-03: Low contrast ratio (1.12:1) triggers ADVISORY_STYLE_VISUAL_CONCERN', () => {
    const findings = DeterministicEngine.evaluate({
      text: 'Simple text *T&C apply',
      visualMetrics: { contrastRatio: 1.12, textColor: '#FFF3B0', bgColor: '#FFFFFF' },
      activeRules
    });

    const a11yFinding = findings.find(f => f.category === 'accessibility');
    assert.ok(a11yFinding, 'Expected finding citing accessibility contrast');
    assert.strictEqual(a11yFinding.classification, 'ADVISORY_STYLE_VISUAL_CONCERN');
    assert.ok(a11yFinding.explanation.includes('1.12:1 fails'));
  });
});
