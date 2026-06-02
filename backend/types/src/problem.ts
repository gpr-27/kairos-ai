import { z } from 'zod';

export const PROBLEM_DIFFICULTIES = ['easy', 'medium', 'hard'] as const;
export const difficultySchema = z.enum(PROBLEM_DIFFICULTIES);
export type Difficulty = z.infer<typeof difficultySchema>;

export const PROBLEM_TRACKS = ['dsa', 'cp', 'system_design'] as const;
export const trackSchema = z.enum(PROBLEM_TRACKS);
export type Track = z.infer<typeof trackSchema>;

export const PROBLEM_TOPICS = [
  'arrays',
  'strings',
  'hashing',
  'two_pointers',
  'sliding_window',
  'binary_search',
  'recursion',
  'backtracking',
  'dynamic_programming',
  'greedy',
  'graphs',
  'trees',
  'tries',
  'heaps',
  'stacks_queues',
  'linked_lists',
  'bit_manipulation',
  'math',
  'sorting',
  'union_find',
  'segment_trees',
  'design',
  'scalability',
  'storage',
  'caching',
  'consistency',
] as const;
export const topicSchema = z.enum(PROBLEM_TOPICS);
export type Topic = z.infer<typeof topicSchema>;

export const testCaseSchema = z.object({
  input: z.string(),
  expectedOutput: z.string(),
  isHidden: z.boolean().default(false),
  explanation: z.string().optional(),
});

export type TestCase = z.infer<typeof testCaseSchema>;

export const problemSchema = z.object({
  id: z.string(),
  slug: z.string().min(1).max(120),
  title: z.string().min(1).max(200),
  track: trackSchema,
  difficulty: difficultySchema,
  topics: z.array(topicSchema).min(1),
  description: z.string().min(1),
  constraints: z.array(z.string()).default([]),
  examples: z
    .array(
      z.object({
        input: z.string(),
        output: z.string(),
        explanation: z.string().optional(),
      }),
    )
    .default([]),
  testCases: z.array(testCaseSchema).default([]),
  starterCode: z.record(z.string(), z.string()).default({}),
  hints: z.array(z.string()).default([]),
  editorial: z.string().optional(),
  source: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Problem = z.infer<typeof problemSchema>;

export const problemSummarySchema = problemSchema.pick({
  id: true,
  slug: true,
  title: true,
  track: true,
  difficulty: true,
  topics: true,
});

export type ProblemSummary = z.infer<typeof problemSummarySchema>;

export const problemListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  track: trackSchema.optional(),
  difficulty: difficultySchema.optional(),
  topic: topicSchema.optional(),
  search: z.string().trim().min(1).max(120).optional(),
});

export type ProblemListQuery = z.infer<typeof problemListQuerySchema>;
