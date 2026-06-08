import { useEffect, useRef, useState, type ElementType, type RefObject } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from 'react-resizable-panels';
import { Code2, Loader2, MessageSquare, Play, RotateCcw, Terminal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useEditorStore } from '@/stores/editor-store';
import { PlaygroundChatPane } from '@/components/playground/playground-chat-pane';
import {
  InteractiveTerminal,
  type TerminalHandle,
} from '@/components/playground/interactive-terminal';

// ── Shared layout helpers (mirrors problem-detail.tsx) ────────────────────────

function ResizeHandle({ direction = 'horizontal' }: { direction?: 'horizontal' | 'vertical' }) {
  return (
    <PanelResizeHandle
      className={cn(
        'group relative z-10 flex shrink-0 items-center justify-center bg-transparent transition-colors',
        direction === 'horizontal'
          ? 'hover:bg-primary/10 active:bg-primary/20 w-1.5 cursor-col-resize'
          : 'hover:bg-primary/10 active:bg-primary/20 h-1.5 cursor-row-resize',
      )}
    >
      <div
        className={cn(
          'bg-border/50 group-hover:bg-primary/40 group-active:bg-primary/70 rounded-full transition-all',
          direction === 'horizontal' ? 'h-10 w-[3px]' : 'h-[3px] w-10',
        )}
      />
    </PanelResizeHandle>
  );
}

function CollapsedTab({
  label,
  icon: Icon,
  side,
  onClick,
}: {
  label: string;
  icon: ElementType;
  side: 'left' | 'right';
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'bg-card/80 hover:bg-card border-border/60 text-muted-foreground hover:text-foreground flex flex-col items-center justify-center gap-1.5 border px-1 py-4 transition-colors',
        side === 'left' ? 'rounded-r-md border-l-0' : 'rounded-l-md border-r-0',
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span
        className="text-[10px] font-medium uppercase tracking-wider"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        {label}
      </span>
    </button>
  );
}

// ── Mobile detection (mirrors problem-detail.tsx) ────────────────────────────

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [breakpoint]);
  return isMobile;
}

// ── Supported playground languages ───────────────────────────────────────────

interface PlaygroundLanguage {
  key: string; // canonical key sent to API
  label: string;
  monacoLang: string;
  starter: string;
  defaultStdin: string; // pre-filled so Run works immediately
}

// Only languages whose runtimes ship in the production image (node:20-slim +
// python3) are offered for interactive execution. TypeScript runs via the bundled
// `tsx`. Compiled / heavier languages (C, C++, Java, Go, Rust, …) are intentionally
// omitted here so the single-container free-tier deploy never advertises a runtime it
// can't run; add their toolchains to the Dockerfile (and entries below) to re-enable.
const PLAYGROUND_LANGS: PlaygroundLanguage[] = [
  {
    key: 'python',
    label: 'Python',
    monacoLang: 'python',
    defaultStdin: 'World',
    starter: `# Python Playground
def main():
    name = input("Enter your name: ")
    print(f"Hello, {name}!")

main()
`,
  },
  {
    key: 'javascript',
    label: 'JavaScript',
    monacoLang: 'javascript',
    defaultStdin: 'World',
    starter: `// JavaScript Playground
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (name) => {
    console.log(\`Hello, \${name}!\`);
    rl.close();
});
`,
  },
  {
    key: 'typescript',
    label: 'TypeScript',
    monacoLang: 'typescript',
    defaultStdin: 'World',
    starter: `// TypeScript Playground
import * as readline from 'readline';

const rl = readline.createInterface({ input: process.stdin });
rl.on('line', (name: string) => {
    console.log(\`Hello, \${name}!\`);
    rl.close();
});
`,
  },
];

// ── Output panel ─────────────────────────────────────────────────────────────

// OutputPanel and StdinInput removed — replaced by InteractiveTerminal

// ── Mobile layout ─────────────────────────────────────────────────────────────

type MobileTab = 'editor' | 'terminal' | 'chat';

