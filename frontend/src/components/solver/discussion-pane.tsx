import { useCallback, useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useUser } from '@clerk/clerk-react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  MessageSquarePlus,
  RefreshCw,
  ThumbsUp,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiFetch } from '@/lib/api-client';
import { useAuthenticatedFetch } from '@/hooks/use-authenticated-fetch';
import { cn } from '@/lib/utils';
import type { DiscussionComment, ListDiscussionsResponse } from '@kairos/types';

const POLL_INTERVAL_MS = 30_000;

interface DiscussionPaneProps {
  problemSlug: string;
}

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ src, name }: { src: string; name: string }) {
  const initials = name
    .split(' ')
    .map((w) => w[0]?.toUpperCase() ?? '')
    .slice(0, 2)
    .join('');

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className="ring-border/60 h-7 w-7 shrink-0 rounded-full object-cover ring-1"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
    );
  }
  return (
    <div className="bg-primary/20 text-primary ring-border/60 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ring-1">
      {initials}
    </div>
  );
}

// ── Single comment card ───────────────────────────────────────────────────────

function CommentCard({
  comment,
  currentUserId,
  onUpvote,
  onDelete,
}: {
  comment: DiscussionComment;
  currentUserId: string | null | undefined;
  onUpvote: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isOwn = currentUserId === comment.userId;
  const timeAgo = formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true });

  return (
    <div className="border-border/60 bg-background/40 hover:bg-background/70 group rounded-lg border p-3.5 transition-colors">
      {/* Header */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar src={comment.avatarUrl} name={comment.displayName} />
          <div className="min-w-0">
            <span className="block truncate text-xs font-semibold">{comment.displayName}</span>
            <span className="text-muted-foreground text-[10px]">{timeAgo}</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isOwn && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-muted-foreground hover:text-destructive rounded p-1 transition-colors"
              title="Delete comment"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="prose dark:prose-invert prose-sm prose-p:text-muted-foreground prose-p:my-0 prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none max-w-none text-sm">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
      </div>

      {/* Footer */}
      <div className="mt-2.5 flex items-center gap-1">
        <button
          onClick={() => onUpvote(comment.id)}
          disabled={!currentUserId}
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] font-medium transition-colors',
            comment.upvotedByMe
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
            !currentUserId && 'cursor-default opacity-50',
          )}
          title={
            currentUserId ? (comment.upvotedByMe ? 'Remove upvote' : 'Upvote') : 'Sign in to upvote'
          }
        >
          <ThumbsUp className="h-3 w-3" />
          <span>{comment.upvotes}</span>
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DiscussionPane({ problemSlug }: DiscussionPaneProps) {
  const { user, isSignedIn } = useUser();
  const authedFetch = useAuthenticatedFetch();

  const [comments, setComments] = useState<DiscussionComment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchComments = useCallback(
    async (targetPage = page, silent = false) => {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      try {
        const result = await apiFetch<ListDiscussionsResponse>(
          `/api/v1/discussions/${problemSlug}?page=${targetPage}&limit=20`,
        );
        setComments(result.comments);
        setTotal(result.total);
        setTotalPages(result.totalPages);
        setPage(targetPage);
      } catch {
        if (!silent) toast.error('Could not load discussions.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [problemSlug, page],
  );

  useEffect(() => {
    fetchComments(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [problemSlug]);

  // Poll every 30 s so comments from other users appear automatically
  useEffect(() => {
    pollRef.current = setInterval(() => {
      fetchComments(page, true);
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchComments, page]);

  // ── Post comment ─────────────────────────────────────────────────────────

  async function handlePost() {
    if (!draft.trim() || posting) return;
    setPosting(true);
    try {
      const comment = await authedFetch<DiscussionComment>(`/api/v1/discussions/${problemSlug}`, {
        method: 'POST',
        body: JSON.stringify({ content: draft.trim() }),
      });
      setComments((prev) => [comment, ...prev]);
      setTotal((t) => t + 1);
      setDraft('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to post comment.');
    } finally {
      setPosting(false);
    }
  }

  // ── Upvote ────────────────────────────────────────────────────────────────

  async function handleUpvote(commentId: string) {
    if (!isSignedIn) return;
    try {
      const updated = await authedFetch<DiscussionComment>(
        `/api/v1/discussions/${commentId}/upvote`,
        { method: 'POST' },
      );
      setComments((prev) => prev.map((c) => (c.id === commentId ? updated : c)));
    } catch {
      toast.error('Could not upvote.');
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;
    try {
      await authedFetch(`/api/v1/discussions/${commentId}`, { method: 'DELETE' });
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      setTotal((t) => Math.max(0, t - 1));
      toast.success('Comment deleted.');
    } catch {
      toast.error('Could not delete comment.');
    }
  }

  // ── Keyboard submit ───────────────────────────────────────────────────────

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handlePost();
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="bg-card/30 flex h-full flex-col overflow-hidden">
      {/* ── Header ── */}
      <div className="border-border/60 flex shrink-0 items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">Discussion</span>
          {total > 0 && (
            <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-[10px] font-medium">
              {total}
            </span>
          )}
        </div>
        <button
          onClick={() => fetchComments(page, true)}
          disabled={refreshing}
          className="text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
          title="Refresh"
        >
          <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
        </button>
      </div>

      {/* ── Compose box ── */}
      {isSignedIn ? (
        <div className="border-border/60 shrink-0 border-b p-3">
          <div className="flex gap-2">
            <Avatar src={user?.imageUrl ?? ''} name={user?.fullName ?? user?.username ?? 'You'} />
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Share your approach, ask a question, or discuss a concept… (Markdown supported)"
                rows={3}
                maxLength={4000}
                className="border-border/60 bg-background/50 text-foreground placeholder:text-muted-foreground focus:border-primary w-full resize-none rounded-md border px-3 py-2 text-xs outline-none transition-colors"
              />
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-muted-foreground text-[10px]">
                  {draft.length}/4000 · ⌘↵ to post
                </span>
                <Button
                  size="sm"
                  onClick={handlePost}
                  disabled={!draft.trim() || posting}
                  className="h-7 px-3 text-xs"
                >
                  {posting ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Post'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-border/60 bg-muted/20 shrink-0 border-b px-4 py-3 text-center">
          <p className="text-muted-foreground text-xs">Sign in to join the discussion.</p>
        </div>
      )}

      {/* ── Comment list ── */}
      <ScrollArea className="flex-1">
        <div className="space-y-2.5 px-3 py-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
              <span className="text-muted-foreground text-xs">Loading discussions…</span>
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <MessageSquarePlus className="text-muted-foreground/40 h-8 w-8" />
              <p className="text-muted-foreground text-sm font-medium">No comments yet</p>
              <p className="text-muted-foreground/70 text-xs">
                Be the first to share your approach!
              </p>
            </div>
          ) : (
            comments.map((c) => (
              <CommentCard
                key={c.id}
                comment={c}
                currentUserId={user?.id}
                onUpvote={handleUpvote}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <>
            <Separator className="mx-3" />
            <div className="flex items-center justify-center gap-2 px-3 py-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={page <= 1}
                onClick={() => fetchComments(page - 1, false)}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Prev
              </Button>
              <span className="text-muted-foreground text-xs tabular-nums">
                {page} / {totalPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                disabled={page >= totalPages}
                onClick={() => fetchComments(page + 1, false)}
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
