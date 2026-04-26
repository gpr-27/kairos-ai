import { Router } from 'express';
import { z } from 'zod';
import { problemListQuerySchema } from '@kairos/types';

import { asyncHandler } from '../middleware/error-handler.js';
import { validateParams, validateQuery } from '../middleware/validate.js';
import { getProblemBySlug, listProblems } from '../services/problem.service.js';

const router = Router();

router.get(
  '/',
  validateQuery(problemListQuerySchema),
  asyncHandler(async (req, res) => {
    const result = await listProblems(req.query as never);
    res.json(result);
  }),
);

const slugParamSchema = z.object({ slug: z.string().min(1) });

router.get(
  '/:slug',
  validateParams(slugParamSchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };
    const problem = await getProblemBySlug(slug);
    res.json({ data: problem });
  }),
);

export { router as problemRouter };
