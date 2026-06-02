import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Bug,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '@/components/ui/model-selector';
import { MarkdownMessage } from '@/components/chat/markdown-message';
import { config, getMlBaseUrl } from '@/config';
import { useChatsApi, useInvalidateChats } from '@/hooks/use-chats';
import { parseChunkPayload, parseSSEChunk } from '@/lib/chat-stream';
import type { CoachIntent } from '@kairos/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaygroundChatPaneProps {
  language: string;
  currentCode: string;
}

interface DisplayMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  intent?: CoachIntent;
  pending?: boolean;
  model?: string;
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS: {
  intent: CoachIntent;
  label: string;
  prompt: string;
  icon: LucideIcon;
}[] = [
  {
    intent: 'playground_explain',
    label: 'Explain my code',
    prompt: 'Can you explain what my current code does, step by step?',
    icon: MessageSquare,
  },
  {
    intent: 'playground_debug',
    label: 'Find bugs',
    prompt: 'Are there any bugs, edge cases, or logical errors in my code?',
    icon: Bug,
  },
  {
    intent: 'playground_optimize',
    label: 'Optimize',
    prompt: 'How can I optimize my code for better time or space complexity?',
    icon: Zap,
  },
  {
    intent: 'playground_ask',
    label: 'Add comments',
    prompt: 'Can you add clear, useful comments to my code explaining each part?',
    icon: Wand2,
  },
];

const EMPTY_STREAM_FALLBACK =
  "I wasn't able to generate a response — the AI Coach may be unavailable. Please try again.";

// ── Chat bubble ───────────────────────────────────────────────────────────────

function ChatBubble({ message }: { message: DisplayMessage }) {
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

// ── Main component ────────────────────────────────────────────────────────────

export function PlaygroundChatPane({ language, currentCode }: PlaygroundChatPaneProps) {
  const { getToken } = useAuth();
  const { createChat, appendMessages } = useChatsApi();
  const invalidateChats = useInvalidateChats();
  const sessionIdRef = useRef<string | null>(null);

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Hey, I'm **Kairos**. Ask me anything about your code — I can explain it, find bugs, suggest optimizations, or just answer general coding questions.\n\nPaste or write code in the editor and fire away!",
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

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

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
          source: 'playground',
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
      console.warn('Failed to persist playground chat turn', err);
    }
  }

  function applyPayload(
    payload: string,
    assistantId: string,
    accRef: { value: string },
    modelRef: { value: string | undefined },
  ) {
    const parsed = parseChunkPayload(payload);
    if (!parsed) return;

    if (parsed.type === 'token' && parsed.content) {
      accRef.value += parsed.content;
      const snap = accRef.value;
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: snap, pending: true } : m)),
      );
    } else if (parsed.type === 'done') {
      if (parsed.model) modelRef.value = parsed.model;
    } else if (parsed.type === 'error') {
      const msg = parsed.error ?? 'AI response failed.';
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: msg, pending: false } : m)),
      );
    }
  }

  async function sendMessage(prompt: string, intent?: CoachIntent) {
    const trimmed = prompt.trim();
    if (!trimmed || streaming) return;

    const userMsg: DisplayMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: trimmed,
      intent,
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

    // Snapshot the last 6 completed messages (3 turns) to stay within TPM limits
    const HISTORY_LIMIT = 6;
    const history = messages
      .filter((m) => !m.pending && m.id !== 'welcome' && m.content.trim())
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.role, content: m.content }));

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
        body: JSON.stringify({
          message: trimmed,
          intent: intent ?? 'playground_ask',
          model,
          context: { currentCode, language },
          history,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error(`Chat failed: ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      const accRef: { value: string } = { value: '' };
      const modelRef: { value: string | undefined } = { value: undefined };

      while (true) {
        const { value, done } = await reader.read();
        if (value) buffer += decoder.decode(value, { stream: !done });

        const boundary = buffer.lastIndexOf('\n\n');
        if (boundary !== -1) {
          for (const p of parseSSEChunk(buffer.slice(0, boundary + 2))) {
            applyPayload(p, assistantMsg.id, accRef, modelRef);
          }
          buffer = buffer.slice(boundary + 2);
        }

        if (done) {
          if (buffer.trim()) {
            for (const p of parseSSEChunk(buffer + '\n\n')) {
              applyPayload(p, assistantMsg.id, accRef, modelRef);
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
      <div className="border-border/60 bg-card/40 flex shrink-0 items-center gap-3 border-b px-4 py-3">
        <Avatar className="h-7 w-7 shrink-0 bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
        </Avatar>
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold">Kairos AI</p>
          <p className="text-muted-foreground truncate text-[10px]">
            Playground assistant · ask anything
          </p>
        </div>
        <div className="ml-auto shrink-0">
          <ModelSelector value={model} onChange={setModel} disabled={streaming} />
        </div>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
        </div>
      </div>

      {/* Input area */}
      <div className="border-border/60 bg-card/30 shrink-0 border-t">
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
              streaming
                ? 'Responding… type your next message'
                : 'Ask about your code, any concept, or paste a snippet…'
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