function MobileLayout({
  selectedLang,
  code,
  editorReady,
  containerRef,
  terminalRef,
  onCodeChange,
  onMount,
  onRunningChange,
}: {
  selectedLang: PlaygroundLanguage;
  code: string;
  editorReady: boolean;
  containerRef: RefObject<HTMLDivElement>;
  terminalRef: RefObject<TerminalHandle>;
  onCodeChange: (v: string) => void;
  onMount: OnMount;
  onRunningChange?: (running: boolean) => void;
}) {
  const [tab, setTab] = useState<MobileTab>('editor');

  const TABS: { key: MobileTab; label: string; icon: ElementType }[] = [
    { key: 'editor', label: 'Code', icon: Terminal },
    { key: 'terminal', label: 'Terminal', icon: Play },
    { key: 'chat', label: 'AI', icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="border-border/60 bg-card/10 flex shrink-0 border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              'flex flex-1 flex-col items-center gap-0.5 border-b-2 py-2 text-[10px] font-medium transition-colors',
              tab === key
                ? 'border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground border-transparent',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <div className={cn('flex h-full flex-col overflow-hidden', tab !== 'editor' && 'hidden')}>
          <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden bg-[#0d0d10]">
            {!editorReady && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d10]">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            )}
            <Editor
              height="100%"
              language={selectedLang.monacoLang}
              value={code}
              onChange={(v) => onCodeChange(v ?? '')}
              onMount={onMount}
              options={{ wordWrap: 'on', renderWhitespace: 'selection' }}
              theme="vs-dark"
            />
          </div>
        </div>

        {/* Always mounted so WebSocket session survives tab switches */}
        <div className={cn('h-full overflow-hidden', tab !== 'terminal' && 'hidden')}>
          <InteractiveTerminal ref={terminalRef} onRunningChange={onRunningChange} />
        </div>

        <div className={cn('h-full overflow-hidden', tab !== 'chat' && 'hidden')}>
          <PlaygroundChatPane language={selectedLang.key} currentCode={code} />
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PlaygroundPage(): JSX.Element {
  const isMobile = useIsMobile();

  const [selectedLang, setSelectedLang] = useState<PlaygroundLanguage>(PLAYGROUND_LANGS[0]!);
  const [code, setCode] = useState(PLAYGROUND_LANGS[0]!.starter);
  const [running, setRunning] = useState(false);

  // Panel collapsed state
  const [editorCollapsed, setEditorCollapsed] = useState(false);
  const [terminalCollapsed, setTerminalCollapsed] = useState(false);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  const fontSize = useEditorStore((s) => s.fontSize);
  const tabSize = useEditorStore((s) => s.tabSize);

  const monacoRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<TerminalHandle>(null);

  // Imperative panel refs for programmatic collapse/expand
  const editorPanelRef = useRef<ImperativePanelHandle>(null);
  const terminalPanelRef = useRef<ImperativePanelHandle>(null);
  const chatPanelRef = useRef<ImperativePanelHandle>(null);

  const [editorReady, setEditorReady] = useState(false);

  function togglePanel(
    ref: RefObject<ImperativePanelHandle | null>,
    collapsed: boolean,
    setCollapsed: (v: boolean) => void,
  ) {
    if (collapsed) ref.current?.expand();
    else ref.current?.collapse();
    setCollapsed(!collapsed);
  }

  function handleLangChange(key: string) {
    const lang = PLAYGROUND_LANGS.find((l) => l.key === key);
    if (!lang) return;
    setSelectedLang(lang);
    setCode(lang.starter);
  }

  function handleReset() {
    terminalRef.current?.clear();
    setCode(selectedLang.starter);
  }

  function handleRun() {
    if (!code.trim()) return;
    // Auto-expand terminal if collapsed
    if (terminalCollapsed) {
      terminalPanelRef.current?.expand();
      setTerminalCollapsed(false);
    }
    terminalRef.current?.run(selectedLang.key, code);
  }

  const handleMount: OnMount = (editor, monaco) => {
    monacoRef.current = editor;
    monaco.editor.defineTheme('kairos-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0d0d10',
        'editor.foreground': '#e5e5e5',
        'editor.lineHighlightBackground': '#1a1a1f',
        'editorLineNumber.foreground': '#3f3f46',
        'editorCursor.foreground': '#a78bfa',
        'editor.selectionBackground': '#7c3aed40',
        'editorBracketMatch.background': '#a78bfa20',
        'editorBracketMatch.border': '#a78bfa',
      },
    });
    monaco.editor.setTheme('kairos-dark');
    editor.updateOptions({
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize,
      lineHeight: 1.6,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      padding: { top: 16, bottom: 16 },
      tabSize,
      automaticLayout: true,
    });
    setEditorReady(true);
  };

  useEffect(() => {
    monacoRef.current?.updateOptions({ fontSize, tabSize });
  }, [fontSize, tabSize]);

  // ResizeObserver keeps Monaco layout in sync when panels are dragged
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      monacoRef.current?.layout();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ⌘↵ / Ctrl+↵ → run
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRun();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, selectedLang]);

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* ── Toolbar ── */}
      <div className="border-border/60 bg-card/20 flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-1.5">
        <Terminal className="text-primary h-4 w-4 shrink-0" />
        <span className="text-sm font-semibold">Playground</span>
        <span className="text-border/60 select-none px-1">|</span>

        <Select value={selectedLang.key} onValueChange={handleLangChange}>
          <SelectTrigger className="border-border/40 bg-background/40 w-28 min-w-0 shrink-0 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PLAYGROUND_LANGS.map((lang) => (
              <SelectItem key={lang.key} value={lang.key}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Panel toggle buttons (only meaningful on desktop) */}
        {!isMobile && (
          <div className="flex items-center gap-1">
            <Button
              variant={editorCollapsed ? 'ghost' : 'secondary'}
              size="sm"
              className="gap-1.5"
              onClick={() => togglePanel(editorPanelRef, editorCollapsed, setEditorCollapsed)}
              title={editorCollapsed ? 'Show editor' : 'Hide editor'}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editor</span>
            </Button>
            <Button
              variant={terminalCollapsed ? 'ghost' : 'secondary'}
              size="sm"
              className="gap-1.5"
              onClick={() => togglePanel(terminalPanelRef, terminalCollapsed, setTerminalCollapsed)}
              title={terminalCollapsed ? 'Show terminal' : 'Hide terminal'}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Terminal</span>
            </Button>
            <Button
              variant={chatCollapsed ? 'ghost' : 'secondary'}
              size="sm"
              className="gap-1.5"
              onClick={() => togglePanel(chatPanelRef, chatCollapsed, setChatCollapsed)}
              title={chatCollapsed ? 'Show AI chat' : 'Hide AI chat'}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Chat</span>
            </Button>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={running}
            className="gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </Button>
          <Button
            variant="gradient"
            size="sm"
            onClick={handleRun}
            disabled={running || !code.trim()}
            className="gap-1.5"
          >
            {running ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Running…
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run
                <kbd className="bg-primary/20 hidden rounded px-1 py-0.5 text-[9px] font-medium sm:inline">
                  ⌘↵
                </kbd>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Desktop: resizable three-panel layout ── */}
      {!isMobile && (
        <PanelGroup
          direction="horizontal"
          className="flex flex-1 overflow-hidden"
          autoSaveId="kairos-playground-h"
        >
          {/* ── Editor panel ── */}
          <Panel
            ref={editorPanelRef}
            defaultSize={38}
            minSize={15}
            collapsible
            collapsedSize={0}
            onCollapse={() => setEditorCollapsed(true)}
            onExpand={() => setEditorCollapsed(false)}
            className="border-border/60 border-r"
          >
            {!editorCollapsed && (
              <div ref={containerRef} className="relative h-full overflow-hidden bg-[#0d0d10]">
                {!editorReady && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d10]">
                    <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
                  </div>
                )}
                <Editor
                  height="100%"
                  language={selectedLang.monacoLang}
                  value={code}
                  onChange={(v) => setCode(v ?? '')}
                  onMount={handleMount}
                  options={{ wordWrap: 'on', renderWhitespace: 'selection' }}
                  theme="vs-dark"
                />
              </div>
            )}
          </Panel>

          {/* Collapsed editor tab */}
          {editorCollapsed && (
            <div className="border-border/60 flex items-start border-r py-4 pl-0">
              <CollapsedTab
                label="Editor"
                icon={Code2}
                side="left"
                onClick={() => togglePanel(editorPanelRef, true, setEditorCollapsed)}
              />
            </div>
          )}

          <ResizeHandle />

          {/* ── Terminal panel ── */}
          <Panel
            ref={terminalPanelRef}
            defaultSize={34}
            minSize={15}
            collapsible
            collapsedSize={0}
            onCollapse={() => setTerminalCollapsed(true)}
            onExpand={() => setTerminalCollapsed(false)}
            className="border-border/60 border-r"
          >
            {/* Always mounted so WebSocket session survives panel resize */}
            <div className={cn('h-full', terminalCollapsed && 'hidden')}>
              <InteractiveTerminal ref={terminalRef} onRunningChange={setRunning} />
            </div>
          </Panel>

          {/* Collapsed terminal tab */}
          {terminalCollapsed && (
            <div className="border-border/60 flex items-start border-r py-4 pl-0">
              <CollapsedTab
                label="Terminal"
                icon={Terminal}
                side="left"
                onClick={() => togglePanel(terminalPanelRef, true, setTerminalCollapsed)}
              />
            </div>
          )}

          <ResizeHandle />

          {/* Collapsed chat tab */}
          {chatCollapsed && (
            <div className="border-border/60 flex items-start border-l py-4 pr-0">
              <CollapsedTab
                label="AI Chat"
                icon={MessageSquare}
                side="right"
                onClick={() => togglePanel(chatPanelRef, true, setChatCollapsed)}
              />
            </div>
          )}

          {/* ── Chat panel ── */}
          <Panel
            ref={chatPanelRef}
            defaultSize={28}
            minSize={15}
            collapsible
            collapsedSize={0}
            onCollapse={() => setChatCollapsed(true)}
            onExpand={() => setChatCollapsed(false)}
            className="border-border/60 border-l"
          >
            {!chatCollapsed && (
              <PlaygroundChatPane language={selectedLang.key} currentCode={code} />
            )}
          </Panel>
        </PanelGroup>
      )}

      {/* ── Mobile: tab-based layout (exclusively rendered, never alongside desktop) ── */}
      {isMobile && (
        <MobileLayout
          selectedLang={selectedLang}
          code={code}
          editorReady={editorReady}
          containerRef={containerRef as RefObject<HTMLDivElement>}
          terminalRef={terminalRef}
          onCodeChange={setCode}
          onMount={handleMount}
          onRunningChange={setRunning}
        />
      )}
    </div>
  );
}
