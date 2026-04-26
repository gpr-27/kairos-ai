import { z } from 'zod';
import { languageSchema } from './common.js';

export const SUBMISSION_STATUSES = [
  'pending',
  'running',
  'accepted',
  'wrong_answer',
  'time_limit',
  'memory_limit',
  'runtime_error',
  'compile_error',
  'internal_error',
] as const;

export const submissionStatusSchema = z.enum(SUBMISSION_STATUSES);
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;

export const testCaseResultSchema = z.object({
  index: z.number().int().min(0),
  passed: z.boolean(),
  input: z.string(),
  expectedOutput: z.string(),
  actualOutput: z.string(),
  stderr: z.string().optional(),
  runtimeMs: z.number().optional(),
});

export type TestCaseResult = z.infer<typeof testCaseResultSchema>;

export const runCodeRequestSchema = z.object({
  problemId: z.string().min(1),
  language: languageSchema,
  code: z.string().min(1).max(50_000),
  stdin: z.string().max(10_000).optional(),
});

export type RunCodeRequest = z.infer<typeof runCodeRequestSchema>;

export const runCodeResponseSchema = z.object({
  status: submissionStatusSchema,
  testResults: z.array(testCaseResultSchema),
  passedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  runtimeMs: z.number().optional(),
  stderr: z.string().optional(),
  compileOutput: z.string().optional(),
});

export type RunCodeResponse = z.infer<typeof runCodeResponseSchema>;

export const submissionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  problemId: z.string(),
  language: languageSchema,
  code: z.string(),
  status: submissionStatusSchema,
  passedCount: z.number().int().min(0),
  totalCount: z.number().int().min(0),
  runtimeMs: z.number().optional(),
  createdAt: z.string().datetime(),
});

export type Submission = z.infer<typeof submissionSchema>;
