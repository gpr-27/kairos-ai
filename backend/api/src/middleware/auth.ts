import { clerkMiddleware, getAuth, requireAuth } from '@clerk/express';
import type { Request, RequestHandler } from 'express';

import { config } from '../config/index.js';
import { UnauthorizedError } from '../errors/app-error.js';
import { touchGuest } from '../services/guest.service.js';
import { verifyGuestToken } from '../services/guest-token.js';

const GUEST_TOKEN_HEADER = 'x-guest-token';

export const clerk = clerkMiddleware({
  publishableKey: config.clerk.publishableKey,
  secretKey: config.clerk.secretKey,
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

// ── Unified identity: Clerk user OR anonymous guest ──────────────────────────
// `appUserId` is the Clerk user id for signed-in users, or the guest id for
// guests. Data scoped by a plain userId string works for both.

export interface AppRequest extends Request {
  appUserId: string;
  isGuest: boolean;
}

function resolveGuestId(req: Request): string | null {
  return verifyGuestToken(req.header(GUEST_TOKEN_HEADER));
}

/** Allow either a valid Clerk session OR a valid guest token. */
export const requireAppUser: RequestHandler = (req, _res, next) => {
  const clerkUserId = getAuth(req).userId;
  if (clerkUserId) {
    (req as AppRequest).appUserId = clerkUserId;
    (req as AppRequest).isGuest = false;
    next();
    return;
  }

  const guestId = resolveGuestId(req);
  if (guestId) {
    (req as AppRequest).appUserId = guestId;
    (req as AppRequest).isGuest = true;
    // Keep the guest "alive" against the 30-day TTL. Fire-and-forget.
    void touchGuest(guestId).catch(() => {});
    next();
    return;
  }

  next(new UnauthorizedError());
};

/** The Clerk id or guest id for the current request. */
export function getAppUserId(req: Request): string {
  const id = (req as AppRequest).appUserId;
  if (!id) throw new UnauthorizedError();
  return id;
}

export function getIsGuest(req: Request): boolean {
  return (req as AppRequest).isGuest === true;
}

/** Require a valid guest token specifically (used for guest session restore). */
export const requireGuest: RequestHandler = (req, _res, next) => {
  const guestId = resolveGuestId(req);
  if (!guestId) {
    next(new UnauthorizedError());
    return;
  }
  (req as AppRequest).appUserId = guestId;
  (req as AppRequest).isGuest = true;
  next();
};
