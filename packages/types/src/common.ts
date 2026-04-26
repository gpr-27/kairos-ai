import { z } from 'zod';

export const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Must be a valid Mongo ObjectId');

export type ObjectId = z.infer<typeof objectIdSchema>;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface ApiSuccess<T> {
  data: T;
}

export const SUPPORTED_LANGUAGES = [
  'python',
  'cpp',
  'java',
  'javascript',
  'typescript',
  'go',
  'rust',
  'ruby',
  'c',
  'csharp',
  'kotlin',
  'swift',
  'php',
  'scala',
  'bash',
] as const;

export const languageSchema = z.enum(SUPPORTED_LANGUAGES);
export type Language = z.infer<typeof languageSchema>;

export const LANGUAGE_LABELS: Record<Language, string> = {
  python: 'Python',
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  go: 'Go',
  rust: 'Rust',
  ruby: 'Ruby',
  c: 'C',
  csharp: 'C#',
  kotlin: 'Kotlin',
  swift: 'Swift',
  php: 'PHP',
  scala: 'Scala',
  bash: 'Bash',
};

export const PISTON_LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  cpp: 'c++',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  c: 'c',
  csharp: 'csharp.net',
  kotlin: 'kotlin',
  swift: 'swift',
  php: 'php',
  scala: 'scala',
  bash: 'bash',
};

export const MONACO_LANGUAGE_MAP: Record<Language, string> = {
  python: 'python',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
  go: 'go',
  rust: 'rust',
  ruby: 'ruby',
  c: 'c',
  csharp: 'csharp',
  kotlin: 'kotlin',
  swift: 'swift',
  php: 'php',
  scala: 'scala',
  bash: 'shell',
};
