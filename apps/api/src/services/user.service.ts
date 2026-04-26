import { createClerkClient } from '@clerk/express';

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { ExternalServiceError, NotFoundError } from '../errors/app-error.js';
import { UserModel } from '../models/user.model.js';

const clerkClient = createClerkClient({ secretKey: env.CLERK_SECRET_KEY });

export async function getOrCreateUser(
  clerkId: string,
): Promise<ReturnType<typeof UserModel.hydrate>> {
  let user = await UserModel.findOne({ clerkId });
  if (user) return user;

  let clerkUser;
  try {
    clerkUser = await clerkClient.users.getUser(clerkId);
  } catch (err) {
    logger.error({ err, clerkId }, 'Failed to fetch Clerk user');
    // A 404 from Clerk means the user genuinely doesn't exist.
    // Any other error (network, 5xx) is an upstream dependency failure.
    const status = (err as { status?: number }).status;
    if (status === 404) throw new NotFoundError('User');
    throw new ExternalServiceError('Clerk', { clerkId });
  }

  const email =
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

  if (!email) {
    throw new NotFoundError('User email');
  }

  const baseUsername =
    clerkUser.username ??
    email.split('@')[0]?.replace(/[^a-zA-Z0-9_-]/g, '') ??
    `user-${clerkId.slice(-8)}`;

  let username = baseUsername;
  let counter = 0;
  while (await UserModel.exists({ username })) {
    counter += 1;
    username = `${baseUsername}-${counter}`;
  }

  user = await UserModel.create({
    clerkId,
    email,
    username,
    displayName: clerkUser.fullName ?? clerkUser.firstName ?? username,
    avatarUrl: clerkUser.imageUrl,
  });

  logger.info({ clerkId, username }, 'Created new user');
  return user;
}

export async function getUserByClerkId(clerkId: string) {
  const user = await getOrCreateUser(clerkId);
  return user.toObject();
}

export interface UpdateProfilePayload {
  displayName?: string;
  username?: string;
  bio?: string;
  preferences?: Partial<{
    skillLevel: 'beginner' | 'intermediate' | 'advanced';
    preferredLanguage: string;
    goals: string[];
    interests: string[];
    theme: 'dark' | 'light' | 'system';
  }>;
}

export async function updateProfile(clerkId: string, payload: UpdateProfilePayload) {
  const user = await getOrCreateUser(clerkId);

  if (payload.displayName !== undefined) user.set('displayName', payload.displayName);
  if (payload.username !== undefined) user.set('username', payload.username);
  if (payload.bio !== undefined) user.set('bio', payload.bio);
  if (payload.preferences) {
    const merged = { ...user.toObject().preferences, ...payload.preferences };
    user.set('preferences', merged);
  }

  await user.save();
  return user.toObject();
}

export async function completeOnboarding(
  clerkId: string,
  preferences: NonNullable<UpdateProfilePayload['preferences']>,
) {
  const user = await getOrCreateUser(clerkId);
  const merged = { ...user.toObject().preferences, ...preferences };
  user.set('preferences', merged);
  user.set('onboardingCompleted', true);
  await user.save();
  return user.toObject();
}
