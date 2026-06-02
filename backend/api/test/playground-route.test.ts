/**
 * HTTP-level test of POST /playground/run mounted on a minimal Express app
 * (no Clerk/Mongo needed — the playground route is public). Forces the local
 * sandbox via a failing fetch so the assertion is deterministic and offline.
 */
import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { errorHandler } from '../src/middleware/error-handler.js';
import { playgroundRouter } from '../src/routes/playground.routes.js';

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/playground', playgroundRouter);
  app.use(errorHandler);
  return app;
}

describe('POST /playground/run', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network disabled for route test')));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('runs submitted Python code and returns stdout', async () => {
    const res = await request(buildApp())
      .post('/playground/run')
      .send({ language: 'python', code: 'print("route-ok")' });

    expect(res.status).toBe(200);
    expect(res.body.data.exitCode).toBe(0);
    expect(res.body.data.stdout.trim()).toBe('route-ok');
  });

  it('rejects an empty code payload with a 400 validation error', async () => {
    const res = await request(buildApp())
      .post('/playground/run')
      .send({ language: 'python', code: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});
