import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronRight,
  Info,
  Lightbulb,
  MessageSquare,
  Terminal,
  TestTube2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiscussionPane } from '@/components/solver/discussion-pane';
import type { SampleProblem } from '@/data/sample-problems';

const DIFFICULTY_VARIANTS = {
  easy: 'success',
  medium: 'warning',
  hard: 'destructive',
} as const;

const TRACK_LABELS: Record<SampleProblem['track'], string> = {
  dsa: 'DSA',
  cp: 'Competitive Programming',
  system_design: 'System Design',
};

interface ProblemPaneProps {
  problem: SampleProblem;
}

// ── How-it-works banner ───────────────────────────────────────────────────────

function JudgeExplainer() {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-border/60 rounded-lg border bg-blue-500/5">
      <button
        className="flex w-full items-center gap-2.5 px-4 py-3 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <Info className="h-4 w-4 shrink-0 text-blue-400" />
        <span className="text-sm font-medium">How does the judge work?</span>
        {open ? (
          <ChevronDown className="text-muted-foreground ml-auto h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="text-muted-foreground ml-auto h-3.5 w-3.5" />
        )}
      </button>
      {open && (
        <div className="border-border/60 border-t px-4 pb-4 pt-3">
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              This judge works{' '}
              <span className="text-foreground font-semibold">exactly like Codeforces</span> or any
              competitive-programming platform:
            </p>
            <ol className="text-muted-foreground space-y-2 pl-4">
              <li className="list-decimal">
                <span className="text-foreground font-medium">Write a complete program</span> — you
                must include the{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">main()</code>{' '}
                function (or equivalent).
              </li>
              <li className="list-decimal">
                <span className="text-foreground font-medium">Read all input from stdin</span> — use{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">cin</code> /{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">input()</code> /{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">Scanner</code>.
                Read in the <span className="text-foreground font-semibold">exact order</span> shown
                in the I/O Format below.
              </li>
              <li className="list-decimal">
                <span className="text-foreground font-medium">Print your answer to stdout</span> —
                use <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">cout</code> /{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">print()</code> /{' '}
                <code className="bg-muted rounded px-1 py-0.5 font-mono text-xs">System.out</code>.
              </li>
              <li className="list-decimal">
                Click <span className="text-foreground font-medium">Run</span> — the judge feeds
                each test case's stdin into your program and compares your output to the expected
                output.
              </li>
            </ol>
            <div className="rounded border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-xs font-medium text-amber-300">
                ⚠️ Common mistake: reading variables in the wrong order.
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                The I/O Format tells you the reading order line-by-line. If{' '}
                <code className="bg-muted rounded px-0.5 font-mono">target</code> is on line 3, read
                the full array first, then read{' '}
                <code className="bg-muted rounded px-0.5 font-mono">target</code> — not before.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Visible test case row ─────────────────────────────────────────────────────

function TestCaseRow({
  tc,
  index,
}: {
  tc: { input: string; expectedOutput: string };
  index: number;
}) {
  const lines = tc.input.split('\n');

  return (
    <Card className="border-border/60 bg-background/50 overflow-hidden">
      <div className="border-border/60 bg-muted/20 flex items-center gap-2 border-b px-4 py-2">
        <Terminal className="text-muted-foreground h-3.5 w-3.5" />
        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
          Test case {index + 1}
        </span>
      </div>
      <div className="divide-border/60 grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
        {/* Stdin column */}
        <div className="p-3">
          <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
            Stdin fed to your program
          </span>
          <pre className="bg-muted/40 overflow-x-auto rounded p-2 font-mono text-xs leading-relaxed">
            {lines.map((line, i) => (
              <span key={i} className="flex">
                <span className="text-muted-foreground/40 mr-2.5 w-3 shrink-0 select-none text-right">
                  {i + 1}
                </span>
                <span>{line || ' '}</span>
              </span>
            ))}
          </pre>
        </div>
        {/* Expected stdout */}
        <div className="p-3">
          <span className="text-muted-foreground mb-1.5 block text-[10px] font-semibold uppercase tracking-wider">
            Expected stdout
          </span>
          <pre className="bg-muted/40 overflow-x-auto rounded p-2 font-mono text-xs leading-relaxed">
            {tc.expectedOutput || '(empty)'}
          </pre>
        </div>
      </div>
    </Card>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function ProblemPane({ problem }: ProblemPaneProps): JSX.Element {
  const isCode = problem.track !== 'system_design';

  return (
    <div className="bg-card/30 flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="border-border/60 border-b px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={DIFFICULTY_VARIANTS[problem.difficulty]} className="capitalize">
            {problem.difficulty}
          </Badge>
          <Badge variant="outline">{TRACK_LABELS[problem.track]}</Badge>
          {problem.topics.map((topic) => (
            <Badge key={topic} variant="secondary" className="text-[10px]">
              {topic}
            </Badge>
          ))}
        </div>
        <h1 className="mt-2.5 text-xl font-bold tracking-tight">{problem.title}</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="flex min-h-0 flex-1 flex-col">
        <div className="border-border/60 overflow-x-auto border-b px-4 pt-2">
          <TabsList className="h-8 w-max gap-1 bg-transparent p-0">
            <TabsTrigger
              value="description"
              className="data-[state=active]:bg-muted rounded px-3 py-1 text-xs font-medium"
            >
              Description
            </TabsTrigger>
            {isCode && problem.visibleTestCases && problem.visibleTestCases.length > 0 && (
              <TabsTrigger
                value="testcases"
                className="data-[state=active]:bg-muted flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium"
              >
                <TestTube2 className="h-3 w-3" />
                Test Cases
              </TabsTrigger>
            )}
            {problem.hints.length > 0 && (
              <TabsTrigger
                value="hints"
                className="data-[state=active]:bg-muted flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium"
              >
                <Lightbulb className="h-3 w-3" />
                Hints
              </TabsTrigger>
            )}
            <TabsTrigger
              value="discussion"
              className="data-[state=active]:bg-muted flex items-center gap-1.5 rounded px-3 py-1 text-xs font-medium"
            >
              <MessageSquare className="h-3 w-3" />
              Discuss
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── Description ─────────────────────────────────────────────────── */}
        <TabsContent value="description" className="mt-0 min-h-0 flex-1">
          <ScrollArea className="h-full">
            <div className="space-y-5 px-5 py-4">
              <article className="prose dark:prose-invert prose-sm prose-headings:font-semibold prose-p:text-muted-foreground prose-strong:text-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.description}</ReactMarkdown>
              </article>

              {problem.examples.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
                      Examples
                    </h2>
                    <div className="space-y-3">
                      {problem.examples.map((example, i) => (
                        <Card key={i} className="border-border/60 bg-background/50">
                          <CardContent className="space-y-2 p-4 text-sm">
                            <div>
                              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                                Input
                              </span>
                              <pre className="bg-muted/40 mt-1 overflow-x-auto rounded p-2 font-mono text-xs">
                                {example.input}
                              </pre>
                            </div>
                            <div>
                              <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                                Output
                              </span>
                              <pre className="bg-muted/40 mt-1 overflow-x-auto rounded p-2 font-mono text-xs">
                                {example.output}
                              </pre>
                            </div>
                            {example.explanation && (
                              <p className="text-muted-foreground text-xs">
                                <span className="font-semibold">Explanation: </span>
                                {example.explanation}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </section>
                </>
              )}

              {problem.constraints.length > 0 && (
                <>
                  <Separator />
                  <section>
                    <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
                      Constraints
                    </h2>
                    <ul className="text-muted-foreground list-disc space-y-1 pl-5 text-xs">
                      {problem.constraints.map((c, i) => (
                        <li key={i} className="font-mono">
                          {c}
                        </li>
                      ))}
                    </ul>
                  </section>
                </>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* ── Test Cases ──────────────────────────────────────────────────── */}
        {isCode && problem.visibleTestCases && problem.visibleTestCases.length > 0 && (
          <TabsContent value="testcases" className="mt-0 min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-5 px-5 py-4">
                {/* How the judge works */}
                <JudgeExplainer />

                {/* I/O Format */}
                {problem.ioFormat && (
                  <section>
                    <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
                      I/O Format — read input in this order
                    </h2>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                          Stdin
                        </span>
                        <pre className="bg-muted/50 border-border/60 mt-1 whitespace-pre rounded-md border p-3 font-mono text-xs leading-relaxed">
                          {problem.ioFormat.input}
                        </pre>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] font-semibold uppercase tracking-wider">
                          Stdout
                        </span>
                        <pre className="bg-muted/50 border-border/60 mt-1 whitespace-pre rounded-md border p-3 font-mono text-xs leading-relaxed">
                          {problem.ioFormat.output}
                        </pre>
                      </div>
                    </div>
                  </section>
                )}

                <Separator />

                {/* Visible test cases */}
                <section>
                  <h2 className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
                    Sample Test Cases
                  </h2>
                  <div className="space-y-3">
                    {problem.visibleTestCases.map((tc, i) => (
                      <TestCaseRow key={i} tc={tc} index={i} />
                    ))}
                  </div>
                  <p className="text-muted-foreground mt-3 text-xs">
                    More hidden test cases run when you click{' '}
                    <span className="text-foreground font-medium">Run</span>. Your code must pass{' '}
                    <span className="text-foreground font-medium">all</span> of them to get{' '}
                    <span className="font-medium text-emerald-400">Accepted</span>.
                  </p>
                </section>
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* ── Hints ───────────────────────────────────────────────────────── */}
        {problem.hints.length > 0 && (
          <TabsContent value="hints" className="mt-0 min-h-0 flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-3 px-5 py-4">
                <p className="text-muted-foreground text-xs">
                  Try solving on your own first. Hints are ordered from vague to specific.
                </p>
                {problem.hints.map((hint, i) => (
                  <details key={i} className="group">
                    <summary className="border-border/60 hover:bg-muted/40 flex cursor-pointer select-none list-none items-center gap-2 rounded-md border px-4 py-3 text-sm font-medium">
                      <span className="bg-primary/10 text-primary flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold">
                        {i + 1}
                      </span>
                      Hint {i + 1}
                      <span className="text-muted-foreground ml-auto text-xs transition-transform group-open:rotate-180">
                        ▾
                      </span>
                    </summary>
                    <p className="text-muted-foreground mt-2 px-4 pb-3 text-sm">{hint}</p>
                  </details>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        )}

        {/* ── Discussion ──────────────────────────────────────────────────── */}
        <TabsContent value="discussion" className="mt-0 min-h-0 flex-1 overflow-hidden">
          <DiscussionPane problemSlug={problem.slug} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
