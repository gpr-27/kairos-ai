import { z } from 'zod';
import { languageSchema } from './common.js';

export const CHAT_ROLES = ['user', 'assistant', 'system', 'tool'] as const;
export const chatRoleSchema = z.enum(CHAT_ROLES);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const COACH_INTENTS = [
  'ask',
  'hint',
  'review_code',
  'check_complexity',
  'explain_concept',
  'general',
  'playground_explain',
  'playground_debug',
  'playground_optimize',
  'playground_ask',
] as const;
export const coachIntentSchema = z.enum(COACH_INTENTS);
export type CoachIntent = z.infer<typeof coachIntentSchema>;

export const chatMessageSchema = z.object({
  id: z.string(),
  role: chatRoleSchema,
  content: z.string(),
  intent: coachIntentSchema.optional(),
  toolCalls: z
    .array(
      z.object({
        name: z.string(),
        args: z.record(z.string(), z.unknown()),
      }),
    )
    .optional(),
  createdAt: z.string().datetime(),
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;

export const chatSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  problemId: z.string().optional(),
  title: z.string().optional(),
  messages: z.array(chatMessageSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ChatSession = z.infer<typeof chatSessionSchema>;

export const chatRequestSchema = z.object({
  sessionId: z.string().optional(),
  problemId: z.string().optional(),
  message: z.string().min(1).max(8000),
  intent: coachIntentSchema.optional(),
  /** Optional model id (must be one of the server's AVAILABLE_MODELS). */
  model: z.string().optional(),
  context: z
    .object({
      currentCode: z.string().max(50_000).optional(),
      language: languageSchema.optional(),
      lastError: z.string().max(5000).optional(),
    })
    .optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatStreamChunk {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  toolName?: string;
  toolArgs?: Record<string, unknown>;
  toolResult?: unknown;
  error?: string;
  sessionId?: string;
  messageId?: string;
  /** The model that actually served the response (sent on the `done` chunk). */
  model?: string;
}

// ── Persisted chat sessions (history: list / search / rename / delete) ─────────

/** Where a chat originated: the dedicated assistant page, the solver, or the playground. */
export const CHAT_SOURCES = ['assistant', 'solver', 'playground'] as const;
export const chatSourceSchema = z.enum(CHAT_SOURCES);
export type ChatSource = z.infer<typeof chatSourceSchema>;

/** A single stored turn. The server stamps `createdAt`. */
export const persistedChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(32_000),
  intent: coachIntentSchema.optional(),
  model: z.string().optional(),
  createdAt: z.string().datetime().optional(),
});
export type PersistedChatMessage = z.infer<typeof persistedChatMessageSchema>;

export const createChatBodySchema = z.object({
  title: z.string().min(1).max(200).optional(),
  source: chatSourceSchema.default('assistant'),
  problemSlug: z.string().max(200).optional(),
  model: z.string().optional(),
  /** Optional initial messages (e.g. the first user+assistant pair). */
  messages: z.array(persistedChatMessageSchema).max(2).optional(),
});
export type CreateChatBody = z.infer<typeof createChatBodySchema>;

export const updateChatBodySchema = z.object({
  title: z.string().min(1).max(200),
});
export type UpdateChatBody = z.infer<typeof updateChatBodySchema>;

export const appendMessagesBodySchema = z.object({
  messages: z.array(persistedChatMessageSchema).min(1).max(2),
  model: z.string().optional(),
});
export type AppendMessagesBody = z.infer<typeof appendMessagesBodySchema>;

export const listChatsQuerySchema = z.object({
  q: z.string().max(200).optional(),
  source: chatSourceSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(30),
});
export type ListChatsQuery = z.infer<typeof listChatsQuerySchema>;

export interface ChatSessionSummary {
  id: string;
  title: string;
  source: ChatSource;
  problemSlug?: string;
  model?: string;
  messageCount: number;
  lastMessagePreview?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredChatMessage {
  role: 'user' | 'assistant';
  content: string;
  intent?: CoachIntent;
  model?: string;
  createdAt: string;
}

export interface ChatSessionDetail extends ChatSessionSummary {
  messages: StoredChatMessage[];
}

export interface ListChatsResult {
  chats: ChatSessionSummary[];
  total: number;
  page: number;
  totalPages: number;
}
