import { getAuth } from '@clerk/express';
import { Router } from 'express';

import { ValidationError } from '../errors/app-error.js';
import { getAppUserId, requireGuest, requireUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { createGuest, getGuest, migrateGuestToClerk } from '../services/guest.service.js';
import { verifyGuestToken } from '../services/guest-token.js';

const router = Router();

// POST /guests — create a new anonymous guest (public; no auth required)
router.post(
  '/',
  asyncHandler(async (_req, res) => {
    const { guest, token } = await createGuest();
    res.status(201).json({ data: { ...guest, token } });
  }),
);

// GET /guests/me — restore an existing guest session (requires a valid guest token)
router.get(
  '/me',
  requireGuest,
  asyncHandler(async (req, res) => {
    const guest = await getGuest(getAppUserId(req));
    res.json({ data: guest });
  }),
);

// POST /guests/migrate — upgrade: move guest data to the signed-in Clerk user.
// Requires BOTH a Clerk session (the destination account) and the guest token.
router.post(
  '/migrate',
  requireUser,
  asyncHandler(async (req, res) => {
    const clerkId = getAuth(req).userId!;
    const guestId = verifyGuestToken(req.header('x-guest-token'));
    if (!guestId) throw new ValidationError('Missing or invalid guest token');
    const result = await migrateGuestToClerk(guestId, clerkId);
    res.json({ data: result });
  }),
);

export { router as guestRouter };
