import { Router } from 'express';
import { z } from 'zod';

import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody } from '../middleware/validate.js';
import { executeCode } from '../services/piston.service.js';
import { PISTON_LANGUAGE_MAP } from '@kairos/types';

const router = Router();

const runBodySchema = z.object({
  language: z.string().min(1),
  code:     z.string().min(1).max(64_000),
  stdin:    z.string().max(32_000).optional().default(''),
});

// POST /playground/run  — public (no auth required)
router.post(
  '/run',
  validateBody(runBodySchema),
  asyncHandler(async (req, res) => {
    const { language, code, stdin } = req.body as {
      language: string;
      code:     string;
      stdin:    string;
    };

    // Map the canonical language key (e.g. "cpp") to the Piston language string (e.g. "c++")
    const pistonLang = PISTON_LANGUAGE_MAP[language as keyof typeof PISTON_LANGUAGE_MAP] ?? language;

    const result = await executeCode({
      language: pistonLang,
      code,
      stdin,
      timeoutMs: 10_000,
    });

    res.json({ data: result });
  }),
);

export { router as playgroundRouter };
