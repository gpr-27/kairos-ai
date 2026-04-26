import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import {
  Bug,
  Check,
  Copy,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Wand2,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { toast } from 'sonner';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { getMlBaseUrl } from '@/lib/dev-service-urls';
import { cn } from '@/lib/utils';
import type { CoachIntent } from '@kairos/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PlaygroundChatPaneProps {
  language:    string;
  currentCode: string;
}

interface DisplayMessage {
  id:      string;
  role:    'user' | 'assistant';
  content: string;
  intent?: CoachIntent;
  pending?: boolean;
  model?:  string;
}

// ── Quick actions ─────────────────────────────────────────────────────────────

const QUICK_ACTIONS: {
  intent: CoachIntent;
  label:  string;
  prompt: string;
  icon:   LucideIcon;
}[] = [
  {
    intent: 'playground_explain',
    label:  'Explain my code',
    prompt: 'Can you explain what my current code does, step by step?',
    icon:   MessageSquare,
  },
  {
    intent: 'playground_debug',
    label:  'Find bugs',
    prompt: 'Are there any bugs, edge cases, or logical errors in my code?',
    icon:   Bug,
  },
  {
    intent: 'playground_optimize',
    label:  'Optimize',
    prompt: 'How can I optimize my code for better time or space complexity?',
    icon:   Zap,
  },
  {
    intent: 'playground_ask',
    label:  'Add comments',
    prompt: 'Can you add clear, useful comments to my code explaining each part?',
    icon:   Wand2,
  },
];

const EMPTY_STREAM_FALLBACK =
  "I wasn't able to generate a response — the AI service may be unavailable. Please try again.";

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseSSEChunk(raw: string): string[] {
  const payloads: string[] = [];
  const events = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n\n');
  for (const evt of events) {
    const payload = evt
      .split('\n')
      .filter((l) => l.startsWith('data:'))
      .map((l) => l.slice(5).trim())
      .join('\n');
    if (!payload || payload === '[DONE]') continue;
    payloads.push(payload);
  }
  return payloads;
}

// ── Code block ────────────────────────────────────────────────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-border/40 my-3 overflow-hidden rounded-lg border">
      <div className="bg-[#1e1e2e] flex items-center justify-between px-4 py-2">
        <span className="font-mono text-[11px] font-medium text-violet-400">
          {language || 'code'}
        </span>
        <button
          onClick={handleCopy}
          className={cn(
            'flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium transition-colors',
            copied ? 'text-emerald-400' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200',
          )}
        >
          {copied ? <><Check className="h-3 w-3" />Copied!</> : <><Copy className="h-3 w-3" />Copy</>}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        customStyle={{ margin: 0, borderRadius: 0, background: '#1a1a2e', fontSize: '13px', lineHeight: '1.6', padding: '16px' }}
        showLineNumbers={code.split('\n').length > 4}
        lineNumberStyle={{ color: '#4a4a6a', minWidth: '2.5em', paddingRight: '1em' }}
        PreTag="div"
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ── Markdown ──────────────────────────────────────────────────────────────────

