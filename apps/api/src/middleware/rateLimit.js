import rateLimit from 'express-rate-limit';
import { RateLimitedError } from './errorHandler.js';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitedError('Too many authentication attempts, please try again after 15 minutes.'));
  }
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300, // 300 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new RateLimitedError('Too many requests, please slow down.'));
  }
});
