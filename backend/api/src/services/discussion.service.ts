import { NotFoundError, ValidationError } from '../errors/app-error.js';
import { DiscussionModel } from '../models/discussion.model.js';
import { getOrCreateUser } from './user.service.js';

export interface DiscussionComment {
  id: string;
  problemSlug: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  content: string;
  upvotes: number;
  upvotedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ListDiscussionsResult {
  comments: DiscussionComment[];
  total: number;
  page: number;
  totalPages: number;
}

function toDto(
  doc: InstanceType<typeof DiscussionModel>,
  requestingUserId?: string,
): DiscussionComment {
  return {
    id: (doc._id as { toString(): string }).toString(),
    problemSlug: doc.problemSlug as string,
    userId: doc.userId as string,
    displayName: doc.displayName as string,
    avatarUrl: (doc.avatarUrl ?? '') as string,
    content: doc.content as string,
    upvotes: ((doc.upvotes ?? []) as string[]).length,
    upvotedByMe: requestingUserId ? (doc.upvotes as string[]).includes(requestingUserId) : false,
    createdAt: (doc.createdAt as Date).toISOString(),
    updatedAt: (doc.updatedAt as Date).toISOString(),
  };
}

export async function listDiscussions(
  problemSlug: string,
  page = 1,
  limit = 20,
  requestingUserId?: string,
): Promise<ListDiscussionsResult> {
  const skip = (page - 1) * limit;
  const total = await DiscussionModel.countDocuments({ problemSlug });
  const docs = await DiscussionModel.find({ problemSlug })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  return {
    comments: docs.map((d) => toDto(d, requestingUserId)),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createComment(
  problemSlug: string,
  clerkId: string,
  content: string,
): Promise<DiscussionComment> {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 4000) {
    throw new ValidationError('Content must be between 1 and 4000 characters');
  }

  // Pull latest display info from the user record
  const user = await getOrCreateUser(clerkId);

  const doc = await DiscussionModel.create({
    problemSlug,
    userId: clerkId,
    displayName: (user.displayName ?? user.username ?? 'Anonymous') as string,
    avatarUrl: (user.avatarUrl ?? '') as string,
    content: trimmed,
  });

  return toDto(doc, clerkId);
}

export async function toggleUpvote(commentId: string, clerkId: string): Promise<DiscussionComment> {
  const doc = await DiscussionModel.findById(commentId);
  if (!doc) throw new NotFoundError('Comment');

  const upvotes = doc.upvotes as string[];
  const idx = upvotes.indexOf(clerkId);
  if (idx === -1) {
    upvotes.push(clerkId);
  } else {
    upvotes.splice(idx, 1);
  }
  doc.set('upvotes', upvotes);
  await doc.save();

  return toDto(doc, clerkId);
}

export async function deleteComment(commentId: string, clerkId: string): Promise<void> {
  const doc = await DiscussionModel.findById(commentId);
  if (!doc) throw new NotFoundError('Comment');
  if (doc.userId !== clerkId) {
    throw new ValidationError('You can only delete your own comments');
  }
  await doc.deleteOne();
}
