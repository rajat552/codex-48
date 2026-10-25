import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';

let memoryServerInstance = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Attempt configured MONGODB_URI
  try {
    logger.info('Attempting MongoDB connection', { uri: env.MONGODB_URI });
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    logger.info('Connected to MongoDB successfully', { uri: env.MONGODB_URI });
    return mongoose.connection;
  } catch (err) {
    logger.warn('Direct MongoDB connection failed. Checking fallback', { error: err.message });
    
    // In dev / test, spin up in-memory MongoDB fallback
    if (env.NODE_ENV !== 'production') {
      try {
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        if (!memoryServerInstance) {
          logger.info('Starting MongoMemoryServer for development/testing...');
          memoryServerInstance = await MongoMemoryServer.create();
        }
        const memUri = memoryServerInstance.getUri();
        logger.info('Connecting to in-memory MongoDB fallback', { memUri });
        await mongoose.connect(memUri);
        logger.info('Connected to in-memory MongoDB successfully');
        return mongoose.connection;
      } catch (memErr) {
        logger.error('Failed to initialize in-memory MongoDB fallback', { error: memErr.message });
        throw memErr;
      }
    } else {
      throw err;
    }
  }
}

export async function disconnectDatabase() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
    memoryServerInstance = null;
    logger.info('Stopped MongoMemoryServer');
  }
}
