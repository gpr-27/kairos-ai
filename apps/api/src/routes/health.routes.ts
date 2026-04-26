import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

router.get('/', (_req, res) => {
  res.json({
    data: {
      status: 'ok',
      service: 'kairos-api',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      mongo:
        mongoose.connection.readyState === 1
          ? 'connected'
          : mongoose.connection.readyState === 2
            ? 'connecting'
            : 'disconnected',
    },
  });
});

export { router as healthRouter };
