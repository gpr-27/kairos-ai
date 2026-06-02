import { Router } from 'express';
import { runCodeRequestSchema } from '@kairos/types';

import { getAppUserId, requireAppUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validate.js';
import { runCode } from '../services/submission.service.js';

const router = Router();

router.post(
  '/run',
  requireAppUser,
  validateBody(runCodeRequestSchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const result = await runCode({ userId, ...req.body });
    res.json({ data: result });
  }),
);

export { router as submissionRouter };
