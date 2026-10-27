import express from 'express';
import mongoose from 'mongoose';
import { isInMemoryMode } from '../../config/database.js';

export const healthRouter = express.Router();

healthRouter.get('/live', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  });
});

healthRouter.get('/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1 || isInMemoryMode;
  if (!isDbConnected) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is starting up',
        requestId: req.requestId
      }
    });
  }

  res.status(200).json({
    data: {
      status: 'ready',
      database: mongoose.connection.readyState === 1 ? 'connected' : 'in-memory-fallback',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  });
});
