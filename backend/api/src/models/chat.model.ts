import { Schema, model, type InferSchemaType } from 'mongoose';

// A single stored turn. Each message keeps its own createdAt; no per-message updates.
const chatMessageSchema = new Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true, maxlength: 32_000 },
    intent: { type: String },
    model: { type: String },
  },
  { _id: false, timestamps: { createdAt: true, updatedAt: false } },
);

const chatSchema = new Schema(
  {
    userId: { type: String, required: true, index: true }, // Clerk user id
    title: { type: String, required: true, default: 'New chat', maxlength: 200 },
    source: {
      type: String,
      enum: ['assistant', 'solver', 'playground'],
      default: 'assistant',
      index: true,
    },
    problemSlug: { type: String },
    model: { type: String },
    messages: { type: [chatMessageSchema], default: [] },
  },
  { timestamps: true },
);

// Primary access pattern: a user's most-recently-updated chats first.
chatSchema.index({ userId: 1, updatedAt: -1 });

export type ChatDocument = InferSchemaType<typeof chatSchema> & { _id: unknown };

export const ChatModel = model('Chat', chatSchema);
