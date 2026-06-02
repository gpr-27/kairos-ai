import { Router } from 'express';
import { z } from 'zod';
import { getAuth } from '@clerk/express';

import { asyncHandler } from '../middleware/error-handler.js';
import { requireUser } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  createComment,
  deleteComment,
  listDiscussions,
  toggleUpvote,
} from '../services/discussion.service.js';

const router = Router();

const slugParamSchema = z.object({ slug: z.string().min(1) });
const idParamSchema = z.object({ id: z.string().length(24) });
const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const createBodySchema = z.object({ content: z.string().min(1).max(4000) });

// GET /discussions/:slug  — public; pass optional user id for upvotedByMe
router.get(
  '/:slug',
  validateParams(slugParamSchema),
  validateQuery(listQuerySchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };
    const { page, limit } = req.query as unknown as { page: number; limit: number };
    const requestingUserId = getAuth(req).userId ?? undefined;
    const result = await listDiscussions(slug, page, limit, requestingUserId);
    res.json({ data: result });
  }),
);

// POST /discussions/:slug  — auth required
router.post(
  '/:slug',
  requireUser,
  validateParams(slugParamSchema),
  validateBody(createBodySchema),
  asyncHandler(async (req, res) => {
    const { slug } = req.params as { slug: string };
    const { content } = req.body as { content: string };
    const clerkId = getAuth(req).userId!;
    const comment = await createComment(slug, clerkId, content);
    res.status(201).json({ data: comment });
  }),
);

// POST /discussions/:id/upvote  — auth required, toggle
router.post(
  '/:id/upvote',
  requireUser,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const clerkId = getAuth(req).userId!;
    const comment = await toggleUpvote(id, clerkId);
    res.json({ data: comment });
  }),
);

// DELETE /discussions/:id  — auth required, own comments only
router.delete(
  '/:id',
  requireUser,
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };
    const clerkId = getAuth(req).userId!;
    await deleteComment(id, clerkId);
    res.status(204).send();
  }),
);

export { router as discussionRouter };
