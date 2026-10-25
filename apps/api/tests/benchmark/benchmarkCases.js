/**
 * 25-Case Curated Benchmark Specification (Section L2)
 * Categorized into:
 * - Deterministic Positive Violation Cases (TP / FN evaluation)
 * - Deterministic Clean Negative Cases (FP / TN evaluation)
 * - AI Semantic Ambiguity Cases (Human Rubric / NEEDS_VERIFICATION evaluation)
 * - Service / Robustness Failure Cases (Safe Failure Semantics)
 */

export const benchmarkCases = [
  // --- Category A: Deterministic Positive Violations (12 cases) ---
  {
    caseId: 'BM-01',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Unconditional free shipping claim violating PR-104 minimum order threshold (INR 999)',
    text: 'Enjoy free shipping on every order! *T&C apply',
    expectedCategory: 'promotional_condition',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'PR-104'
  },
  {
    caseId: 'BM-02',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Zero delivery fee claim without minimum order value',
    text: 'Zero delivery fee for all customers this festival season. *T&C apply',
    expectedCategory: 'promotional_condition',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'PR-104'
  },
  {
    caseId: 'BM-03',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Prohibited superlative "cheapest" in copy',
    text: 'Find the cheapest cloud server solutions. *T&C apply',
    expectedCategory: 'terminology',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'TERM-01'
  },
  {
    caseId: 'BM-04',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Prohibited claim "100% risk-free" in promotional headline',
    text: 'Try our 100% risk-free trial today! *T&C apply',
    expectedCategory: 'terminology',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'TERM-01'
  },
  {
    caseId: 'BM-05',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Missing mandatory legal disclaimer "*T&C apply"',
    text: 'Enjoy our summer sale discounts across all items.',
    expectedCategory: 'disclaimer',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'DISC-01'
  },
  {
    caseId: 'BM-06',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'T-03: Low-contrast pale yellow (#FFF3B0) on white text region (< 4.5:1 AA)',
    text: 'Special offer text banner *T&C apply',
    visualMetrics: { contrastRatio: 1.12, textColor: '#FFF3B0', bgColor: '#FFFFFF' },
    expectedCategory: 'accessibility',
    expectedClassification: 'ADVISORY_STYLE_VISUAL_CONCERN',
    expectedRuleId: 'A11Y-01'
  },
  {
    caseId: 'BM-07',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Sub-threshold contrast ratio (2.8:1) failing normal-text AA standard',
    text: 'Light gray body copy text *T&C apply',
    visualMetrics: { contrastRatio: 2.8, textColor: '#888888', bgColor: '#FFFFFF' },
    expectedCategory: 'accessibility',
    expectedClassification: 'ADVISORY_STYLE_VISUAL_CONCERN',
    expectedRuleId: 'A11Y-01'
  },
  {
    caseId: 'BM-08',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Free delivery claim under INR 500 violating minimum INR 999 condition',
    text: 'Free delivery on orders of Rs. 499! *T&C apply',
    expectedCategory: 'promotional_condition',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'PR-104'
  },
  {
    caseId: 'BM-09',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Prohibited word variation with punctuation "cheapest!" in sentence',
    text: 'We are simply the cheapest! Get yours now. *T&C apply',
    expectedCategory: 'terminology',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'TERM-01'
  },
  {
    caseId: 'BM-10',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Promotional copy omitting disclaimer on seasonal discount',
    text: 'Winter carnival 30% off on all accessories.',
    expectedCategory: 'disclaimer',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'DISC-01'
  },
  {
    caseId: 'BM-11',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Free shipping on all orders claim in email newsletter copy',
    text: 'Enjoy free shipping on all orders placed before midnight! *T&C apply',
    expectedCategory: 'promotional_condition',
    expectedClassification: 'CONFIRMED_RULE_CONFLICT',
    expectedRuleId: 'PR-104'
  },
  {
    caseId: 'BM-12',
    type: 'DETERMINISTIC_POSITIVE',
    description: 'Severely degraded contrast ratio (1.05:1) on white background',
    text: 'Off-white text on white card *T&C apply',
    visualMetrics: { contrastRatio: 1.05, textColor: '#FAFAFA', bgColor: '#FFFFFF' },
    expectedCategory: 'accessibility',
    expectedClassification: 'ADVISORY_STYLE_VISUAL_CONCERN',
    expectedRuleId: 'A11Y-01'
  },

  // --- Category B: Deterministic Clean Negatives (5 cases) ---
  {
    caseId: 'BM-13',
    type: 'DETERMINISTIC_NEGATIVE',
    description: 'Properly qualified free shipping on orders above INR 999 with mandatory disclaimer',
    text: 'Enjoy free shipping on orders above INR 999 this weekend! *T&C apply',
    expectedViolationCount: 0
  },
  {
    caseId: 'BM-14',
    type: 'DETERMINISTIC_NEGATIVE',
    description: 'Brand-compliant copy using approved term "affordable" and disclaimer',
    text: 'Discover our affordable premium workspace tiers. *T&C apply',
    expectedViolationCount: 0
  },
  {
    caseId: 'BM-15',
    type: 'DETERMINISTIC_NEGATIVE',
    description: 'T-04: High-contrast Navy (#1B2A4A) on white satisfying AA 14.22:1',
    text: 'Read our brand manifesto *T&C apply',
    visualMetrics: { contrastRatio: 14.22, textColor: '#1B2A4A', bgColor: '#FFFFFF' },
    expectedViolationCount: 0
  },
  {
    caseId: 'BM-16',
    type: 'DETERMINISTIC_NEGATIVE',
    description: 'Informational product feature overview without promotional promises',
    text: 'Cohesora provides evidence-first brand governance workflows. *T&C apply',
    expectedViolationCount: 0
  },
  {
    caseId: 'BM-17',
    type: 'DETERMINISTIC_NEGATIVE',
    description: 'Customer testimonial copy adhering to terminology and disclaimer guidelines',
    text: 'Our team improved brand review efficiency with Inkloom AI. *T&C apply',
    expectedViolationCount: 0
  },

  // --- Category C: Semantic & Evidence Verification Cases (5 cases) ---
  {
    caseId: 'BM-18',
    type: 'SEMANTIC_UNVERIFIED',
    description: 'T-02: Unsupported factual promise "Increases sales by 400%" with no active source',
    text: 'Our AI platform increases corporate sales by 400% in 14 days! *T&C apply',
    expectedClassification: 'NEEDS_VERIFICATION'
  },
  {
    caseId: 'BM-19',
    type: 'SEMANTIC_UNVERIFIED',
    description: 'Unsubstantiated market leadership claim "Ranked #1 brand tool globally"',
    text: 'Rated #1 brand governance tool in North America and Asia. *T&C apply',
    expectedClassification: 'NEEDS_VERIFICATION'
  },
  {
    caseId: 'BM-20',
    type: 'SEMANTIC_UNVERIFIED',
    description: 'Zero carbon neutral claim lacking registered sustainability evidence',
    text: 'Our packaging is certified 100% carbon neutral worldwide. *T&C apply',
    expectedClassification: 'NEEDS_VERIFICATION'
  },
  {
    caseId: 'BM-21',
    type: 'SEMANTIC_ADVISORY',
    description: 'Informal colloquial tone concern on enterprise channel',
    text: 'Yo guys, smash that subscribe button to get crazy deals! *T&C apply',
    expectedClassification: 'ADVISORY_STYLE_VISUAL_CONCERN'
  },
  {
    caseId: 'BM-22',
    type: 'SEMANTIC_ADVISORY',
    description: 'Urgency pressuring copy advisory',
    text: 'Hurry up before you miss out on the greatest opportunity of your life! *T&C apply',
    expectedClassification: 'ADVISORY_STYLE_VISUAL_CONCERN'
  },

  // --- Category D: Robustness, OCR & File Failure Handling (3 cases) ---
  {
    caseId: 'BM-23',
    type: 'SYSTEM_FAILURE_HANDLING',
    description: 'T-06: External AI provider timeout safely marks review INCOMPLETE without crashing',
    text: 'Campaign text submitted during AI provider outage. *T&C apply',
    expectedReviewStatus: 'incomplete'
  },
  {
    caseId: 'BM-24',
    type: 'SYSTEM_FAILURE_HANDLING',
    description: 'T-07: Unusable or failed OCR extraction marks review INCOMPLETE with safe diagnostics',
    text: '',
    ocrFailed: true,
    expectedReviewStatus: 'incomplete'
  },
  {
    caseId: 'BM-25',
    type: 'SYSTEM_FAILURE_HANDLING',
    description: 'T-15: Malformed/disguised file payload is safely rejected at intake guard',
    isMalformedUpload: true,
    expectedHttpStatus: 415
  }
];