const MD_COMPONENTS: Components = {
  code({ className, children }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const code  = String(children).replace(/\n$/, '');
    if (match || code.includes('\n')) {
      return <CodeBlock language={match?.[1] ?? ''} code={code} />;
    }
    return (
      <code className="rounded-[4px] bg-zinc-700/60 px-[5px] py-[2px] font-mono text-[13px] text-violet-300">
        {children}
      </code>
    );
  },
  p({ children })         { return <p className="my-2 leading-7">{children}</p>; },
  h1({ children })        { return <h1 className="mt-5 mb-3 text-xl font-bold">{children}</h1>; },
  h2({ children })        { return <h2 className="mt-4 mb-2 text-lg font-semibold">{children}</h2>; },
  h3({ children })        { return <h3 className="mt-3 mb-1.5 text-base font-semibold">{children}</h3>; },
  ul({ children })        { return <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>; },
  ol({ children })        { return <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>; },
  li({ children })        { return <li className="leading-6">{children}</li>; },
  strong({ children })    { return <strong className="font-semibold text-white">{children}</strong>; },
  em({ children })        { return <em className="italic text-zinc-300">{children}</em>; },
  hr()                    { return <hr className="border-border/50 my-4" />; },
  blockquote({ children }) {
    return (
      <blockquote className="my-3 border-l-[3px] border-violet-500/50 pl-4 italic text-zinc-400">
        {children}
      </blockquote>
    );
  },
  a({ href, children }) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="text-violet-400 underline underline-offset-2 hover:text-violet-300">
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="my-3 overflow-x-auto rounded-lg border border-border/40">
        <table className="w-full text-sm">{children}</table>
      </div>
    );
  },
  thead({ children }) { return <thead className="bg-muted/30">{children}</thead>; },
  th({ children })    { return <th className="border-border/40 border-b px-4 py-2 text-left font-semibold">{children}</th>; },
  td({ children })    { return <td className="border-border/20 border-b px-4 py-2">{children}</td>; },
};

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
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <div className="text-foreground text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={MD_COMPONENTS}>
              {message.content}
            </ReactMarkdown>
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

  const [messages, setMessages] = useState<DisplayMessage[]>([
    {
      id:      'welcome',
      role:    'assistant',
      content: "Hey, I'm **Kairos**. Ask me anything about your code — I can explain it, find bugs, suggest optimizations, or just answer general coding questions.\n\nPaste or write code in the editor and fire away!",
    },
  ]);
  const [input,     setInput]     = useState('');
  const [streaming, setStreaming] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef  = useRef<AbortController | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  function applyPayload(
    payload:     string,
    assistantId: string,
    accRef:      { value: string },
    modelRef:    { value: string | undefined },
  ) {
    let parsed: { type?: string; content?: string; error?: string; model?: string };
    try { parsed = JSON.parse(payload) as typeof parsed; } catch { return; }

    if (parsed.type === 'token' && parsed.content) {
      accRef.value += parsed.content;
      const snap = accRef.value;
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: snap, pending: true } : m));
    } else if (parsed.type === 'done') {
      if (parsed.model) modelRef.value = parsed.model;
    } else if (parsed.type === 'error') {
      const msg = parsed.error ?? 'AI response failed.';
      setMessages((prev) => prev.map((m) => m.id === assistantId ? { ...m, content: msg, pending: false } : m));
    }
  }

  async function sendMessage(prompt: string, intent?: CoachIntent) {
    const trimmed = prompt.trim();
    if (!trimmed || streaming) return;

    const userMsg: DisplayMessage      = { id: `u-${Date.now()}`, role: 'user',      content: trimmed, intent };
    const assistantMsg: DisplayMessage = { id: `a-${Date.now()}`, role: 'assistant', content: '',      pending: true };

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
      const token    = await getToken();
      const response = await fetch(`${getMlBaseUrl()}/chat/stream`, {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept:         'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: trimmed,
          intent:  intent ?? 'playground_ask',
          context: { currentCode, language },
          history,
        }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error(`Chat failed: ${response.status}`);

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      const accRef:   { value: string }           = { value: '' };
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

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, pending: false, content: accRef.value || EMPTY_STREAM_FALLBACK, model: modelRef.value }
            : m,
        ),
      );
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return;
      toast.error('Could not reach the AI. Is the ML service running?');
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsg.id
            ? { ...m, pending: false, content: "I couldn't reach my brain right now. Make sure the ML service is running on port 8000." }
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
        <Avatar className="h-7 w-7 bg-gradient-to-br from-violet-500 to-fuchsia-600">
          <AvatarFallback className="bg-transparent text-xs text-white">K</AvatarFallback>
        </Avatar>
        <div className="leading-tight">
          <p className="text-sm font-semibold">Kairos AI</p>
          <p className="text-muted-foreground text-[10px]">Playground assistant · ask anything</p>
        </div>
      </div>

      {/* Message thread */}
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5">
        <div className="space-y-6">
          {messages.map((m) => <ChatBubble key={m.id} message={m} />)}
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
          onSubmit={(e) => { e.preventDefault(); void sendMessage(input); }}
          className="flex items-end gap-2 px-4 py-3"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(input); }
            }}
            rows={1}
            placeholder={streaming ? 'Responding… type your next message' : 'Ask about your code, any concept, or paste a snippet…'}
            className="border-input bg-background placeholder:text-muted-foreground focus-visible:ring-ring max-h-32 min-h-10 flex-1 resize-none rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2"
          />
          <Button type="submit" variant="gradient" size="icon" disabled={streaming || !input.trim()}>
            {streaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
