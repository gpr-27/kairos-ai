import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { formatDistanceToNow } from 'date-fns';
import {
  Check,
  Loader2,
  Menu,
  MessageSquarePlus,
  MoreHorizontal,
  Pencil,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModelSelector } from '@/components/ui/model-selector';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { config, getMlBaseUrl } from '@/config';
import { useDebounce } from '@/hooks/use-debounce';
import {
  useChat,
  useChats,
  useChatsApi,
  useDeleteChat,
  useInvalidateChats,
  useRenameChat,
} from '@/hooks/use-chats';
import { parseChunkPayload, parseSSEChunk } from '@/lib/chat-stream';
import { cn } from '@/lib/utils';
import type { ChatSessionSummary } from '@kairos/types';

// ── Constants ────────────────────────────────────────────────────────────────

const HISTORY_LIMIT = 6;

const EMPTY_STREAM_FALLBACK =
  "I wasn't able to generate a response — the AI Coach may be unavailable or rate-limited. Please try again in a moment.";

// ── Types ────────────────────────────────────────────────────────────────────

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  model?: string;
}

// ── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: DisplayMessage }): JSX.Element {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="bg-primary text-primary-foreground max-w-[82%] rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3">
      <Avatar className="mt-0.5 h-7 w-7 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600">
        <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {message.pending && !message.content ? (
          <div className="flex items-center gap-1 pt-1">
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 animate-bounce rounded-full bg-zinc-400"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        ) : (
          <div className="text-foreground text-sm leading-relaxed">
            <MarkdownMessage content={message.content} />
            {message.pending && message.content && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-violet-400 align-middle" />
            )}
            {!message.pending && message.model && (
              <div className="mt-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-400/80">
                  <Sparkles className="h-2.5 w-2.5" />
                  {message.model}
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sidebar session row ──────────────────────────────────────────────────────

function SessionRow({
  session,
  active,
  onOpen,
  onRename,
  onDelete,
}: {
  session: ChatSessionSummary;
  active: boolean;
  onOpen: () => void;
  onRename: (title: string) => void;
  onDelete: () => void;
}): JSX.Element {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(session.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function commitRename(): void {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== session.title) onRename(trimmed);
    setEditing(false);
  }

  const relativeTime = useMemo(() => {
    try {
      return formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true });
    } catch {
      return '';
    }
  }, [session.updatedAt]);

  if (editing) {
    return (
      <div className="border-border/60 bg-card/60 flex items-center gap-1 rounded-lg border px-2 py-1.5">
        <Input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitRename();
            if (e.key === 'Escape') {
              setDraft(session.title);
              setEditing(false);
            }
          }}
          className="h-7 px-2 text-sm"
        />
        <button
          onClick={commitRename}
          className="text-muted-foreground hover:text-emerald-400 p-1"
          title="Save"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => {
            setDraft(session.title);
            setEditing(false);
          }}
          className="text-muted-foreground hover:text-foreground p-1"
          title="Cancel"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative flex cursor-pointer items-start gap-2 rounded-lg px-3 py-2 transition-colors',
        active ? 'bg-primary/10 ring-primary/20 ring-1' : 'hover:bg-card/60',
      )}
      onClick={onOpen}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{session.title}</p>
        {session.lastMessagePreview && (
          <p className="text-muted-foreground mt-0.5 truncate text-xs">
            {session.lastMessagePreview}
          </p>
        )}
        <p className="text-muted-foreground/70 mt-0.5 text-[10px]">{relativeTime}</p>
      </div>

      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'text-muted-foreground hover:text-foreground rounded p-2 transition-opacity md:p-1',
            menuOpen ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100',
          )}
          title="Actions"
          aria-label="Session actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
            <div className="border-border/60 bg-popover absolute right-0 z-20 mt-1 w-32 overflow-hidden rounded-md border shadow-lg">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  setDraft(session.title);
                  setEditing(true);
                }}
                className="hover:bg-accent/40 flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
              >
                <Pencil className="h-3.5 w-3.5" />
                Rename
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  if (window.confirm('Delete this conversation? This cannot be undone.')) {
                    onDelete();
                  }
                }}
                className="hover:bg-destructive/10 text-destructive flex w-full items-center gap-2 px-3 py-2 text-left text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ChatPage(): JSX.Element {
  const { getToken } = useAuth();
  const { createChat, appendMessages } = useChatsApi();
  const renameMutation = useRenameChat();
  const deleteMutation = useDeleteChat();
  const invalidateChats = useInvalidateChats();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const { data: list, isLoading: listLoading } = useChats({
    q: debouncedSearch.trim() || undefined,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: activeDetail } = useChat(activeId);

  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState(config.llm.defaultModel);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Keep the ref in sync with the active id so the async send flow can read it.
  useEffect(() => {
    sessionIdRef.current = activeId;
  }, [activeId]);

  // Hydrate the conversation pane whenever a session's detail loads.
  useEffect(() => {
    if (!activeDetail) return;
    setMessages(
      activeDetail.messages.map((m, i) => ({
        id: `${activeDetail.id}-${i}`,
        role: m.role,
        content: m.content,
        model: m.model,
      })),
    );
    if (activeDetail.model) setModel(activeDetail.model);
  }, [activeDetail]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  function startNewChat(): void {
    abortRef.current?.abort();
    setActiveId(null);
    sessionIdRef.current = null;
    setMessages([]);
    setInput('');
    setModel(config.llm.defaultModel);
    setSidebarOpen(false);
  }

  function openSession(id: string): void {
    setSidebarOpen(false);
    if (id === activeId) return;
    abortRef.current?.abort();
    setStreaming(false);
    setActiveId(id);
    sessionIdRef.current = id;
  }

  function applyPayload(
    payload: string,
    assistantId: string,
    accRef: { value: string },
    modelRef: { value: string | undefined },
  ): void {
    const parsed = parseChunkPayload(payload);
    if (!parsed) return;

    if (parsed.type === 'token' && parsed.content) {
      accRef.value += parsed.content;
      const snapshot = accRef.value;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: snapshot, pending: true } : m)),
      );
    } else if (parsed.type === 'done') {
      if (parsed.model) modelRef.value = parsed.model;
    } else if (parsed.type === 'error') {
      const msg = parsed.error ?? 'The AI response failed. Please try again.';
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: msg, pending: false } : m)),
      );
    }
  }

  async function persistTurn(
    userContent: string,
    assistantContent: string,
    usedModel: string | undefined,
  ): Promise<void> {
    try {
      const existingId = sessionIdRef.current;
      if (!existingId) {
        const created = await createChat({
          source: 'assistant',
          model: usedModel ?? model,
          messages: [
            { role: 'user', content: userContent },
            { role: 'assistant', content: assistantContent, ...(usedModel ? { model: usedModel } : {}) },
          ],
        });
        sessionIdRef.current = created.id;
        setActiveId(created.id);
      } else {
        await appendMessages(existingId, {
          model: usedModel ?? model,
          messages: [
            { role: 'user', content: userContent },
            { role: 'assistant', content: assistantContent, ...(usedModel ? { model: usedModel } : {}) },
          ],
        });
      }
      invalidateChats();
    } catch (err) {
      // Persistence must never break the live chat.
      console.warn('Failed to persist chat turn', err);
    }
  }

  async function sendMessage(prompt: string): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || streaming) return;

    const userMsg: DisplayMessage = { id: `u-${Date.now()}`, role: 'user', content: trimmed };
    const assistantMsg: DisplayMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      pending: true,
    };

    // Snapshot history BEFORE appending the new turn.
    const history = messages
      .filter((m) => !m.pending && m.content.trim())
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const token = await getToken();
      const response = await fetch(`${getMlBaseUrl()}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: trimmed, model, history }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accRef = { value: '' };
      const modelRef: { value: string | undefined } = { value: undefined };

      while (true) {
        const { value, done } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });

        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary !== -1) {
          const chunk = buffer.slice(0, boundary + 2);
          buffer = buffer.slice(boundary + 2);
          for (const payload of parseSSEChunk(chunk)) {
            applyPayload(payload, assistantMsg.id, accRef, modelRef);
          }
        }

        if (done) {
          if (buffer.trim()) {
            for (const payload of parseSSEChunk(buffer + '\n\n')) {
              applyPayload(payload, assistantMsg.id, accRef, modelRef);
            }
          }
          break;
        }
      }

      const finalContent = accRef.value || EMPTY_STREAM_FALLBACK;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, pending: false, content: finalContent, model: modelRef.value }
            : m,
        ),
      );

      if (accRef.value.trim()) {
        await persistTurn(trimmed, finalContent, modelRef.value);
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Could not reach the AI Coach. Is the AI Coach running?');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                pending: false,
                content:
                  "I couldn't reach my brain right now. Make sure the AI Coach is running (npm run dev:ml), then try again.",
              }
            : m,
        ),
      );
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  const sessions = list?.chats ?? [];

  const sidebarBody = (
    <>
      <div className="border-border/60 space-y-3 border-b p-3">
        <Button onClick={startNewChat} variant="gradient" className="w-full gap-2">
          <MessageSquarePlus className="h-4 w-4" />
          New chat
        </Button>
        <div className="relative">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="h-9 pl-9 text-sm"
          />
        </div>
      </div>

      <div className="flex-1 space-y-1 overflow-y-auto p-2">
        {listLoading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-muted-foreground px-3 py-8 text-center text-sm">
            {debouncedSearch.trim() ? 'No matching chats.' : 'No conversations yet.'}
          </p>
        ) : (
          sessions.map((session) => (
            <SessionRow
              key={session.id}
              session={session}
              active={session.id === activeId}
              onOpen={() => openSession(session.id)}
              onRename={(title) =>
                renameMutation.mutate(
                  { id: session.id, title },
                  { onError: () => toast.error('Could not rename the chat.') },
                )
              }
              onDelete={() =>
                deleteMutation.mutate(session.id, {
                  onSuccess: () => {
                    if (session.id === activeId) startNewChat();
                  },
                  onError: () => toast.error('Could not delete the chat.'),
                })
              }
            />
          ))
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-[calc(100dvh-7rem)] overflow-hidden md:h-[calc(100dvh-4rem)]">
      {/* ── Sidebar (desktop) ── */}
      <aside className="border-border/60 bg-card/20 hidden w-72 shrink-0 flex-col border-r md:flex">
        {sidebarBody}
      </aside>

      {/* ── Sidebar (mobile drawer) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="border-border/60 bg-background absolute left-0 top-0 flex h-full w-[85%] max-w-xs flex-col border-r shadow-2xl">
            <div className="border-border/60 flex items-center justify-between border-b px-3 py-2.5">
              <span className="text-sm font-semibold">Your chats</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground rounded p-1"
                aria-label="Close chats"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {sidebarBody}
          </aside>
        </div>
      )}

      {/* ── Conversation pane ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <div className="border-border/60 bg-card/40 flex shrink-0 items-center gap-3 border-b px-4 py-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-muted-foreground hover:text-foreground -ml-1 rounded p-1 md:hidden"
            aria-label="Open chats"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Avatar className="h-7 w-7 bg-gradient-to-br from-violet-500 to-fuchsia-600">
            <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
          </Avatar>
          <div className="leading-tight">
            <p className="text-sm font-semibold">AI Coach</p>
            <p className="text-muted-foreground text-[10px]">Ask anything</p>
          </div>
          <div className="ml-auto min-w-0">
            <ModelSelector value={model} onChange={setModel} disabled={streaming} />
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Avatar className="mb-4 h-14 w-14 bg-gradient-to-br from-violet-500 to-fuchsia-600">
                <AvatarFallback className="bg-transparent text-lg text-white">K</AvatarFallback>
              </Avatar>
              <h2 className="text-lg font-semibold">How can I help you today?</h2>
              <p className="text-muted-foreground mt-1 max-w-sm text-sm">
                Ask the AI Coach anything — concepts, debugging, interview prep, or a fresh idea.
                Your conversations are saved automatically.
              </p>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((m) => (
                <ChatBubble key={m.id} message={m} />
              ))}
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-border/60 bg-card/30 shrink-0 border-t">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage(input);
            }}
            className="mx-auto flex max-w-3xl items-end gap-2 px-4 py-3"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              rows={1}
              placeholder={
                streaming ? 'Responding… type your next message' : 'Message the AI Coach…'
              }
              className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring max-h-32 min-h-10 flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
            />
            <Button type="submit" variant="gradient" size="icon" disabled={streaming || !input.trim()}>
              {streaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
