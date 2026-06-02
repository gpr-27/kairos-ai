import { useEffect, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { Loader2, Play, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LANGUAGE_LABELS,
  MONACO_LANGUAGE_MAP,
  SUPPORTED_LANGUAGES,
  type Language,
} from '@kairos/types';
import type { SampleProblem } from '@/data/sample-problems';
import { useEditorStore } from '@/stores/editor-store';

interface CodeEditorPaneProps {
  problem: SampleProblem;
  language: Language;
  code: string;
  onLanguageChange: (next: Language) => void;
  onCodeChange: (next: string) => void;
  onReset: () => void;
  onRun: () => void;
  running: boolean;
}

/** Languages the problem has starter code for, in SUPPORTED_LANGUAGES order. */
function availableLanguages(problem: SampleProblem): Language[] {
  const supported = new Set(Object.keys(problem.starterCode));
  return SUPPORTED_LANGUAGES.filter((l) => supported.has(l));
}

export function CodeEditorPane({
  problem,
  language,
  code,
  onLanguageChange,
  onCodeChange,
  onReset,
  onRun,
  running,
}: CodeEditorPaneProps): JSX.Element {
  const [editorReady, setEditorReady] = useState(false);
  const langs = availableLanguages(problem);
  const fontSize = useEditorStore((s) => s.fontSize);
  const tabSize = useEditorStore((s) => s.tabSize);
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  // Container ref for the explicit ResizeObserver that keeps Monaco in sync
  const containerRef = useRef<HTMLDivElement | null>(null);

  // If the persisted language isn't supported for this problem, auto-switch to the first available.
  const effectiveLang = langs.includes(language) ? language : (langs[0] ?? language);

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
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

  // If persisted language isn't available for this problem, auto-switch on mount
  useEffect(() => {
    if (effectiveLang !== language) {
      onLanguageChange(effectiveLang);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveLang]);

  // Keep Monaco in sync when user changes editor settings
  useEffect(() => {
    editorRef.current?.updateOptions({ fontSize, tabSize });
  }, [fontSize, tabSize]);

  // Explicit ResizeObserver so Monaco relayouts instantly when the panel is
  // resized or the results panel expands/collapses — more reliable than
  // Monaco's built-in automaticLayout polling in panel-based layouts.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => {
      editorRef.current?.layout();
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0d0d10]">
      <div className="border-border/60 bg-card/30 flex items-center justify-between gap-2 border-b px-3 py-2 sm:px-4">
        <Select value={effectiveLang} onValueChange={(v) => onLanguageChange(v as Language)}>
          <SelectTrigger className="border-border/40 bg-background/40 w-32 min-w-0 sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {langs.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {LANGUAGE_LABELS[lang]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={running}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
          {problem.track !== 'system_design' && (
            <Button variant="gradient" size="sm" onClick={onRun} disabled={running || !code.trim()}>
              {running ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Running…
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5" />
                  Run
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      <div ref={containerRef} className="relative min-h-0 flex-1 overflow-hidden">
        {!editorReady && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0d0d10]">
            <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
          </div>
        )}
        <Editor
          height="100%"
          language={MONACO_LANGUAGE_MAP[effectiveLang]}
          value={code}
          onChange={(v) => onCodeChange(v ?? '')}
          onMount={handleMount}
          options={{
            wordWrap: 'on',
            renderWhitespace: 'selection',
          }}
          theme="vs-dark"
        />
      </div>
    </div>
  );
}
