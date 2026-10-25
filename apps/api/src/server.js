import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { ReviewWorker } from './jobs/reviewWorker.js';

async function bootstrap() {
  try {
    // 1. Connect to MongoDB
    await connectDatabase();

    // 2. Create Express application
    const app = createApp();

    // 3. Start background review worker
    const worker = new ReviewWorker();
    worker.start();

    // 4. Start HTTP Server
    const server = app.listen(env.PORT, () => {
      logger.info(`Cohesora API server running on port ${env.PORT}`, {
        port: env.PORT,
        env: env.NODE_ENV,
        basePath: env.API_BASE_PATH
      });
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      worker.stop();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return { app, server, worker };
  } catch (err) {
    logger.error('Bootstrap failure', { error: err.message, stack: err.stack });
    process.exit(1);
  }
}

// Start if executed directly
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  bootstrap();
}

export { bootstrap };
