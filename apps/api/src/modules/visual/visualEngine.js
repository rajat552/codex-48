import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import { calculateContrastRatio, calculateDeltaE2000 } from './colorMath.js';
import { logger } from '../../config/logger.js';

export class VisualEngine {
  /**
   * Processes static image: extracts text via OCR and samples contrast/palette
   */
  static async processImage(imageBuffer, activeRules = []) {
    let extractedText = '';
    let ocrConfidence = 0;
    let ocrError = null;

    // 1. Local OCR via Tesseract.js
    try {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      extractedText = ret.data.text ? ret.data.text.trim() : '';
      ocrConfidence = ret.data.confidence || 0;
      await worker.terminate();
    } catch (err) {
      logger.warn('OCR processing error', { error: err.message });
      ocrError = err.message;
    }

    // 2. Image inspection via Sharp
    let metadata = {};
    let contrastRatio = null;
    let paletteDeltaE = null;
    let textColor = '#000000';
    let bgColor = '#FFFFFF';

    try {
      const image = sharp(imageBuffer);
      metadata = await image.metadata();

      // Sample image corners / edges for background and center for text
      const stats = await image.stats();
      const dominant = stats.dominant;
      if (dominant) {
        bgColor = `#${((1 << 24) + (dominant.r << 16) + (dominant.g << 8) + dominant.b).toString(16).slice(1).toUpperCase()}`;
      }

      // Check against visual_palette and accessibility rules in activeRules
      const paletteRules = activeRules.filter(r => r.category === 'visual_palette' || r.category === 'accessibility');
      
      for (const rule of paletteRules) {
        const config = rule.ruleConfig || {};
        if (config.textColor && config.bgColor) {
          textColor = config.textColor;
          bgColor = config.bgColor;
          contrastRatio = calculateContrastRatio(textColor, bgColor);
        } else if (config.brandHex) {
          paletteDeltaE = calculateDeltaE2000(bgColor, config.brandHex);
        }
      }

      // If no explicit pair configured but rule asks for contrast AA
      if (contrastRatio === null) {
        // Default evaluation
        contrastRatio = calculateContrastRatio(textColor, bgColor);
      }
    } catch (err) {
      logger.warn('Sharp image inspection error', { error: err.message });
    }

    return {
      extractedText,
      ocrConfidence,
      ocrError,
      metadata: {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format
      },
      visualMetrics: {
        contrastRatio,
        paletteDeltaE,
        textColor,
        bgColor,
        ocrConfidence
      }
    };
  }
}
