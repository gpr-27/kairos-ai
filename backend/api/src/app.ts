import path from 'node:path';
import { fileURLToPath } from 'node:url';

import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { pinoHttp } from 'pino-http';

import { config } from './config/index.js';
import { logger } from './config/logger.js';
import { clerk } from './middleware/auth.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { apiRouter } from './routes/index.js';

export function createApp(): express.Application {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Single-container deployment (Render): this Node server is the only public
  // port. It proxies `/ml/*` to the co-located Python ML service. Mounted FIRST,
  // before body-parsing/compression, so request bodies and the ML's SSE stream
  // pass through untouched (no buffering, no double-compression). In development
  // the web app talks to the ML service directly, so this is production-only.
  if (config.isProduction) {
    app.use(
      '/ml',
      createProxyMiddleware({
        target: config.ml.baseUrl,
        changeOrigin: true,
        pathRewrite: { '^/ml': '' },
      }),
    );
  }

  // This single server also serves the SPA, which loads Clerk's JS (…clerk.accounts.dev),
  // the Monaco editor from the jsDelivr CDN, and Google Fonts. Helmet's DEFAULT
  // Content-Security-Policy (`script-src 'self'`) blocks all of those, leaving the app
  // hung on its loading screen. CSP is therefore disabled here; every other helmet
  // protection (HSTS, X-Content-Type-Options, frameguard, etc.) stays on. To harden
  // later, replace `false` with an explicit allow-list CSP for those origins.
  app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: false }));
  app.use(
    cors({
      origin: (origin, cb) => {
        // Allow server-to-server / curl requests (no Origin header)
        if (!origin) return cb(null, true);
        // Configured origins come from the ALLOWED_ORIGINS env (config layer).
        if (config.cors.allowedOrigins.includes(origin)) return cb(null, true);
        // Documented dev-only allowance: Vite may use 5174+ when 5173 is taken
        // by another project, so any localhost origin is accepted in development.
        if (
          config.isDevelopment &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
        ) {
          return cb(null, true);
        }
        // Deny with null (no CORS headers emitted) — browser blocks silently.
        // Do NOT throw an Error here; that routes to the 500 error handler.
        logger.warn({ origin }, 'CORS origin denied');
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
      max: config.isProduction ? 120 : 1000,
      standardHeaders: 'draft-7',
      legacyHeaders: false,
      message: {
        error: { code: 'RATE_LIMITED', message: 'Too many requests, slow down.' },
      },
    }),
  );

  app.use(clerk);

  app.use('/api/v1', apiRouter);

  // Serve the built single-page app from the same origin (production only).
  // The Vite build is copied to `<repo>/frontend/dist` in the Docker image.
  // Any non-API, non-ML GET falls back to index.html so client-side routing works.
  if (config.isProduction) {
    const moduleDir = path.dirname(fileURLToPath(import.meta.url));
    const webDistDir = path.resolve(moduleDir, '../../../frontend/dist');
    app.use(express.static(webDistDir));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/ml/')) return next();
      res.sendFile(path.join(webDistDir, 'index.html'));
    });
  }

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
