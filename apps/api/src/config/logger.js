import { env } from './env.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'jwt_access_secret',
  'jwt_refresh_secret',
  'gemini_api_key',
  'authorization'
]);

function redact(obj, depth = 0) {
  if (depth > 5 || !obj || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => redact(item, depth + 1));
  }
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redact(value, depth + 1);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function formatLog(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...redact(meta)
  };
  return JSON.stringify(entry);
}

export const logger = {
  info: (msg, meta) => {
    console.log(formatLog('info', msg, meta));
  },
  warn: (msg, meta) => {
    console.warn(formatLog('warn', msg, meta));
  },
  error: (msg, meta) => {
    console.error(formatLog('error', msg, meta));
  },
  debug: (msg, meta) => {
    if (env.LOG_LEVEL === 'debug') {
      console.debug(formatLog('debug', msg, meta));
    }
  }
};
