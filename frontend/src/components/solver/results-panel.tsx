import { useState } from 'react';
import { CheckCircle2, ChevronDown, Loader2, Terminal, XCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { RunCodeResponse, TestCaseResult } from '@kairos/types';

interface ResultsPanelProps {
  result: RunCodeResponse | null;
  running: boolean;
}

// ── Single test case row ─────────────────────────────────────────────────────

function TestCaseRow({ tc, defaultOpen }: { tc: TestCaseResult; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <li className="border-border/60 border-b last:border-0">
      {/* Summary row */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="hover:bg-muted/20 flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors"
      >
        {tc.passed ? (
          <CheckCircle2 className="text-success h-4 w-4 shrink-0" />
        ) : (
          <XCircle className="text-destructive h-4 w-4 shrink-0" />
        )}

        <span className="text-foreground/80 text-xs font-semibold">Test case #{tc.index + 1}</span>

        <span
          className={cn(
            'rounded-full px-1.5 py-0.5 text-[10px] font-medium',
            tc.passed ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive',
          )}
        >
          {tc.passed ? 'PASS' : 'FAIL'}
        </span>

        {tc.runtimeMs !== undefined && (
          <span className="text-muted-foreground ml-auto mr-2 text-[10px]">
            {tc.runtimeMs.toFixed(0)} ms
          </span>
        )}

        <ChevronDown
          className={cn(
            'text-muted-foreground h-3.5 w-3.5 shrink-0 transition-transform',
            open && 'rotate-180',
          )}
        />
      </button>

      {/* Detail panel */}
      {open && (
        <div className="border-border/40 bg-background/40 sm:divide-border/40 grid grid-cols-1 gap-0 border-t sm:grid-cols-3 sm:divide-x">
          <div className="p-3">
            <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
              Stdin
            </span>
            <pre className="bg-muted/40 overflow-x-auto rounded p-2 font-mono text-[11px] leading-relaxed">
              {tc.input || '(empty)'}
            </pre>
          </div>
          <div className="p-3">
            <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
              Expected
            </span>
            <pre className="bg-muted/40 overflow-x-auto rounded p-2 font-mono text-[11px] leading-relaxed">
              {tc.expectedOutput || '(empty)'}
            </pre>
          </div>
          <div className="p-3">
            <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
              Your output
            </span>
            <pre
              className={cn(
                'overflow-x-auto rounded p-2 font-mono text-[11px] leading-relaxed',
                tc.passed ? 'bg-success/10' : 'bg-destructive/10',
              )}
            >
              {tc.actualOutput || '(empty)'}
            </pre>
          </div>
        </div>
      )}

      {/* Stderr (only when present) */}
      {open && tc.stderr && (
        <div className="border-border/40 bg-destructive/5 border-t px-4 pb-3 pt-2">
          <span className="text-destructive mb-1 block text-[10px] font-semibold uppercase tracking-wider">
            Stderr
          </span>
          <pre className="text-destructive/80 overflow-x-auto whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
            {tc.stderr}
          </pre>
        </div>
      )}
    </li>
  );
}

// ── Main panel ───────────────────────────────────────────────────────────────

export function ResultsPanel({ result, running }: ResultsPanelProps): JSX.Element {
  if (running) {
    return (
      <div className="border-border/60 bg-card/30 flex h-full items-center gap-2.5 border-t px-4 text-sm">
        <Loader2 className="text-primary h-4 w-4 animate-spin" />
        <span className="text-muted-foreground">Running test cases in sandbox…</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="border-border/60 bg-card/30 flex h-full items-center gap-2 border-t px-4">
        <Terminal className="text-muted-foreground h-4 w-4" />
        <span className="text-muted-foreground text-xs">
          Click <span className="text-foreground font-medium">Run</span> to execute your code
          against all test cases.
        </span>
      </div>
    );
  }

  const { testResults, passedCount, totalCount, runtimeMs, compileOutput, stderr } = result;
  const allPassed = passedCount === totalCount && totalCount > 0;

  return (
    <div className="border-border/60 bg-card/30 flex h-full flex-col overflow-hidden border-t">
      {/* Sticky summary bar */}
      <div
        className={cn(
          'border-border/60 flex shrink-0 items-center justify-between border-b px-4 py-2.5',
          allPassed ? 'bg-success/5' : 'bg-destructive/5',
        )}
      >
        <div
          className={cn(
            'flex min-w-0 items-center gap-2 text-sm font-semibold',
            allPassed ? 'text-success' : 'text-destructive',
          )}
        >
          {allPassed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          <span className="truncate">
            {allPassed
              ? `All ${totalCount} test cases passed`
              : `${passedCount} / ${totalCount} test cases passed`}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {runtimeMs !== undefined && (
            <Badge variant="outline" className="text-[10px]">
              {runtimeMs.toFixed(0)} ms total
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable body — compile errors, runtime errors, and per-case results all live here */}
      <ScrollArea className="min-h-0 flex-1">
        {/* Compile error */}
        {compileOutput && (
          <div className="border-border/60 border-b p-4">
            <h4 className="text-destructive mb-2 text-xs font-semibold uppercase tracking-wider">
              Compile Error
            </h4>
            <pre className="bg-destructive/10 text-destructive overflow-x-auto whitespace-pre-wrap rounded-md p-3 font-mono text-xs leading-relaxed">
              {compileOutput}
            </pre>
          </div>
        )}

        {/* Global runtime error (no per-case results) */}
        {stderr && !compileOutput && testResults.length === 0 && (
          <div className="border-border/60 border-b p-4">
            <h4 className="text-destructive mb-2 text-xs font-semibold uppercase tracking-wider">
              Runtime Error
            </h4>
            <pre className="bg-destructive/10 text-destructive overflow-x-auto whitespace-pre-wrap rounded-md p-3 font-mono text-xs leading-relaxed">
              {stderr}
            </pre>
          </div>
        )}

        {/* Per-test-case results */}
        {testResults.length > 0 && (
          <ul>
            {testResults.map((tc) => (
              <TestCaseRow
                key={tc.index}
                tc={tc}
                /* Auto-expand failed cases, collapse passed ones */
                defaultOpen={!tc.passed}
              />
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  );
}
