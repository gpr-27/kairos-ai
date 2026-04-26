import { Router } from 'express';
import { z } from 'zod';
import { updateProfileSchema, userPreferencesSchema } from '@kairos/types';

import { attachUserId, requireUser, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validate.js';
import { completeOnboarding, getUserByClerkId, updateProfile } from '../services/user.service.js';

const router = Router();

router.get(
  '/me',
  requireUser,
  attachUserId,
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthenticatedRequest;
    const user = await getUserByClerkId(userId);
    res.json({ data: user });
  }),
);

router.patch(
  '/me',
  requireUser,
  attachUserId,
  validateBody(updateProfileSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthenticatedRequest;
    const user = await updateProfile(userId, req.body);
    res.json({ data: user });
  }),
);

const onboardingSchema = z.object({
  preferences: userPreferencesSchema.partial(),
});

router.post(
  '/me/onboarding',
  requireUser,
  attachUserId,
  validateBody(onboardingSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthenticatedRequest;
    const user = await completeOnboarding(userId, req.body.preferences);
    res.json({ data: user });
  }),
);

export { router as userRouter };
