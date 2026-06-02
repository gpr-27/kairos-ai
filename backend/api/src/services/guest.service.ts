import { randomUUID } from 'node:crypto';

import { logger } from '../config/logger.js';
import { NotFoundError } from '../errors/app-error.js';
import { ChatModel } from '../models/chat.model.js';
import { GuestModel, type GuestDocument } from '../models/guest.model.js';
import { SubmissionModel } from '../models/submission.model.js';
import { createGuestToken } from './guest-token.js';

export interface GuestDto {
  guestId: string;
  isGuest: true;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
}

function toDto(doc: GuestDocument): GuestDto {
  return {
    guestId: doc.guestId as string,
    isGuest: true,
    displayName: doc.displayName as string,
    createdAt: (doc.createdAt as Date).toISOString(),
    lastActiveAt: (doc.lastActiveAt as Date).toISOString(),
  };
}

/** Create a new anonymous guest and its signed session token. */
export async function createGuest(): Promise<{ guest: GuestDto; token: string }> {
  const guestId = `guest_${randomUUID()}`;
  const doc = await GuestModel.create({ guestId, lastActiveAt: new Date() });
  logger.info({ guestId }, 'Created guest user');
  return { guest: toDto(doc as unknown as GuestDocument), token: createGuestToken(guestId) };
}

/** Fetch a guest (for session restoration) and bump lastActiveAt. */
export async function getGuest(guestId: string): Promise<GuestDto> {
  const doc = await GuestModel.findOneAndUpdate(
    { guestId },
    { $set: { lastActiveAt: new Date() } },
    { new: true },
  );
  if (!doc) throw new NotFoundError('Guest');
  return toDto(doc as unknown as GuestDocument);
}

/** Bump lastActiveAt without returning the doc (cheap, fire-and-forget per request). */
export async function touchGuest(guestId: string): Promise<void> {
  await GuestModel.updateOne({ guestId }, { $set: { lastActiveAt: new Date() } });
}

export interface MigrationResult {
  chatsMigrated: number;
  submissionsMigrated: number;
}

/**
 * Reassign all of a guest's data to a Clerk user, then remove the guest record.
 * Chats and submissions are scoped by a plain `userId` string, so migration is a
 * re-key from the guestId to the clerkId. Client-side progress (localStorage)
 * carries over automatically in the same browser.
 */
export async function migrateGuestToClerk(
  guestId: string,
  clerkId: string,
): Promise<MigrationResult> {
  const chats = await ChatModel.updateMany({ userId: guestId }, { $set: { userId: clerkId } });
  const submissions = await SubmissionModel.updateMany(
    { userId: guestId },
    { $set: { userId: clerkId } },
  );

  await GuestModel.updateOne({ guestId }, { $set: { migratedToClerkId: clerkId } });
  await GuestModel.deleteOne({ guestId });

  const result: MigrationResult = {
    chatsMigrated: chats.modifiedCount ?? 0,
    submissionsMigrated: submissions.modifiedCount ?? 0,
  };
  logger.info({ guestId, clerkId, ...result }, 'Migrated guest data to Clerk user');
  return result;
}
