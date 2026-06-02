import { describe, expect, it } from 'vitest';

import {
  AppError,
  ConflictError,
  ExternalServiceError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from '../src/errors/app-error.js';

describe('AppError hierarchy', () => {
  it('sets status, code, and operational flag on the base error', () => {
    const err = new AppError('boom', 418, 'TEAPOT', { extra: 1 });
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(418);
    expect(err.code).toBe('TEAPOT');
    expect(err.details).toEqual({ extra: 1 });
    expect(err.isOperational).toBe(true);
  });

  it('maps each subclass to the right HTTP status and code', () => {
    expect(new ValidationError().statusCode).toBe(400);
    expect(new ValidationError().code).toBe('VALIDATION_ERROR');
    expect(new UnauthorizedError().statusCode).toBe(401);
    expect(new ConflictError('dup').statusCode).toBe(409);
    expect(new NotFoundError('Problem').statusCode).toBe(404);
    expect(new NotFoundError('Problem').message).toBe('Problem not found');
    expect(new ExternalServiceError('Piston').statusCode).toBe(502);
    expect(new ExternalServiceError('Piston').message).toBe('Piston unavailable');
  });
});
