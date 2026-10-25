import { test, describe } from 'node:test';
import assert from 'node:assert';
import { BriefParser } from '../../src/modules/imports/briefParser.js';
import { createMinimalPdfBuffer } from '../fixtures/generateBriefFixtures.js';

describe('Multi-Format Document Support (PDF/DOCX Brief Parsing) (REQ-14, Named Improvement 1)', () => {
  test('Sample 1 (PDF Text-heavy): Successfully extracts text and section headings', async () => {
    const pdfBuf = await createMinimalPdfBuffer('SECTION 1: BRAND IDENTITY\\nInkloom AI is the official brand name.\\nAlways maintain approved logo clearance.');
    const result = await BriefParser.parseBrief(pdfBuf, 'brief-text-heavy.pdf');

    assert.ok(result.extractedText.includes('BRAND IDENTITY'), 'Expected extracted text to contain brand identity');
    assert.ok(result.headings.length > 0, 'Expected at least one heading');
    assert.strictEqual(result.format, '.pdf');
  });

  test('Sample 2 (PDF Multi-heading): Successfully detects multiple policy headings', async () => {
    const pdfBuf = await createMinimalPdfBuffer('POLICY 1: PROMOTIONAL CONDITIONS\\nFree shipping requires minimum order above INR 999.\\nPOLICY 2: REQUIRED DISCLAIMER\\nAttach *T&C apply to all campaign creatives.');
    const result = await BriefParser.parseBrief(pdfBuf, 'brief-multi-heading.pdf');

    assert.ok(result.extractedText.includes('PROMOTIONAL CONDITIONS'));
    assert.ok(result.extractedText.includes('INR 999'));
    assert.ok(result.headings.some(h => h.includes('POLICY 1')));
    assert.ok(result.headings.some(h => h.includes('POLICY 2')));
  });

  test('Sample 3 (PDF Promotional Table/Rules): Extracts terms and disclaimers', async () => {
    const pdfBuf = await createMinimalPdfBuffer('GUIDELINE: DISCOUNT CONSTRAINTS\\nMaximum seasonal discount is 40%.\\nAll claims must be supported by approved source doc.');
    const result = await BriefParser.parseBrief(pdfBuf, 'brief-discounts.pdf');

    assert.ok(result.extractedText.includes('DISCOUNT CONSTRAINTS'));
    assert.ok(result.headings.some(h => h.includes('GUIDELINE')));
  });

  test('Sample 4 (Corrupted PDF input): Fails safely with standard ValidationError without crashing', async () => {
    const corruptedBuf = Buffer.from('%PDF-1.4 [NON-PARSABLE CORRUPT BYTES]', 'utf-8');
    await assert.rejects(
      async () => {
        await BriefParser.parseBrief(corruptedBuf, 'corrupt.pdf');
      },
      {
        name: 'ValidationError'
      }
    );
  });

  test('Sample 5 (Unsupported File Extension): Rejects with UnsupportedMediaTypeError', async () => {
    const txtBuf = Buffer.from('Unsupported plain text', 'utf-8');
    await assert.rejects(
      async () => {
        await BriefParser.parseBrief(txtBuf, 'notes.txt');
      },
      {
        name: 'UnsupportedMediaTypeError'
      }
    );
  });
});
