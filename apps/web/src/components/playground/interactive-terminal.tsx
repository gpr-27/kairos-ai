/**
 * Interactive terminal for the playground.
 *
 * Opens a WebSocket to the API, streams stdout/stderr in real-time,
 * and lets the user type stdin directly — exactly like a real terminal.
 */

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { ClipboardCopy, Square, Terminal } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { getApiBaseUrl } from '@/lib/dev-service-urls';

// ── Protocol types ────────────────────────────────────────────────────────────

type ServerMsg =
  | { type: 'ready' }
  | { type: 'stdout';  data: string }
  | { type: 'stderr';  data: string }
  | { type: 'exit';    code: number; runtimeMs: number }
  | { type: 'error';   message: string };

// ── Output line model ─────────────────────────────────────────────────────────

interface OutputLine {
  id:      number;
  text:    string;
  kind:    'stdout' | 'stderr' | 'info' | 'input';
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function wsUrl(): string {
  // Convert http(s)://… → ws(s)://…/ws/playground
  const base = getApiBaseUrl().replace(/^http/, 'ws');
  return `${base}/ws/playground`;
}

// ── Public handle (for parent to call run / stop) ─────────────────────────────

export interface TerminalHandle {
  run:   (language: string, code: string) => void;
  stop:  () => void;
  clear: () => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface InteractiveTerminalProps {
  onRunningChange?: (running: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const InteractiveTerminal = forwardRef<TerminalHandle, InteractiveTerminalProps>(
  function InteractiveTerminal({ onRunningChange }, ref) {
    const [lines,    setLines]    = useState<OutputLine[]>([]);
    const [inputVal, setInputVal] = useState('');
    const [running,  setRunning]  = useState(false);
    const [waiting,  setWaiting]  = useState(false); // process is waiting for input

    const wsRef        = useRef<WebSocket | null>(null);
    const lineId       = useRef(0);
    const scrollRef    = useRef<HTMLDivElement>(null);
    const inputRef     = useRef<HTMLInputElement>(null);
    const pendingBuf   = useRef(''); // incomplete stdout line buffer

    function nextId() { return ++lineId.current; }

    // Auto-scroll on new output
    useEffect(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [lines]);

    // Focus input whenever process is running
    useEffect(() => {
      if (running) inputRef.current?.focus();
    }, [running]);

    function setIsRunning(v: boolean) {
      setRunning(v);
      onRunningChange?.(v);
    }

    // ── Flush pending buffer as a line ──────────────────────────────────────
    function flushBuf(kind: 'stdout' | 'stderr') {
      const text = pendingBuf.current;
      pendingBuf.current = '';
      if (text) {
        setLines((prev) => [...prev, { id: nextId(), text, kind }]);
      }
    }

    // ── Append raw chunk (may contain \n) ───────────────────────────────────
    function appendChunk(chunk: string, kind: 'stdout' | 'stderr') {
      // Split on newlines; each complete line gets its own row
      const parts = (pendingBuf.current + chunk).split('\n');
      pendingBuf.current = parts.pop() ?? ''; // last part may be incomplete

      setLines((prev) => [
        ...prev,
        ...parts.map((text) => ({ id: nextId(), text, kind } as OutputLine)),
      ]);
    }

    // ── Stop running session ─────────────────────────────────────────────────
    function stop() {
      if (wsRef.current) {
        wsRef.current.send(JSON.stringify({ type: 'kill' }));
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsRunning(false);
      setWaiting(false);
    }

    // ── Start a new session ──────────────────────────────────────────────────
    function run(language: string, code: string) {
      // Clean up any existing session
      stop();
      pendingBuf.current = '';
      setLines([]);
      setInputVal('');
      setWaiting(false);
      setIsRunning(true);

      const ws = new WebSocket(wsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({ type: 'start', language, code }));
      };

      ws.onmessage = (evt) => {
        const msg = JSON.parse(evt.data as string) as ServerMsg;

        switch (msg.type) {
          case 'ready':
            setLines([{ id: nextId(), text: '▶ Running…', kind: 'info' }]);
            setWaiting(true);
            break;

          case 'stdout':
            appendChunk(msg.data, 'stdout');
            setWaiting(true); // process still alive — might ask for more input
            break;

          case 'stderr':
            flushBuf('stdout');
            appendChunk(msg.data, 'stderr');
            break;

          case 'exit':
            flushBuf('stdout');
            flushBuf('stderr');
            setLines((prev) => [
              ...prev,
              {
                id:   nextId(),
                text: `\n─── Exited with code ${msg.code} · ${msg.runtimeMs} ms ───`,
                kind: 'info',
              },
            ]);
            setIsRunning(false);
            setWaiting(false);
            wsRef.current = null;
            break;

          case 'error':
            flushBuf('stdout');
            setLines((prev) => [
              ...prev,
              { id: nextId(), text: `Error: ${msg.message}`, kind: 'stderr' },
            ]);
            setIsRunning(false);
            setWaiting(false);
            wsRef.current = null;
            break;
        }
      };

      ws.onerror = () => {
        setLines((prev) => [
          ...prev,
          { id: nextId(), text: 'WebSocket error — is the API running?', kind: 'stderr' },
        ]);
        setIsRunning(false);
        setWaiting(false);
      };

      ws.onclose = () => {
        wsRef.current = null;
      };
    }

    // ── Clear output ─────────────────────────────────────────────────────────
    function clear() {
      stop();
      pendingBuf.current = '';
      setLines([]);
      setInputVal('');
    }

    // ── Expose run / stop / clear to parent ──────────────────────────────────
    useImperativeHandle(ref, () => ({ run, stop, clear }));

    // ── Cleanup on unmount ───────────────────────────────────────────────────
    useEffect(() => () => { wsRef.current?.close(); }, []);

    // ── Send a line of stdin ─────────────────────────────────────────────────
    function sendStdin(e: React.FormEvent) {
      e.preventDefault();
      const line = inputVal;
      setInputVal('');

      // Echo the typed input into the terminal
      setLines((prev) => [...prev, { id: nextId(), text: line, kind: 'input' }]);

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'stdin', data: line + '\n' }));
      }
    }

