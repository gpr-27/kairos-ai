import { Router } from 'express';
import { runCodeRequestSchema } from '@kairos/types';

import { attachUserId, requireUser, type AuthenticatedRequest } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validate.js';
import { runCode } from '../services/submission.service.js';

const router = Router();

router.post(
  '/run',
  requireUser,
  attachUserId,
  validateBody(runCodeRequestSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req as AuthenticatedRequest;
    const result = await runCode({ userId, ...req.body });
    res.json({ data: result });
  }),
);

export { router as submissionRouter };
