import { z } from 'zod';

export const discussionCommentSchema = z.object({
  id: z.string(),
  problemSlug: z.string(),
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string(),
  content: z.string(),
  upvotes: z.number().int().min(0),
  upvotedByMe: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type DiscussionComment = z.infer<typeof discussionCommentSchema>;

export const listDiscussionsResponseSchema = z.object({
  comments: z.array(discussionCommentSchema),
  total: z.number(),
  page: z.number(),
  totalPages: z.number(),
});

export type ListDiscussionsResponse = z.infer<typeof listDiscussionsResponseSchema>;

export const createCommentSchema = z.object({
  content: z.string().min(1).max(4000),
});

export type CreateCommentPayload = z.infer<typeof createCommentSchema>;
