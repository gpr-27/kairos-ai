import { Schema, model, type InferSchemaType } from 'mongoose';

const userPreferencesSchema = new Schema(
  {
    skillLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    preferredLanguage: { type: String, default: 'python' },
    goals: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  },
  { _id: false },
);

const userStatsSchema = new Schema(
  {
    problemsSolved: { type: Number, default: 0 },
    totalSubmissions: { type: Number, default: 0 },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastActiveAt: { type: Date },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    clerkId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    username: { type: String, required: true, unique: true, trim: true, index: true },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String },
    bio: { type: String, maxlength: 500 },
    preferences: { type: userPreferencesSchema, default: () => ({}) },
    stats: { type: userStatsSchema, default: () => ({}) },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type UserDocument = InferSchemaType<typeof userSchema> & { _id: unknown };

export const UserModel = model('User', userSchema);
