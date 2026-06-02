/**
 * HMAC-signed guest session tokens.
 *
 * A guest token is `"<guestId>.<sig>"` where sig = base64url(HMAC-SHA256(guestId)).
 * The signature is verified server-side, so a client cannot forge or swap to
 * another guest's id — the token is the guest's bearer credential.
 */
import { createHmac, timingSafeEqual } from 'node:crypto';

import { config } from '../config/index.js';

const SEPARATOR = '.';
const GUEST_PREFIX = 'guest_';

function sign(guestId: string): string {
  return createHmac('sha256', config.guest.tokenSecret).update(guestId).digest('base64url');
}

/** Build a signed token for a guest id. */
export function createGuestToken(guestId: string): string {
  return `${guestId}${SEPARATOR}${sign(guestId)}`;
}

/** Verify a token and return its guest id, or null if invalid/tampered. */
export function verifyGuestToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const idx = token.lastIndexOf(SEPARATOR);
  if (idx <= 0) return null;

  const guestId = token.slice(0, idx);
  const providedSig = token.slice(idx + 1);
  if (!guestId.startsWith(GUEST_PREFIX)) return null;

  const expectedSig = sign(guestId);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length) return null;
  if (!timingSafeEqual(a, b)) return null;

  return guestId;
}
