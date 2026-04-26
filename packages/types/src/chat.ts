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
}