    function copyOutput() {
      const text = lines.map((l) => l.text).join('\n');
      navigator.clipboard.writeText(text).then(() => toast.success('Copied to clipboard'));
    }

    // ── Render ───────────────────────────────────────────────────────────────

    return (
      <div className="flex h-full flex-col overflow-hidden bg-[#0d0d10]">

        {/* ── Header ── */}
        <div className="border-border/60 bg-card/30 flex shrink-0 items-center justify-between border-b px-4 py-2">
          <div className="flex items-center gap-2">
            <Terminal className="text-muted-foreground h-4 w-4" />
            <span className="text-sm font-medium">Terminal</span>
            {running && (
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                <span className="text-muted-foreground text-[10px]">running</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {lines.length > 0 && (
              <button
                onClick={copyOutput}
                className="text-muted-foreground hover:text-foreground rounded p-1.5 transition-colors"
                title="Copy output"
              >
                <ClipboardCopy className="h-3.5 w-3.5" />
              </button>
            )}
            {running && (
              <button
                onClick={stop}
                className="hover:bg-destructive/20 text-destructive flex items-center gap-1.5 rounded px-2 py-1 text-xs transition-colors"
                title="Stop execution"
              >
                <Square className="h-3 w-3 fill-current" />
                Stop
              </button>
            )}
          </div>
        </div>

        {/* ── Output area ── */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto p-4 font-mono text-sm"
          onClick={() => running && inputRef.current?.focus()}
        >
          {lines.length === 0 && !running ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <Terminal className="text-muted-foreground/30 h-10 w-10" />
              <p className="text-muted-foreground text-sm">
                Click <span className="text-foreground font-semibold">Run</span> to start
              </p>
              <p className="text-muted-foreground/60 text-xs">
                The terminal is interactive — type input when your program asks for it
              </p>
            </div>
          ) : (
            <div className="space-y-[1px]">
              {lines.map((line) => (
                <div
                  key={line.id}
                  className={cn(
                    'leading-relaxed whitespace-pre-wrap break-all',
                    line.kind === 'stdout' && 'text-zinc-100',
                    line.kind === 'stderr' && 'text-red-400',
                    line.kind === 'info'   && 'text-zinc-500 italic',
                    line.kind === 'input'  && 'text-emerald-400',
                  )}
                >
                  {line.kind === 'input' && (
                    <span className="text-zinc-500 mr-1 select-none">›</span>
                  )}
                  {line.text}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Stdin input row (always visible while running) ── */}
        {running && (
          <form
            onSubmit={sendStdin}
            className="border-border/60 bg-[#111115] flex shrink-0 items-center gap-2 border-t px-4 py-2"
          >
            <span className="text-emerald-400 shrink-0 font-mono text-sm select-none">›</span>
            <input
              ref={inputRef}
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={!waiting}
              placeholder={waiting ? 'Type input and press Enter…' : 'Waiting for process…'}
              className="min-w-0 flex-1 bg-transparent font-mono text-sm text-zinc-100 placeholder:text-zinc-600 outline-none disabled:opacity-40"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <kbd className="text-zinc-600 hidden text-[10px] sm:inline">Enter ↵</kbd>
          </form>
        )}
      </div>
    );
  },
);
