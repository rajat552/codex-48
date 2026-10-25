import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateContrastRatio, calculateDeltaE2000 } from '../../src/modules/visual/colorMath.js';

describe('WCAG 2.2 Contrast & CIEDE2000 Color Math (REQ-05, REQ-06)', () => {
  test('T-03: #FFF3B0 on white yields approximately 1.12:1 contrast ratio', () => {
    const ratio = calculateContrastRatio('#FFF3B0', '#FFFFFF');
    assert.strictEqual(ratio, 1.12);
  });

  test('T-04: Approved navy #1B2A4A on white yields approximately 14.22:1 contrast ratio', () => {
    const ratio = calculateContrastRatio('#1B2A4A', '#FFFFFF');
    assert.strictEqual(ratio, 14.22);
  });

  test('Identical colors yield exactly 1.0:1 contrast ratio', () => {
    const ratio = calculateContrastRatio('#FFFFFF', '#FFFFFF');
    assert.strictEqual(ratio, 1.0);
  });

  test('Black on white yields maximum 21.0:1 contrast ratio', () => {
    const ratio = calculateContrastRatio('#000000', '#FFFFFF');
    assert.strictEqual(ratio, 21.0);
  });

  test('CIEDE2000 delta E for identical colors is 0.0', () => {
    const deltaE = calculateDeltaE2000('#1B2A4A', '#1B2A4A');
    assert.strictEqual(deltaE, 0);
  });

  test('CIEDE2000 delta E detects perceptible color differences', () => {
    const deltaE = calculateDeltaE2000('#1B2A4A', '#FF0000');
    assert.ok(deltaE > 30, `Expected large deltaE for navy vs red, got ${deltaE}`);
  });
});
