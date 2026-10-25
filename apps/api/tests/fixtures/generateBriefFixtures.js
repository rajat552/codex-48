import PDFDocument from 'pdfkit';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.resolve(__dirname, '../../../test-fixtures/briefs');

export function createMinimalPdfBuffer(textContent) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', err => reject(err));

      const lines = textContent.split('\\n');
      for (const line of lines) {
        if (/^(SECTION|POLICY|GUIDELINE|CHAPTER)/i.test(line)) {
          doc.fontSize(16).text(line);
          doc.moveDown(0.5);
        } else {
          doc.fontSize(12).text(line);
          doc.moveDown(0.5);
        }
      }
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function ensureFixtures() {
  if (!fsSync.existsSync(fixturesDir)) {
    fsSync.mkdirSync(fixturesDir, { recursive: true });
  }

  // 1. Text-heavy PDF
  const pdf1 = await createMinimalPdfBuffer('SECTION 1: BRAND GUIDELINES\\nAll communications must use Inkloom AI approved logo.\\nNever state 100% discount.');
  await fs.writeFile(path.join(fixturesDir, 'brief-1-text-heavy.pdf'), pdf1);

  // 2. Corrupted PDF
  const corruptPdf = Buffer.from('%PDF-1.4 CORRUPTED CONTENT NOT A VALID BODY', 'utf-8');
  await fs.writeFile(path.join(fixturesDir, 'brief-4-corrupted.pdf'), corruptPdf);

  // 3. Multi-heading PDF
  const pdf3 = await createMinimalPdfBuffer('POLICY 1: PROMOTIONAL CONDITIONS\\nFree shipping requires minimum order above INR 999.\\nPOLICY 2: REQUIRED DISCLAIMER\\nAlways attach *T&C apply.');
  await fs.writeFile(path.join(fixturesDir, 'brief-3-multi-heading.pdf'), pdf3);
}

ensureFixtures().catch(console.error);
