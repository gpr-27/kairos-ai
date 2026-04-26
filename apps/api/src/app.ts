import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';

import { allowedOrigins, env } from './config/env.js';
import { logger } from './config/logger.js';
import { clerk } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow server-to-server / curl requests (no Origin header)
        if (!origin) return cb(null, true);
        if (allowedOrigins.includes(origin)) return cb(null, true);
        // Deny with null (no CORS headers emitted) — browser blocks silently.
        // Do NOT throw an Error here; that routes to the 500 error handler.
        cb(null, false);
      },
      credentials: true,
    }),
  );
  app.use(compression());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use(
    rateLimit({
      windowMs: 60_000,
      max: env.NODE_ENV === 'production' ? 120 : 1000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
      },
    }),
  );

  app.use(clerk);

  app.use('/api/v1', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
