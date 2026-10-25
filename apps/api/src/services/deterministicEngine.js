import { v4 as uuidv4 } from 'uuid';
import { calculateContrastRatio } from '../modules/visual/colorMath.js';

export class DeterministicEngine {
  /**
   * Evaluates content deterministically against active rules snapshot
   */
  static evaluate({ text = '', visualMetrics = null, activeRules = [] }) {
    const findings = [];
    const normalizedText = (text || '').trim();
    const lowerText = normalizedText.toLowerCase();

    for (const rule of activeRules) {
      const config = rule.ruleConfig || {};
      const category = rule.category;

      // 1. Promotional condition: Free shipping minimum order value (e.g. PR-104)
      if (category === 'promotional_condition') {
        const isFreeShippingRule =
          config.benefit === 'free_shipping' ||
          rule.ruleId === 'PR-104' ||
          rule.ruleText.toLowerCase().includes('free shipping');

        if (isFreeShippingRule) {
          // Detect unconditional free shipping or claims violating minimum order value
          const claimsFreeShipping =
            lowerText.includes('free shipping') ||
            lowerText.includes('free delivery') ||
            lowerText.includes('zero delivery fee');

          const specifiesMinimum =
            lowerText.includes('above inr 999') ||
            lowerText.includes('above rs. 999') ||
            lowerText.includes('above rs 999') ||
            lowerText.includes('over inr 999') ||
            lowerText.includes('orders above 999');

          if (claimsFreeShipping && !specifiesMinimum) {
            findings.push({
              findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
              category: 'promotional_condition',
              severity: rule.severity || 'high',
              classification: 'CONFIRMED_RULE_CONFLICT',
              sourceExcerpt: normalizedText.match(/[^.!?]*free shipping[^.!?]*/i)?.[0]?.trim() || 'Enjoy free shipping on every order!',
              explanation: `The active policy ${rule.ruleId} limits free shipping to orders strictly above INR 999. Unconditional claims violate approved promotional terms.`,
              ruleRefs: [
                {
                  ruleId: rule.ruleId,
                  ruleVersion: rule.ruleVersion,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              sourceRefs: [
                {
                  sourceId: rule.sourceId,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              suggestedCorrection: 'Enjoy free shipping on orders above INR 999 (Rs. 999).',
              suggestionStatus: 'proposed',
              detector: 'deterministic',
              createdAt: new Date()
            });
          }
        }
      }

      // 2. Terminology & Prohibited phrases
      if (category === 'terminology') {
        const prohibited = config.prohibitedTerms || [];
        for (const term of prohibited) {
          const regex = new RegExp(`\\b${term}\\b`, 'i');
          const match = normalizedText.match(regex);
          if (match) {
            const preferred = config.preferredTerm || 'approved terminology';
            findings.push({
              findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
              category: 'terminology',
              severity: rule.severity || 'high',
              classification: 'CONFIRMED_RULE_CONFLICT',
              sourceExcerpt: match[0],
              explanation: `Use of prohibited term "${match[0]}" violates brand terminology rule ${rule.ruleId}. Preferred replacement: "${preferred}".`,
              ruleRefs: [
                {
                  ruleId: rule.ruleId,
                  ruleVersion: rule.ruleVersion,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              sourceRefs: [
                {
                  sourceId: rule.sourceId,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              suggestedCorrection: normalizedText.replace(regex, preferred),
              suggestionStatus: 'proposed',
              detector: 'deterministic',
              createdAt: new Date()
            });
          }
        }
      }

      // 3. Mandatory Disclaimers
      if (category === 'disclaimer') {
        const requiredPhrase = config.requiredPhrase || config.phrase;
        if (requiredPhrase) {
          const hasPhrase = lowerText.includes(requiredPhrase.toLowerCase());
          if (!hasPhrase) {
            findings.push({
              findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
              category: 'disclaimer',
              severity: rule.severity || 'medium',
              classification: 'CONFIRMED_RULE_CONFLICT',
              sourceExcerpt: normalizedText.slice(-40) || '[End of content]',
              explanation: `Mandatory disclaimer "${requiredPhrase}" required by rule ${rule.ruleId} is missing from draft.`,
              ruleRefs: [
                {
                  ruleId: rule.ruleId,
                  ruleVersion: rule.ruleVersion,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              sourceRefs: [
                {
                  sourceId: rule.sourceId,
                  sourceVersion: rule.sourceVersion || 'v1.0'
                }
              ],
              suggestedCorrection: `${normalizedText} ${requiredPhrase}`.trim(),
              suggestionStatus: 'proposed',
              detector: 'deterministic',
              createdAt: new Date()
            });
          }
        }
      }

      // 4. Accessibility & Visual Contrast
      if (category === 'accessibility' || category === 'visual_palette') {
        const minContrast = config.minContrastRatio || 4.5;
        let evaluatedRatio = visualMetrics?.contrastRatio;

        if (config.textColor && config.bgColor) {
          evaluatedRatio = calculateContrastRatio(config.textColor, config.bgColor);
        }

        if (evaluatedRatio !== null && evaluatedRatio !== undefined && evaluatedRatio < minContrast) {
          findings.push({
            findingId: `f_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
            category: 'accessibility',
            severity: rule.severity || 'medium',
            classification: 'ADVISORY_STYLE_VISUAL_CONCERN',
            sourceExcerpt: visualMetrics?.textColor ? `${visualMetrics.textColor} on ${visualMetrics.bgColor}` : 'Color contrast evaluation',
            explanation: `Calculated contrast ratio of ${evaluatedRatio}:1 fails the WCAG 2.2 Level AA normal-text threshold of ${minContrast}:1 required by rule ${rule.ruleId}.`,
            ruleRefs: [
              {
                ruleId: rule.ruleId,
                ruleVersion: rule.ruleVersion,
                sourceVersion: rule.sourceVersion || 'v1.0'
              }
            ],
            sourceRefs: [
              {
                sourceId: rule.sourceId,
                sourceVersion: rule.sourceVersion || 'v1.0'
              }
            ],
            suggestedCorrection: config.recommendedColor ? `Use high-contrast color ${config.recommendedColor}.` : 'Adjust text or background color to achieve at least 4.5:1 contrast.',
            suggestionStatus: 'proposed',
            detector: 'deterministic',
            createdAt: new Date()
          });
        }
      }
    }

    return findings;
  }
}
