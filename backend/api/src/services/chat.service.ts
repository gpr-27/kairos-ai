import type {
  AppendMessagesBody,
  ChatSessionDetail,
  ChatSessionSummary,
  CreateChatBody,
  ListChatsQuery,
  ListChatsResult,
  PersistedChatMessage,
  StoredChatMessage,
} from '@kairos/types';
import type { FilterQuery } from 'mongoose';

import { NotFoundError } from '../errors/app-error.js';
import { ChatModel, type ChatDocument } from '../models/chat.model.js';

const DEFAULT_TITLE = 'New chat';
const TITLE_MAX = 60;

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Derive a readable title from the first user message. */
function deriveTitle(messages: PersistedChatMessage[] | undefined): string {
  const firstUser = messages?.find((m) => m.role === 'user');
  const oneLine = firstUser?.content.replace(/\s+/g, ' ').trim();
  if (!oneLine) return DEFAULT_TITLE;
  return oneLine.length > TITLE_MAX ? `${oneLine.slice(0, TITLE_MAX).trimEnd()}…` : oneLine;
}

/** Strip the optional client-supplied createdAt; the DB stamps it. */
function toNewSubdoc(m: PersistedChatMessage): Record<string, unknown> {
  return {
    role: m.role,
    content: m.content,
    ...(m.intent ? { intent: m.intent } : {}),
    ...(m.model ? { model: m.model } : {}),
    createdAt: new Date(),
  };
}

function toStoredMessage(m: Record<string, unknown>): StoredChatMessage {
  return {
    role: m.role as 'user' | 'assistant',
    content: m.content as string,
    ...(m.intent ? { intent: m.intent as StoredChatMessage['intent'] } : {}),
    ...(m.model ? { model: m.model as string } : {}),
    createdAt: ((m.createdAt as Date | undefined) ?? new Date()).toISOString(),
  };
}

function readMessages(doc: ChatDocument): Array<Record<string, unknown>> {
  return (doc.messages ?? []) as unknown as Array<Record<string, unknown>>;
}

function toSummary(doc: ChatDocument): ChatSessionSummary {
  const messages = readMessages(doc);
  const last = messages[messages.length - 1];
  return {
    id: (doc._id as { toString(): string }).toString(),
    title: doc.title as string,
    source: doc.source as ChatSessionSummary['source'],
    ...(doc.problemSlug ? { problemSlug: doc.problemSlug as string } : {}),
    ...(doc.model ? { model: doc.model as string } : {}),
    messageCount: messages.length,
    ...(last ? { lastMessagePreview: (last.content as string).slice(0, 140) } : {}),
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

function toDetail(doc: ChatDocument): ChatSessionDetail {
  return { ...toSummary(doc), messages: readMessages(doc).map(toStoredMessage) };
}

export async function createChat(userId: string, body: CreateChatBody): Promise<ChatSessionDetail> {
  const doc = await ChatModel.create({
    userId,
    title: body.title?.trim() || deriveTitle(body.messages),
    source: body.source,
    ...(body.problemSlug ? { problemSlug: body.problemSlug } : {}),
    ...(body.model ? { model: body.model } : {}),
    messages: (body.messages ?? []).map(toNewSubdoc),
  });
  return toDetail(doc as unknown as ChatDocument);
}

export async function listChats(userId: string, query: ListChatsQuery): Promise<ListChatsResult> {
  const filter: FilterQuery<ChatDocument> = { userId };
  if (query.source) filter.source = query.source;
  if (query.q?.trim()) {
    const rx = new RegExp(escapeRegex(query.q.trim()), 'i');
    filter.$or = [{ title: rx }, { 'messages.content': rx }];
  }

  const skip = (query.page - 1) * query.limit;
  const total = await ChatModel.countDocuments(filter);
  const docs = await ChatModel.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(query.limit);

  return {
    chats: docs.map((d) => toSummary(d as unknown as ChatDocument)),
    total,
    page: query.page,
    totalPages: Math.max(1, Math.ceil(total / query.limit)),
  };
}

export async function getChat(userId: string, id: string): Promise<ChatSessionDetail> {
  const doc = await ChatModel.findOne({ _id: id, userId });
  if (!doc) throw new NotFoundError('Chat');
  return toDetail(doc as unknown as ChatDocument);
}

export async function renameChat(
  userId: string,
  id: string,
  title: string,
): Promise<ChatSessionSummary> {
  const doc = await ChatModel.findOneAndUpdate(
    { _id: id, userId },
    { $set: { title: title.trim() } },
    { new: true },
  );
  if (!doc) throw new NotFoundError('Chat');
  return toSummary(doc as unknown as ChatDocument);
}

export async function deleteChat(userId: string, id: string): Promise<void> {
  const result = await ChatModel.deleteOne({ _id: id, userId });
  if (result.deletedCount === 0) throw new NotFoundError('Chat');
}

export async function appendMessages(
  userId: string,
  id: string,
  body: AppendMessagesBody,
): Promise<ChatSessionDetail> {
  const doc = await ChatModel.findOne({ _id: id, userId });
  if (!doc) throw new NotFoundError('Chat');

  const messages = readMessages(doc);
  for (const m of body.messages) messages.push(toNewSubdoc(m));
  doc.markModified('messages');
  if (body.model) doc.set('model', body.model);
  if ((doc.title as string) === DEFAULT_TITLE) doc.set('title', deriveTitle(body.messages));
  await doc.save();

  return toDetail(doc as unknown as ChatDocument);
}
