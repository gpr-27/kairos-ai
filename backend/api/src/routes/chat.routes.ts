import {
  appendMessagesBodySchema,
  createChatBodySchema,
  listChatsQuerySchema,
  updateChatBodySchema,
  type AppendMessagesBody,
  type CreateChatBody,
  type ListChatsQuery,
  type UpdateChatBody,
} from '@kairos/types';
import { Router } from 'express';
import { z } from 'zod';

import { getAppUserId, requireAppUser } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/error-handler.js';
import { validateBody, validateParams, validateQuery } from '../middleware/validate.js';
import {
  appendMessages,
  createChat,
  deleteChat,
  getChat,
  listChats,
  renameChat,
} from '../services/chat.service.js';

const router = Router();

const idParamSchema = z.object({ id: z.string().length(24) });

// All chat routes are private and scoped to the authenticated user (Clerk OR guest).
router.use(requireAppUser);

// GET /chats  — list (with optional ?q= search and ?source= filter)
router.get(
  '/',
  validateQuery(listChatsQuerySchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const result = await listChats(userId, req.query as unknown as ListChatsQuery);
    res.json({ data: result });
  }),
);

// POST /chats  — create a new chat (optionally with initial messages)
router.post(
  '/',
  validateBody(createChatBodySchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const chat = await createChat(userId, req.body as CreateChatBody);
    res.status(201).json({ data: chat });
  }),
);

// GET /chats/:id  — full chat with messages
router.get(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const { id } = req.params as { id: string };
    const chat = await getChat(userId, id);
    res.json({ data: chat });
  }),
);

// PATCH /chats/:id  — rename
router.patch(
  '/:id',
  validateParams(idParamSchema),
  validateBody(updateChatBodySchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const { id } = req.params as { id: string };
    const { title } = req.body as UpdateChatBody;
    const chat = await renameChat(userId, id, title);
    res.json({ data: chat });
  }),
);

// DELETE /chats/:id  — delete
router.delete(
  '/:id',
  validateParams(idParamSchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const { id } = req.params as { id: string };
    await deleteChat(userId, id);
    res.status(204).send();
  }),
);

// POST /chats/:id/messages  — append message(s) after a streamed turn completes
router.post(
  '/:id/messages',
  validateParams(idParamSchema),
  validateBody(appendMessagesBodySchema),
  asyncHandler(async (req, res) => {
    const userId = getAppUserId(req);
    const { id } = req.params as { id: string };
    const chat = await appendMessages(userId, id, req.body as AppendMessagesBody);
    res.json({ data: chat });
  }),
);

export { router as chatRouter };
