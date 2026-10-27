import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from './logger.js';
import { InMemoryStore } from './inMemoryStore.js';

export let isInMemoryMode = false;

let connectionCount = 0;

mongoose.connection.on('error', (err) => {
  logger.warn('Mongoose connection notice:', { error: err?.message });
  if (err?.name === 'MongoNetworkTimeoutError' || err?.message?.includes('timed out')) {
    isInMemoryMode = true;
  }
});

export async function connectDatabase() {
  connectionCount++;
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  // Attempt configured MONGODB_URI
  try {
    logger.info('Attempting MongoDB connection', { uri: env.MONGODB_URI });
    await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
      socketTimeoutMS: 15000
    });
    isInMemoryMode = false;
    logger.info('Connected to live MongoDB successfully', { uri: env.MONGODB_URI });
    return mongoose.connection;
  } catch (err) {
    logger.warn('Direct MongoDB connection failed. Falling back to pure in-memory document store', { error: err.message });
    isInMemoryMode = true;
    logger.info('Running in pure In-Memory MongoDB fallback mode for zero-dependency development/testing');
    return {
      readyState: 1,
      inMemory: true
    };
  }
}

export async function disconnectDatabase() {
  connectionCount = Math.max(0, connectionCount - 1);
  if (connectionCount > 0) {
    return;
  }
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('Disconnected from MongoDB');
  }
  InMemoryStore.clearAll();
  isInMemoryMode = false;
}

