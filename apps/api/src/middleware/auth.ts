import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import type { Request, RequestHandler } from 'express';

import { env } from '../config/env.js';
import { UnauthorizedError } from '../errors/app-error.js';

export const clerk = clerkMiddleware({
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
});

export const requireUser = requireAuth();

export interface AuthenticatedRequest extends Request {
  userId: string;
}

export function getUserId(req: Request): string {
  const auth = getAuth(req);
  if (!auth.userId) {
    throw new UnauthorizedError();
  }
  return auth.userId;
}

export const attachUserId: RequestHandler = (req, _res, next) => {
  const auth = getAuth(req);
  if (!auth.userId) {
    next(new UnauthorizedError());
    return;
  }
  (req as AuthenticatedRequest).userId = auth.userId;
  next();
};
