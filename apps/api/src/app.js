import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { errorHandler, NotFoundError } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimit.js';

import { healthRouter } from './modules/health/healthRoutes.js';
import { authRouter } from './modules/auth/authRoutes.js';
import { workspaceRouter } from './modules/workspaces/workspaceRoutes.js';
import { ruleRouter } from './modules/rules/ruleRoutes.js';
import { submissionRouter } from './modules/submissions/submissionRoutes.js';
import { briefImportRouter } from './modules/imports/briefImportRoutes.js';
import { insightsRouter } from './modules/insights/insightsRoutes.js';

export function createApp() {
  const app = express();

  // Security headers
  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));

  // CORS configuration
  app.use(cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin || env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  }));

  // Standard middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(requestIdMiddleware);
  app.use(apiLimiter);

  // Root health / welcome endpoint (for cloud platform health checks & visitors)
  app.get('/', (req, res) => {
    res.status(200).json({
      name: 'Cohesora Platform API',
      status: 'online',
      version: '1.0.0',
      apiBase: env.API_BASE_PATH,
      documentation: `${env.API_BASE_PATH}/health/live`,
      timestamp: new Date().toISOString()
    });
  });

  // Mount API V1 routes
  const apiV1 = express.Router();
  apiV1.use('/health', healthRouter);
  apiV1.use('/auth', authRouter);
  apiV1.use('/workspaces', workspaceRouter);

  // Workspace-scoped sub-routers
  workspaceRouter.use('/:workspaceId/rules', ruleRouter);
  workspaceRouter.use('/:workspaceId/submissions', submissionRouter);
  workspaceRouter.use('/:workspaceId/brief-imports', briefImportRouter);
  workspaceRouter.use('/:workspaceId/insights', insightsRouter);

  app.use(env.API_BASE_PATH, apiV1);

  // 404 handler
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found.`));
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
