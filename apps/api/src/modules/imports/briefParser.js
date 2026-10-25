import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import mammoth from 'mammoth';
import path from 'path';
import { logger } from '../../config/logger.js';
import { ValidationError, UnsupportedMediaTypeError } from '../../middleware/errorHandler.js';

export class BriefParser {
  /**
   * Extracts text and heading structure from PDF and DOCX files
   */
  static async parseBrief(buffer, filename) {
    const ext = path.extname(filename).toLowerCase();
    const result = {
      extractedText: '',
      headings: [],
      format: ext,
      pageCount: 1,
      parserVersion: '1.0.0',
      warnings: []
    };

    if (ext === '.pdf') {
      try {
        const uint8Data = new Uint8Array(buffer);
        const loadingTask = pdfjsLib.getDocument({
          data: uint8Data,
          useSystemFonts: true,
          disableFontFace: true
        });

        const pdfDoc = await loadingTask.promise;
        result.pageCount = pdfDoc.numPages;

        let fullText = '';
        for (let pageNum = 1; pageNum <= Math.min(pdfDoc.numPages, 20); pageNum++) {
          const page = await pdfDoc.getPage(pageNum);
          const textContent = await page.getTextContent();
          const pageLines = textContent.items.map(item => item.str).join(' ');
          fullText += pageLines + '\n';
        }

        result.extractedText = fullText.trim();

        // Detect headings
        const lines = result.extractedText.split('\n').flatMap(l => l.split(/\.\s+/)).map(l => l.trim()).filter(Boolean);
        for (const line of lines) {
          if (
            /^(SECTION|POLICY|GUIDELINE|CHAPTER|PART|REQUIREMENT)\b/i.test(line) ||
            (line.length > 4 && line.length < 80 && line === line.toUpperCase() && !/^\d+$/.test(line))
          ) {
            result.headings.push(line.slice(0, 100));
          }
        }
      } catch (err) {
        logger.error('PDF parsing error', { error: err.message, filename });
        throw new ValidationError(`Failed to parse PDF brief: ${err.message}`);
      }
    } else if (ext === '.docx') {
      try {
        const textResult = await mammoth.extractRawText({ buffer });
        result.extractedText = textResult.value ? textResult.value.trim() : '';

        // Extract headings with HTML mapping
        const htmlResult = await mammoth.convertToHtml({ buffer });
        const headingMatches = htmlResult.value.match(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi) || [];
        result.headings = headingMatches.map(h => h.replace(/<[^>]+>/g, '').trim()).filter(Boolean);

        if (textResult.messages?.length > 0) {
          result.warnings = textResult.messages.map(m => m.message);
        }
      } catch (err) {
        logger.error('DOCX parsing error', { error: err.message, filename });
        throw new ValidationError(`Failed to parse DOCX brief: ${err.message}`);
      }
    } else {
      throw new UnsupportedMediaTypeError(`Unsupported brief format: ${ext}. Only .pdf and .docx are supported.`);
    }

    return result;
  }
}
