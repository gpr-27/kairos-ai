import { useEffect, useMemo, useRef, useState, type ElementType, type RefObject } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  type ImperativePanelHandle,
} from 'react-resizable-panels';
import { ArrowLeft, BookOpen, Code2, MessageSquare, Terminal } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { ChatPane } from '@/components/solver/chat-pane';
import { CodeEditorPane } from '@/components/solver/code-editor-pane';
import { ProblemPane } from '@/components/solver/problem-pane';
import { ResultsPanel } from '@/components/solver/results-panel';
import { SAMPLE_PROBLEMS } from '@/data/sample-problems';
import { useCodeStore } from '@/stores/code-store';
import { useEditorStore } from '@/stores/editor-store';
import { useProgressStore } from '@/stores/progress-store';
import { getApiBaseUrl } from '@/config';
import { useAuthHeaders } from '@/hooks/use-auth-headers';
import { cn } from '@/lib/utils';
import type { Language, RunCodeResponse } from '@kairos/types';

// ─── Drag handle between panels ─────────────────────────────────────────────

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

// ─── Collapsed-panel tab shown on the edge ──────────────────────────────────

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

// ─── Mobile detection ────────────────────────────────────────────────────────

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

type MobileTab = 'problem' | 'code' | 'results' | 'chat';

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ProblemDetailPage(): JSX.Element {
  const { slug } = useParams();
  const navigate = useNavigate();
  const getAuthHeaders = useAuthHeaders();

  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useState<MobileTab>('problem');

  const { language, setLanguage } = useEditorStore();
  const markSolved = useProgressStore((s) => s.markSolved);
  const getStoredCode = useCodeStore((s) => s.getCode);
  const saveCode = useCodeStore((s) => s.setCode);
  const clearStoredCode = useCodeStore((s) => s.clearCode);

  const problem = useMemo(() => SAMPLE_PROBLEMS.find((p) => p.slug === slug), [slug]);

  // Fall back to first available language if stored language has no starter for this problem
  const firstAvailable = Object.keys(problem?.starterCode ?? {})[0] ?? language;
  const effectiveLang = (
    problem?.starterCode[language] !== undefined ? language : firstAvailable
  ) as Language;

  // Initialise editor with saved code → starter code → empty
  const [editorCode, setEditorCode] = useState<string>(() => {
    if (!problem) return '';
    return getStoredCode(problem.slug, effectiveLang) ?? problem.starterCode[effectiveLang] ?? '';
  });

  const [result, setResult] = useState<RunCodeResponse | null>(null);
  const [running, setRunning] = useState(false);

  // Persist every keystroke to the code store
  function handleCodeChange(next: string): void {
    setEditorCode(next);
    if (problem) saveCode(problem.slug, effectiveLang, next);
  }

  // Switching language: restore that language's saved buffer or its starter code
  function handleLanguageChange(lang: Language): void {
    setLanguage(lang);
    if (problem) {
      const saved = getStoredCode(problem.slug, lang);
      setEditorCode(saved ?? problem.starterCode[lang] ?? '');
    }
  }

  // Reset: clear saved buffer and restore starter code
  function handleReset(): void {
    if (problem) {
      clearStoredCode(problem.slug, effectiveLang);
      const starter = problem.starterCode[effectiveLang] ?? '';
      setEditorCode(starter);
      saveCode(problem.slug, effectiveLang, starter);
    }
  }

  // Panel refs for imperative collapse / expand
  const problemRef = useRef<ImperativePanelHandle>(null);
  const resultsRef = useRef<ImperativePanelHandle>(null);
  const chatRef = useRef<ImperativePanelHandle>(null);

  // Collapsed state (mirrors the panel state for rendering tabs)
  const [problemCollapsed, setProblemCollapsed] = useState(false);
  const [resultsCollapsed, setResultsCollapsed] = useState(true);
  const [chatCollapsed, setChatCollapsed] = useState(false);

  if (!problem) {
    return (
      <div className="flex h-[calc(100vh-4rem)] flex-col items-center justify-center gap-3 px-4 text-center">
        <h2 className="text-2xl font-semibold">Problem not found</h2>
        <p className="text-muted-foreground">
          The problem <code className="font-mono">{slug}</code> doesn&apos;t exist (yet).
        </p>
        <Button onClick={() => navigate('/problems')} variant="outline">
          <ArrowLeft className="h-4 w-4" />
          Back to problems
        </Button>
      </div>
    );
  }

  async function handleRun(): Promise<void> {
    if (!problem) return;
    setRunning(true);
    setResult(null);
    if (isMobile) {
      if (!isSystemDesign) setMobileTab('results');
    } else if (resultsCollapsed) {
      resultsRef.current?.expand();
    }
    try {
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${getApiBaseUrl()}/api/v1/submissions/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          problemId: problem.slug,
          language: effectiveLang,
          code: editorCode,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        throw new Error(body?.error?.message ?? `Run failed: ${response.status}`);
      }

      const json = (await response.json()) as { data: RunCodeResponse };
      setResult(json.data);
      if (json.data.status === 'accepted') {
        markSolved(problem.slug, problem.difficulty as 'easy' | 'medium' | 'hard');
        toast.success('All test cases passed! Problem marked as solved.');
      } else if (json.data.status === 'compile_error') {
        toast.error('Compile error.');
      } else if (json.data.status === 'runtime_error') {
        toast.error('Runtime error.');
      } else if (json.data.status === 'wrong_answer') {
        toast.warning(`${json.data.totalCount - json.data.passedCount} tests failed.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(
        msg.includes('Run failed')
          ? 'Could not reach the backend. Is the API running?'
          : msg,
      );
    } finally {
      setRunning(false);
    }
  }

  function togglePanel(
    ref: RefObject<ImperativePanelHandle | null>,
    collapsed: boolean,
    setCollapsed: (v: boolean) => void,
  ) {
    if (collapsed) {
      ref.current?.expand();
    } else {
      ref.current?.collapse();
    }
    setCollapsed(!collapsed);
  }

  const lastError = result?.stderr ?? result?.compileOutput;
  const isSystemDesign = problem.track === 'system_design';

  // ── Mobile layout (tab-based) ────────────────────────────────────────────
  if (isMobile) {
    const mobileTabs: { key: MobileTab; label: string; icon: ElementType }[] = [
      { key: 'problem', label: 'Problem', icon: BookOpen },
      { key: 'code', label: 'Code', icon: Code2 },
      ...(!isSystemDesign
        ? [{ key: 'results' as MobileTab, label: 'Results', icon: Terminal }]
        : []),
      { key: 'chat', label: 'AI', icon: MessageSquare },
    ];

    return (
      // 7rem ≈ top navbar (4rem) + bottom mobile nav row (~3rem)
      <div className="flex h-[calc(100dvh-7rem)] flex-col">
        {/* Mini toolbar */}
        <div className="border-border/60 bg-card/20 flex shrink-0 items-center gap-2 border-b px-2 py-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/problems')}
            className="h-7 gap-1 px-2"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span className="text-xs">Back</span>
          </Button>
          <span className="text-foreground/70 min-w-0 flex-1 truncate text-xs font-medium">
            {problem.title}
          </span>
        </div>

        {/* Tab bar */}
        <div className="border-border/60 bg-card/10 flex shrink-0 border-b">
          {mobileTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMobileTab(key)}
              className={cn(
                'flex flex-1 flex-col items-center gap-0.5 border-b-2 py-2 text-[10px] font-medium transition-colors',
                mobileTab === key
                  ? 'border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Panels — keep all mounted so Monaco/chat state isn't destroyed */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <div className={cn('h-full', mobileTab !== 'problem' && 'hidden')}>
            <ProblemPane problem={problem} />
          </div>
          <div className={cn('h-full', mobileTab !== 'code' && 'hidden')}>
            <CodeEditorPane
              problem={problem}
              language={effectiveLang}
              code={editorCode}
              onLanguageChange={handleLanguageChange}
              onCodeChange={handleCodeChange}
              onReset={handleReset}
              onRun={handleRun}
              running={running}
            />
          </div>
          {!isSystemDesign && (
            <div className={cn('h-full', mobileTab !== 'results' && 'hidden')}>
              <ResultsPanel result={result} running={running} />
            </div>
          )}
          <div className={cn('h-full', mobileTab !== 'chat' && 'hidden')}>
            <ChatPane
              problemSlug={problem.slug}
              language={effectiveLang}
              currentCode={editorCode}
              lastError={lastError}
            />
          </div>
        </div>
      </div>
    );
  }

  // ── Desktop layout (resizable panels) ────────────────────────────────────
  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* ── Top toolbar ── */}
      <div className="border-border/60 bg-card/20 flex items-center justify-between border-b px-3 py-1.5">
        <Button variant="ghost" size="sm" onClick={() => navigate('/problems')}>
          <ArrowLeft className="h-3.5 w-3.5" />
          All problems
        </Button>

        <span className="text-foreground/70 hidden max-w-xs truncate text-sm font-medium sm:block">
          {problem.title}
        </span>

        {/* Panel toggle buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant={problemCollapsed ? 'ghost' : 'secondary'}
            size="sm"
            className="gap-1.5"
            onClick={() => togglePanel(problemRef, problemCollapsed, setProblemCollapsed)}
            title={problemCollapsed ? 'Show problem' : 'Hide problem'}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Problem</span>
          </Button>

          {!isSystemDesign && (
            <Button
              variant={resultsCollapsed ? 'ghost' : 'secondary'}
              size="sm"
              className="gap-1.5"
              onClick={() => togglePanel(resultsRef, resultsCollapsed, setResultsCollapsed)}
              title={resultsCollapsed ? 'Show results' : 'Hide results'}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Results</span>
            </Button>
          )}

          <Button
            variant={chatCollapsed ? 'ghost' : 'secondary'}
            size="sm"
            className="gap-1.5"
            onClick={() => togglePanel(chatRef, chatCollapsed, setChatCollapsed)}
            title={chatCollapsed ? 'Show AI chat' : 'Hide AI chat'}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">AI Chat</span>
          </Button>
        </div>
      </div>

      {/* ── Main resizable layout ── */}
      <PanelGroup
        direction="horizontal"
        className="flex-1 overflow-hidden"
        autoSaveId="kairos-solver-h"
      >
        {/* ── Left: Problem pane ── */}
        <Panel
          ref={problemRef}
          defaultSize={28}
          minSize={15}
          collapsible
          collapsedSize={0}
          onCollapse={() => setProblemCollapsed(true)}
          onExpand={() => setProblemCollapsed(false)}
          className="border-border/60 border-r"
        >
          {problemCollapsed ? null : <ProblemPane problem={problem} />}
        </Panel>

        {/* Collapsed tab for problem */}
        {problemCollapsed && (
          <div className="border-border/60 flex items-start border-r py-4 pl-0">
            <CollapsedTab
              label="Problem"
              icon={BookOpen}
              side="left"
              onClick={() => togglePanel(problemRef, true, setProblemCollapsed)}
            />
          </div>
        )}

        <ResizeHandle />

        {/* ── Centre: Code editor + results ── */}
        <Panel defaultSize={44} minSize={20}>
          <PanelGroup direction="vertical">
            <Panel defaultSize={isSystemDesign ? 100 : 70} minSize={25}>
              <CodeEditorPane
                problem={problem}
                language={effectiveLang}
                code={editorCode}
                onLanguageChange={handleLanguageChange}
                onCodeChange={handleCodeChange}
                onReset={handleReset}
                onRun={handleRun}
                running={running}
              />
            </Panel>

            {!isSystemDesign && (
              <>
                <ResizeHandle direction="vertical" />
                <Panel
                  ref={resultsRef}
                  defaultSize={30}
                  minSize={10}
                  collapsible
                  collapsedSize={0}
                  onCollapse={() => setResultsCollapsed(true)}
                  onExpand={() => setResultsCollapsed(false)}
                >
                  <ResultsPanel result={result} running={running} />
                </Panel>
              </>
            )}
          </PanelGroup>
        </Panel>

        <ResizeHandle />

        {/* ── Right: AI chat ── */}
        {chatCollapsed && (
          <div className="border-border/60 flex items-start border-l py-4 pr-0">
            <CollapsedTab
              label="AI Chat"
              icon={MessageSquare}
              side="right"
              onClick={() => togglePanel(chatRef, true, setChatCollapsed)}
            />
          </div>
        )}

        <Panel
          ref={chatRef}
          defaultSize={28}
          minSize={15}
          collapsible
          collapsedSize={0}
          onCollapse={() => setChatCollapsed(true)}
          onExpand={() => setChatCollapsed(false)}
          className="border-border/60 border-l"
        >
          {chatCollapsed ? null : (
            <ChatPane
              problemSlug={problem.slug}
              language={effectiveLang}
              currentCode={editorCode}
              lastError={lastError}
            />
          )}
        </Panel>
      </PanelGroup>
    </div>
  );
}
