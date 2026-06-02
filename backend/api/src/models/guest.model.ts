import { Schema, model, type InferSchemaType } from 'mongoose';

// Inactive guests are auto-removed after 30 days (TTL on lastActiveAt).
const THIRTY_DAYS_SECONDS = 30 * 24 * 60 * 60;

const guestPreferencesSchema = new Schema(
  {
    preferredLanguage: { type: String, default: 'python' },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
  },
  { _id: false },
);

const guestSchema = new Schema(
  {
    guestId: { type: String, required: true, unique: true, index: true }, // "guest_<uuid>"
    isGuest: { type: Boolean, default: true },
    displayName: { type: String, default: 'Guest User' },
    preferences: { type: guestPreferencesSchema, default: () => ({}) },
    // Set when the guest upgrades to a Clerk account (audit trail before deletion).
    migratedToClerkId: { type: String },
    lastActiveAt: { type: Date, default: () => new Date() },
  },
  { timestamps: true },
);

// TTL index: Mongo removes guest docs whose lastActiveAt is older than 30 days.
// lastActiveAt is bumped on every authenticated guest request, so active guests persist.
guestSchema.index({ lastActiveAt: 1 }, { expireAfterSeconds: THIRTY_DAYS_SECONDS });

export type GuestDocument = InferSchemaType<typeof guestSchema> & { _id: unknown };

export const GuestModel = model('Guest', guestSchema);
