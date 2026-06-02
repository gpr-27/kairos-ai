import { Schema, model, type InferSchemaType } from 'mongoose';

const discussionSchema = new Schema(
  {
    problemSlug: { type: String, required: true, index: true },
    userId: { type: String, required: true }, // Clerk user id
    displayName: { type: String, required: true },
    avatarUrl: { type: String, default: '' },
    content: { type: String, required: true, maxlength: 4000 },
    upvotes: { type: [String], default: [] }, // array of Clerk user ids
  },
  { timestamps: true },
);

discussionSchema.index({ problemSlug: 1, createdAt: -1 });

export type DiscussionDocument = InferSchemaType<typeof discussionSchema> & { _id: unknown };

export const DiscussionModel = model('Discussion', discussionSchema);
