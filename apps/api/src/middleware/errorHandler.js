import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'The request contains invalid fields.', details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required.') {
    super(message, 401, 'UNAUTHENTICATED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Requested resource was not found.') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Resource conflict or duplicate detected.') {
    super(message, 409, 'CONFLICT');
  }
}

export class InvalidStateTransitionError extends AppError {
  constructor(message = 'Invalid state transition for resource.') {
    super(message, 409, 'INVALID_STATE_TRANSITION');
  }
}

export class UnsupportedMediaTypeError extends AppError {
  constructor(message = 'Unsupported content type or file format.') {
    super(message, 415, 'UNSUPPORTED_MEDIA_TYPE');
  }
}

export class FileTooLargeError extends AppError {
  constructor(message = 'Uploaded file exceeds configured size limit.') {
    super(message, 413, 'FILE_TOO_LARGE');
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message, 429, 'RATE_LIMITED');
  }
}

export class ProviderUnavailableError extends AppError {
  constructor(message = 'External provider service is unavailable.') {
    super(message, 503, 'PROVIDER_UNAVAILABLE');
  }
}

export function errorHandler(err, req, res, next) {
  const requestId = req.requestId || 'req_unknown';
  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';
  let message = err.message || 'An unexpected error occurred.';
  let details = err.details || null;

  // Handle Mongoose / MongoDB errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Validation failed.';
    details = Object.keys(err.errors || {}).map(k => ({
      field: k,
      issue: err.errors[k].message
    }));
  } else if (err.code === 11000) {
    statusCode = 409;
    code = 'CONFLICT';
    message = 'Duplicate key conflict.';
  } else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      statusCode = 413;
      code = 'FILE_TOO_LARGE';
      message = 'Uploaded file exceeds maximum allowed size.';
    } else {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = err.message;
    }
  }

  // Log error (use warn for client 4xx errors, error for server 500 errors)
  const logFn = statusCode >= 500 ? logger.error.bind(logger) : logger.warn.bind(logger);
  logFn(message, {
    requestId,
    code,
    statusCode,
    url: req.originalUrl,
    method: req.method,
    stack: env.NODE_ENV === 'development' ? err.stack : undefined
  });

  return res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      requestId
    }
  });
}
