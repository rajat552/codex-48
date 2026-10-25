import mongoose from 'mongoose';
import { isInMemoryMode } from './database.js';
import { InMemoryStore } from './inMemoryStore.js';

export function createModelProxy(modelName, mongooseModel) {
  const handler = {
    get(target, prop, receiver) {
      // If connected to live MongoDB and not in memory fallback mode
      if (mongoose.connection.readyState === 1 && !isInMemoryMode) {
        return Reflect.get(target, prop, receiver);
      }

      const memCol = InMemoryStore.getCollection(modelName);
      if (typeof memCol[prop] === 'function') {
        return memCol[prop].bind(memCol);
      }
      return Reflect.get(target, prop, receiver);
    }
  };

  return new Proxy(mongooseModel, handler);
}
