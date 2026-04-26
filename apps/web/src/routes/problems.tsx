import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { SAMPLE_PROBLEMS, type SampleProblem } from '@/data/sample-problems';
import { useProgressStore } from '@/stores/progress-store';
import { cn } from '@/lib/utils';

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

// ── Small progress bar ───────────────────────────────────────────────────────

function ProgressBar({ solved, total, color }: { solved: number; total: number; color: string }) {
  const pct = total === 0 ? 0 : Math.round((solved / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-muted-foreground w-14 text-right text-[11px]">
        {solved}/{total}
      </span>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────

export default function ProblemsPage(): JSX.Element {
  const [search, setSearch] = useState('');
  const [track, setTrack] = useState<'all' | SampleProblem['track']>('all');
  const [difficulty, setDifficulty] = useState<'all' | SampleProblem['difficulty']>('all');

  const solvedSlugs = useProgressStore((s) => s.solvedSlugs);
  const isSolved = useProgressStore((s) => s.isSolved);

  const dsa = SAMPLE_PROBLEMS.filter((p) => p.track !== 'system_design');
  const totalSolved = solvedSlugs.filter((slug) =>
    SAMPLE_PROBLEMS.some((p) => p.slug === slug),
  ).length;

  const byDiff = (d: SampleProblem['difficulty']) => ({
    total: dsa.filter((p) => p.difficulty === d).length,
    solved: dsa.filter((p) => p.difficulty === d && isSolved(p.slug)).length,
  });

  const easy = byDiff('easy');
  const medium = byDiff('medium');
  const hard = byDiff('hard');

  const filtered = useMemo(() => {
    return SAMPLE_PROBLEMS.filter((problem) => {
      if (track !== 'all' && problem.track !== track) return false;
      if (difficulty !== 'all' && problem.difficulty !== difficulty) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return (
          problem.title.toLowerCase().includes(q) ||
          problem.topics.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [search, track, difficulty]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <header className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Problems</h1>
          <p className="text-muted-foreground mt-1.5">
            <span className="text-foreground font-semibold">{totalSolved}</span> of{' '}
            <span className="text-foreground font-semibold">{SAMPLE_PROBLEMS.length}</span> solved
          </p>
        </div>

        {/* Progress by difficulty */}
        <div className="border-border/60 bg-card/40 w-full rounded-xl border p-4 sm:w-64">
          <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase tracking-wider">
            Progress
          </p>
          <div className="space-y-2.5">
            <div className="flex items-center gap-3">
              <span className="text-success w-14 text-xs font-medium">Easy</span>
              <ProgressBar solved={easy.solved} total={easy.total} color="bg-success" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-warning w-14 text-xs font-medium">Medium</span>
              <ProgressBar solved={medium.solved} total={medium.total} color="bg-warning" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-destructive w-14 text-xs font-medium">Hard</span>
              <ProgressBar solved={hard.solved} total={hard.total} color="bg-destructive" />
            </div>
          </div>
        </div>
      </header>

      {/* ── Filters ── */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            type="search"
            placeholder="Search problems or topics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={track} onValueChange={(v) => setTrack(v as 'all' | SampleProblem['track'])}>
          <SelectTrigger className="w-full sm:w-48">
            <SlidersHorizontal className="text-muted-foreground h-4 w-4" />
            <SelectValue placeholder="Track" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tracks</SelectItem>
            <SelectItem value="dsa">DSA</SelectItem>
            <SelectItem value="cp">Competitive</SelectItem>
            <SelectItem value="system_design">System Design</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={difficulty}
          onValueChange={(v) => setDifficulty(v as 'all' | SampleProblem['difficulty'])}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All difficulties</SelectItem>
            <SelectItem value="easy">Easy</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Problem list ── */}
      <div className="border-border/60 bg-card/40 mt-6 overflow-hidden rounded-xl border">
        {/* Table header */}
        <div className="border-border/60 bg-muted/20 hidden grid-cols-[3rem_1fr_auto_auto_auto] items-center gap-4 border-b px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground sm:grid">
          <span className="text-right">#</span>
          <span>Title</span>
          <span>Topics</span>
          <span className="w-20 text-center">Acceptance</span>
          <span className="w-20 text-center">Difficulty</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <p className="text-lg font-medium">No problems match your filters.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setTrack('all');
                setDifficulty('all');
              }}
            >
              Reset filters
            </Button>
          </div>
        ) : (
          <ul className="divide-border/60 divide-y">
            {filtered.map((problem) => {
              const solved = isSolved(problem.slug);
              const globalNum = SAMPLE_PROBLEMS.indexOf(problem) + 1;
              return (
                <li key={problem.slug}>
                  <Link
                    to={`/problem/${problem.slug}`}
                    className={cn(
                      'group hover:bg-accent/5 flex items-center gap-4 px-5 py-3.5 transition-colors',
                      solved && 'bg-success/[0.03]',
                    )}
                  >
                    {/* Number / solved check */}
                    <span className="text-muted-foreground w-8 shrink-0 text-right text-sm tabular-nums">
                      {solved ? (
                        <CheckCircle2 className="text-success ml-auto h-4.5 w-4.5" />
                      ) : (
                        globalNum
                      )}
                    </span>

                    {/* Title + track badge */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={cn(
                          'group-hover:text-primary truncate text-sm font-medium transition-colors',
                          solved && 'text-success',
                        )}
                      >
                        {problem.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          {TRACK_LABELS[problem.track]}
                        </Badge>
                        {problem.topics.slice(0, 3).map((topic) => (
                          <Badge key={topic} variant="secondary" className="text-[10px]">
                            {topic}
                          </Badge>
                        ))}
                        {solved && (
                          <Badge variant="success" className="text-[10px]">
                            Solved
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Acceptance rate */}
                    <span
                      className={cn(
                        'hidden w-20 shrink-0 text-center text-xs tabular-nums sm:block',
                        problem.acceptanceRate !== undefined
                          ? problem.acceptanceRate >= 60
                            ? 'text-emerald-400'
                            : problem.acceptanceRate >= 40
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          : 'text-muted-foreground',
                      )}
                    >
                      {problem.acceptanceRate !== undefined ? `${problem.acceptanceRate}%` : '—'}
                    </span>

                    {/* Difficulty */}
                    <span className="w-20 shrink-0 text-center">
                      <Badge
                        variant={DIFFICULTY_VARIANTS[problem.difficulty]}
                        className="capitalize"
                      >
                        {problem.difficulty}
                      </Badge>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
