import { v4 as uuidv4 } from 'uuid';
import { logger } from '../config/logger.js';

export class EvidenceValidator {
  /**
   * Reconciles deterministic findings with AI proposed findings and enforces evidence citations
   */
  static validate({ deterministicFindings = [], aiResult = null, activeRules = [] }) {
    const validatedFindings = [...deterministicFindings];
    const retrievedRuleMap = new Map();

    for (const rule of activeRules) {
      retrievedRuleMap.set(rule.ruleId, rule);
    }

    if (aiResult && aiResult.success) {
      // 1. Process AI proposed findings
      for (const rawFinding of aiResult.findings || []) {
        const citedIds = Array.isArray(rawFinding.citedRuleIds) ? rawFinding.citedRuleIds : [];
        const validRuleRefs = [];
        const validSourceRefs = [];

        // Check citation integrity against snapshot (REQ-08, T-05)
        let hasValidCitation = false;
        for (const citedId of citedIds) {
          const matchedRule = retrievedRuleMap.get(citedId);
          if (matchedRule) {
            hasValidCitation = true;
            validRuleRefs.push({
              ruleId: matchedRule.ruleId,
              ruleVersion: matchedRule.ruleVersion,
              sourceVersion: matchedRule.sourceVersion || 'v1.0'
            });
            validSourceRefs.push({
              sourceId: matchedRule.sourceId,
              sourceVersion: matchedRule.sourceVersion || 'v1.0'
            });
          } else {
            logger.warn('AI cited unknown or unapproved rule ID. Rejecting citation.', { citedId });
          }
        }

        // Determine final classification strictly adhering to the schema enum
        let classification = String(rawFinding.classification || '').toUpperCase();
        if (!['CONFIRMED_RULE_CONFLICT', 'NEEDS_VERIFICATION', 'ADVISORY_STYLE_VISUAL_CONCERN'].includes(classification)) {
          if (classification.includes('CONFLICT') || classification.includes('VIOLAT')) {
            classification = 'CONFIRMED_RULE_CONFLICT';
          } else if (classification.includes('VERIF')) {
            classification = 'NEEDS_VERIFICATION';
          } else {
            classification = 'ADVISORY_STYLE_VISUAL_CONCERN';
          }
        }

        // Non-negotiable principle 2 & 3:
        // A factual finding must cite an approved, applicable rule or be labelled NEEDS_VERIFICATION
        if (rawFinding.category === 'product_fact' || rawFinding.category === 'promotional_condition') {
          if (!hasValidCitation) {
            classification = 'NEEDS_VERIFICATION';
          }
        }

        // Avoid duplicating deterministic findings
        const isDuplicate = validatedFindings.some(f =>
          f.category === rawFinding.category &&
          (f.sourceExcerpt && rawFinding.excerpt && f.sourceExcerpt.toLowerCase().includes(rawFinding.excerpt.toLowerCase()))
        );

        if (!isDuplicate) {
          validatedFindings.push({
            findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
            category: rawFinding.category || 'other',
            severity: ['low', 'medium', 'high', 'critical'].includes(rawFinding.severity) ? rawFinding.severity : 'medium',
            classification,
            sourceExcerpt: (rawFinding.excerpt || '').slice(0, 500),
            explanation: (rawFinding.explanation || 'Brand guideline finding detected.').slice(0, 1000),
            ruleRefs: validRuleRefs,
            sourceRefs: validSourceRefs,
            suggestedCorrection: rawFinding.suggestedCorrection ? String(rawFinding.suggestedCorrection).slice(0, 1000) : null,
            suggestionStatus: rawFinding.suggestedCorrection ? 'proposed' : 'none',
            detector: 'gemini_semantic',
            createdAt: new Date()
          });
        }
      }

      // 2. Process claims identified by AI as lacking evidence (T-02)
      for (const item of aiResult.needsVerification || []) {
        validatedFindings.push({
          findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
          category: 'product_fact',
          severity: 'medium',
          classification: 'NEEDS_VERIFICATION',
          sourceExcerpt: (item.claimExcerpt || '').slice(0, 500),
          explanation: item.reason || 'Claim has no approved evidence in the active brand rules snapshot.',
          ruleRefs: [],
          sourceRefs: [],
          suggestedCorrection: null,
          suggestionStatus: 'none',
          detector: 'gemini_semantic',
          createdAt: new Date()
        });
      }
    }

    return validatedFindings;
  }
}
