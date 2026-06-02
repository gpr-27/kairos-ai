import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Lightbulb, Loader2, Send, Sparkles, Wand2, type LucideIcon } from 'lucide-react';

import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ui/model-selector';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { config, getMlBaseUrl } from '@/config';
import { useChatsApi, useInvalidateChats } from '@/hooks/use-chats';
import { parseChunkPayload, parseSSEChunk } from '@/lib/chat-stream';
import type { CoachIntent, Language } from '@kairos/types';

// ── Types ───────────────────────────────────────────────────────────────────

interface ChatPaneProps {
  problemSlug: string;
  language: Language;
  currentCode: string;
  lastError?: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: CoachIntent;
  pending?: boolean;
  model?: string;
}

// ── Constants ────────────────────────────────────────────────────────────────

const INTENT_ICONS: Partial<Record<CoachIntent, LucideIcon>> = {
  hint: Lightbulb,
  review_code: Wand2,
  check_complexity: Sparkles,
};

const QUICK_ACTIONS: { intent: CoachIntent; label: string; prompt: string; icon: LucideIcon }[] = [
  {
    intent: 'hint',
    label: 'Give me a hint',
    prompt: "I'm stuck. Can you give me a small nudge without spoiling the answer?",
    icon: Lightbulb,
  },
  {
    intent: 'review_code',
    label: 'Review my code',
    prompt: 'Here is my current attempt. Can you review it and point out any issues?',
    icon: Wand2,
  },
  {
    intent: 'check_complexity',
    label: 'Check complexity',
    prompt: 'What is the time and space complexity of my current solution?',
    icon: Sparkles,
  },
];

const EMPTY_STREAM_FALLBACK =
  "I wasn't able to generate a response — the AI Coach may be unavailable or rate-limited. Please try again in a moment.";

// ── Chat bubble ──────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: DisplayMessage }) {
  const isUser = message.role === 'user';
  const Icon = message.intent ? (INTENT_ICONS[message.intent] ?? null) : null;

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
      {/* Avatar */}
      <Avatar className="mt-0.5 h-7 w-7 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600">
        <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        {/* Intent badge */}
        {Icon && (
          <Badge variant="outline" className="mb-2 gap-1 px-2 py-0 text-[10px]">
            <Icon className="h-2.5 w-2.5" />
            {message.intent?.replace('_', ' ')}
          </Badge>
        )}

        {/* Typing indicator */}
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
            {/* Streaming cursor */}
            {message.pending && message.content && (
              <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-violet-400 align-middle" />
            )}
            {/* Model attribution */}
            {!message.pending && message.model && (
              <div className="mt-2 flex items-center gap-1.5">
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

// ── Main component ────────────────────────────────────────────────────────────

export function ChatPane({
  problemSlug,
  language,
  currentCode,
  lastError,
}: ChatPaneProps): JSX.Element {
  const { getToken } = useAuth();
  const { createChat, appendMessages } = useChatsApi();
  const invalidateChats = useInvalidateChats();
  const sessionIdRef = useRef<string | null>(null);
  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey, I'm **Kairos**. I'm not here to give you the answer — I'm here to help you find it.\n\nWhat's your current idea? Or pick a quick action below.",
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [model, setModel] = useState(config.llm.defaultModel);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // A new problem starts a fresh persisted conversation.
  useEffect(() => {
    sessionIdRef.current = null;
  }, [problemSlug]);

  async function persistTurn(
    userContent: string,
    assistantContent: string,
    usedModel: string | undefined,
  ): Promise<void> {
    try {
      const existingId = sessionIdRef.current;
      const turn = [
        { role: 'user' as const, content: userContent },
        {
          role: 'assistant' as const,
          content: assistantContent,
          ...(usedModel ? { model: usedModel } : {}),
        },
      ];
      if (!existingId) {
        const created = await createChat({
          source: 'solver',
          problemSlug,
          model: usedModel ?? model,
          messages: turn,
        });
        sessionIdRef.current = created.id;
      } else {
        await appendMessages(existingId, { model: usedModel ?? model, messages: turn });
      }
      invalidateChats();
    } catch (err) {
      // Persistence must never break the live chat.
      console.warn('Failed to persist solver chat turn', err);
    }
  }

  function applyPayload(
    payload: string,
    assistantId: string,
    accRef: { value: string },
    modelRef: { value: string | undefined },
    onDone: () => void,
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
      onDone();
    } else if (parsed.type === 'error') {
      const msg = parsed.error ?? 'The AI response failed. Please try again.';
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: msg, pending: false } : m)),
      );
    }
  }

  async function sendMessage(prompt: string, intent?: CoachIntent): Promise<void> {
    const trimmed = prompt.trim();
    if (!trimmed || streaming) return;

    const userMsg: DisplayMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      ...(intent ? { intent } : {}),
    };
    const assistantMsg: DisplayMessage = {
      id: `a-${Date.now()}`,
      role: 'assistant',
      content: '',
      pending: true,
    };

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput('');
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Snapshot the last 6 completed messages (3 turns) to stay within TPM limits
    const HISTORY_LIMIT = 6;
    const history = messages
      .filter((m) => !m.pending && m.id !== 'welcome' && m.content.trim())
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const token = await getToken();
      const response = await fetch(`${getMlBaseUrl()}/chat/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          problemId: problemSlug,
          message: trimmed,
          intent,
          model,
          context: { currentCode, language, ...(lastError ? { lastError } : {}) },
          history,
        }),
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
      const onDone = (): void => {};

      while (true) {
        const { value, done } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });

        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary !== -1) {
          const chunk = buffer.slice(0, boundary + 2);
          buffer = buffer.slice(boundary + 2);
          for (const payload of parseSSEChunk(chunk)) {
            applyPayload(payload, assistantMsg.id, accRef, modelRef, onDone);
          }
        }

        if (done) {
          if (buffer.trim()) {
            for (const payload of parseSSEChunk(buffer + '\n\n')) {
              applyPayload(payload, assistantMsg.id, accRef, modelRef, onDone);
            }
          }
          break;
        }
      }

      const finalContent = accRef.value || EMPTY_STREAM_FALLBACK;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? {
                ...m,
                pending: false,
                content: finalContent,
                model: modelRef.value,
              }
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

  return (
    <div className="bg-card/30 flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border/60 bg-card/40 flex items-center gap-3 border-b px-4 py-3">
        <Avatar className="h-7 w-7 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Kairos Coach</p>
          <p className="text-muted-foreground truncate text-[10px]">Socratic mode</p>
        </div>
        <div className="ml-auto shrink-0">
          <ModelSelector value={model} onChange={setModel} disabled={streaming} />
        </div>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-border/60 bg-card/30 border-t">
        {/* Quick actions */}
        <div className="flex flex-wrap gap-1.5 px-4 pt-3">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.intent}
              variant="outline"
              size="sm"
              disabled={streaming}
              onClick={() => void sendMessage(action.prompt, action.intent)}
              className="h-7 text-xs"
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>

        {/* Text input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
          className="flex items-end gap-2 px-4 py-3"
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
              streaming ? 'Responding… type your next message' : 'Ask anything about this problem…'
            }
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring max-h-32 min-h-10 flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
          />
          <Button
            type="submit"
            variant="gradient"
            size="icon"
            disabled={streaming || !input.trim()}
          >
            {streaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
