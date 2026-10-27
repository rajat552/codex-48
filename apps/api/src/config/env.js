import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root, apps/api, or current working directory
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config(); // fallback

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  API_BASE_PATH: process.env.API_BASE_PATH || '/api/v1',

  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cohesora',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'dev-access-secret-minimum-32-chars-long-cohesora',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-minimum-32-chars-long-cohesora',
  JWT_ISSUER: process.env.JWT_ISSUER || 'cohesora-api',
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || 'cohesora-web',
  ACCESS_TOKEN_TTL_MINUTES: parseInt(process.env.ACCESS_TOKEN_TTL_MINUTES || '15', 10),
  REFRESH_TOKEN_TTL_DAYS: parseInt(process.env.REFRESH_TOKEN_TTL_DAYS || '7', 10),

  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  GEMINI_TIMEOUT_MS: parseInt(process.env.GEMINI_TIMEOUT_MS || '20000', 10),
  GEMINI_MAX_RETRIES: parseInt(process.env.GEMINI_MAX_RETRIES || '1', 10),

  UPLOAD_DIR: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../private-uploads'),
  MAX_UPLOAD_BYTES: parseInt(process.env.MAX_UPLOAD_BYTES || '10485760', 10), // 10MB
  MAX_EXTRACTED_TEXT_CHARS: parseInt(process.env.MAX_EXTRACTED_TEXT_CHARS || '200000', 10),

  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map(o => o.trim()),
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  DEFAULT_TIMEZONE: process.env.DEFAULT_TIMEZONE || 'UTC'
};

// Fail-fast validation in production
if (env.NODE_ENV === 'production') {
  const missing = [];
  if (!process.env.JWT_ACCESS_SECRET) missing.push('JWT_ACCESS_SECRET');
  if (!process.env.JWT_REFRESH_SECRET) missing.push('JWT_REFRESH_SECRET');
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (missing.length > 0) {
    throw new Error(`Production startup aborted. Missing required env variables: ${missing.join(', ')}`);
  }
}
