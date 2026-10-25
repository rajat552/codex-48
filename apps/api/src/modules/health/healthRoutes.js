import express from 'express';
import mongoose from 'mongoose';

export const healthRouter = express.Router();

healthRouter.get('/live', (req, res) => {
  res.status(200).json({
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  });
});

healthRouter.get('/ready', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  if (!isDbConnected) {
    return res.status(503).json({
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Database is not ready',
        requestId: req.requestId
      }
    });
  }

  res.status(200).json({
    data: {
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    },
    meta: {
      requestId: req.requestId
    }
  });
});
