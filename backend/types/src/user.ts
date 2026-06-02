import { z } from 'zod';
import { topicSchema } from './problem.js';

export const SKILL_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;
export const skillLevelSchema = z.enum(SKILL_LEVELS);
export type SkillLevel = z.infer<typeof skillLevelSchema>;

export const userPreferencesSchema = z.object({
  skillLevel: skillLevelSchema.default('beginner'),
  preferredLanguage: z.string().default('python'),
  goals: z.array(z.string()).default([]),
  interests: z.array(topicSchema).default([]),
  theme: z.enum(['dark', 'light', 'system']).default('dark'),
});

export type UserPreferences = z.infer<typeof userPreferencesSchema>;

export const userStatsSchema = z.object({
  problemsSolved: z.number().int().min(0).default(0),
  totalSubmissions: z.number().int().min(0).default(0),
  currentStreak: z.number().int().min(0).default(0),
  longestStreak: z.number().int().min(0).default(0),
  xp: z.number().int().min(0).default(0),
  level: z.number().int().min(1).default(1),
  lastActiveAt: z.string().datetime().optional(),
});

export type UserStats = z.infer<typeof userStatsSchema>;

export const userProfileSchema = z.object({
  id: z.string(),
  clerkId: z.string(),
  email: z.string().email(),
  username: z.string().min(3).max(40),
  displayName: z.string().min(1).max(80),
  avatarUrl: z.string().url().optional(),
  bio: z.string().max(500).optional(),
  preferences: userPreferencesSchema,
  stats: userStatsSchema,
  onboardingCompleted: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(80).optional(),
  username: z
    .string()
    .min(3)
    .max(40)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  bio: z.string().max(500).optional(),
  preferences: userPreferencesSchema.partial().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
