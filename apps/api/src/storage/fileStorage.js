import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import crypto from 'crypto';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

export class FileStorage {
  constructor(baseDir = env.UPLOAD_DIR) {
    this.baseDir = path.resolve(baseDir);
    this.init();
  }

  init() {
    if (!fsSync.existsSync(this.baseDir)) {
      fsSync.mkdirSync(this.baseDir, { recursive: true });
      logger.info('Created private upload directory', { path: this.baseDir });
    }
  }

  /**
   * Generates a collision-resistant random key
   */
  generateKey(originalFilename = '') {
    const ext = path.extname(originalFilename).toLowerCase();
    const randomHex = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}_${randomHex}${ext}`;
  }

  /**
   * Writes buffer to private storage
   */
  async save(buffer, key) {
    const safeKey = path.basename(key); // prevent path traversal
    const fullPath = path.join(this.baseDir, safeKey);
    await fs.writeFile(fullPath, buffer);
    const contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    return {
      key: safeKey,
      sizeBytes: buffer.length,
      contentHash
    };
  }

  /**
   * Retrieves read stream or buffer
   */
  async get(key) {
    const safeKey = path.basename(key);
    const fullPath = path.join(this.baseDir, safeKey);
    return await fs.readFile(fullPath);
  }

  /**
   * Returns absolute path safely
   */
  getAbsolutePath(key) {
    const safeKey = path.basename(key);
    return path.join(this.baseDir, safeKey);
  }

  /**
   * Removes file from storage
   */
  async delete(key) {
    const safeKey = path.basename(key);
    const fullPath = path.join(this.baseDir, safeKey);
    try {
      await fs.unlink(fullPath);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
}

export const fileStorage = new FileStorage();
