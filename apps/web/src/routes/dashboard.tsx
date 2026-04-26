import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Flame,
  ListChecks,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';

import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SAMPLE_PROBLEMS } from '@/data/sample-problems';
import { useProgressStore } from '@/stores/progress-store';

const DIFFICULTY_VARIANTS = {
  easy: 'success',
  medium: 'warning',
  hard: 'destructive',
} as const;

const DIFFICULTY_COLORS = {
  easy: 'text-emerald-400',
  medium: 'text-amber-400',
  hard: 'text-rose-400',
} as const;

export default function DashboardPage(): JSX.Element {
  const { user } = useUser();
  const greeting = getTimeOfDayGreeting();
  const firstName = user?.firstName ?? 'friend';

  const solvedSlugs = useProgressStore((s) => s.solvedSlugs);
  const entries = useProgressStore((s) => s.entries);
  const getDailyCount = useProgressStore((s) => s.getDailyCount);
  const getStreak = useProgressStore((s) => s.getStreak);

  const totalSolved = solvedSlugs.length;
  const streak = getStreak();
  const dailyCount = getDailyCount();

  const easyTotal = SAMPLE_PROBLEMS.filter((p) => p.difficulty === 'easy').length;
  const medTotal = SAMPLE_PROBLEMS.filter((p) => p.difficulty === 'medium').length;
  const hardTotal = SAMPLE_PROBLEMS.filter((p) => p.difficulty === 'hard').length;

  const easySolved = solvedSlugs.filter((s) =>
    SAMPLE_PROBLEMS.find((p) => p.slug === s && p.difficulty === 'easy'),
  ).length;
  const medSolved = solvedSlugs.filter((s) =>
    SAMPLE_PROBLEMS.find((p) => p.slug === s && p.difficulty === 'medium'),
  ).length;
  const hardSolved = solvedSlugs.filter((s) =>
    SAMPLE_PROBLEMS.find((p) => p.slug === s && p.difficulty === 'hard'),
  ).length;

  // Last 5 unique solved problems with metadata
  const recentlySolved = entries
    .slice()
    .reverse()
    .reduce<typeof entries>((acc, e) => {
      if (!acc.find((x) => x.slug === e.slug)) acc.push(e);
      return acc;
    }, [])
    .slice(0, 5)
    .map((e) => ({
      ...e,
      problem: SAMPLE_PROBLEMS.find((p) => p.slug === e.slug),
    }))
    .filter((e) => e.problem);

  const QUICK_STATS = [
    { label: 'Solved', value: totalSolved, icon: Award, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Streak', value: `${streak}d`, icon: Flame, accent: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Easy', value: `${easySolved}/${easyTotal}`, icon: Target, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { label: 'Medium', value: `${medSolved}/${medTotal}`, icon: TrendingUp, accent: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Hard', value: `${hardSolved}/${hardTotal}`, icon: Zap, accent: 'text-rose-400', bg: 'bg-rose-500/10' },
  ] as const;

  // Recommended: unsolved problems, starting from easy
  const recommended = SAMPLE_PROBLEMS.filter((p) => !solvedSlugs.includes(p.slug)).slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {greeting}, {firstName}.
          </h1>
          <p className="text-muted-foreground mt-2">
            {totalSolved === 0
              ? "You haven't solved any problems yet. Start now!"
              : `You've solved ${totalSolved} problem${totalSolved !== 1 ? 's' : ''}. Keep it up!`}
          </p>
        </div>
        <Button asChild variant="gradient" size="lg">
          <Link to="/problems">
            <ListChecks className="h-4 w-4" />
            Browse problems
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </header>

      {/* Quick stats */}
      <section className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {QUICK_STATS.map((stat) => (
          <Card key={stat.label} className="border-border/60 bg-card/50">
            <CardContent className="flex items-center gap-3 p-5">
              <div className={`rounded-lg p-2.5 ${stat.bg} ${stat.accent}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-muted-foreground text-xs uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold leading-tight">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Activity heatmap */}
      <section className="mt-10">
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="text-orange-400 h-4 w-4" />
              Submission Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ActivityHeatmap dailyCount={dailyCount} totalSolved={totalSolved} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Difficulty breakdown */}
        <Card className="border-border/60 bg-card/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">By Difficulty</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(
              [
                { label: 'Easy', solved: easySolved, total: easyTotal, diff: 'easy' },
                { label: 'Medium', solved: medSolved, total: medTotal, diff: 'medium' },
                { label: 'Hard', solved: hardSolved, total: hardTotal, diff: 'hard' },
              ] as const
            ).map(({ label, solved, total, diff }) => (
              <div key={label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className={`font-medium ${DIFFICULTY_COLORS[diff]}`}>{label}</span>
                  <span className="text-muted-foreground text-xs">
                    {solved} / {total}
                  </span>
                </div>
                <div className="bg-muted h-1.5 w-full rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      diff === 'easy'
                        ? 'bg-emerald-500'
                        : diff === 'medium'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                    }`}
                    style={{ width: total ? `${(solved / total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recently solved */}
        <Card className="border-border/60 bg-card/50 lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <CheckCircle2 className="text-emerald-400 h-4 w-4" />
                Recently Solved
              </CardTitle>
              <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
                <Link to="/problems">
                  View all
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentlySolved.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-muted-foreground text-sm">
                  No problems solved yet.{' '}
                  <Link to="/problems" className="text-primary underline underline-offset-2">
                    Start now
                  </Link>
                </p>
              </div>
            ) : (
              <ul className="divide-border/50 divide-y">
                {recentlySolved.map(({ slug, problem, solvedAt }) => (
                  <li key={slug} className="flex items-center gap-2 py-2.5">
                    <Link
                      to={`/problem/${slug}`}
                      className="hover:text-primary min-w-0 flex-1 truncate text-sm font-medium transition-colors"
                    >
                      {problem!.title}
                    </Link>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        variant={DIFFICULTY_VARIANTS[problem!.difficulty]}
                        className="capitalize text-[10px]"
                      >
                        {problem!.difficulty}
                      </Badge>
                      <span className="text-muted-foreground text-[10px]">
                        {timeAgo(solvedAt)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Recommended */}
      {recommended.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recommended for you</h2>
            <Button asChild variant="ghost" size="sm">
              <Link to="/problems">
                See all
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {recommended.map((problem) => (
              <Link
                key={problem.slug}
                to={`/problem/${problem.slug}`}
                className="border-border/60 bg-card/50 hover:border-primary/50 hover:bg-card group rounded-xl border p-5 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="group-hover:text-primary text-base font-semibold leading-tight">
                    {problem.title}
                  </h3>
                  <Badge variant={DIFFICULTY_VARIANTS[problem.difficulty]} className="capitalize shrink-0">
                    {problem.difficulty}
                  </Badge>
                </div>
                <p className="text-muted-foreground mt-3 line-clamp-2 text-sm">
                  {problem.description.slice(0, 100)}...
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="text-[10px] uppercase">
                    {problem.track}
                  </Badge>
                  {problem.topics.slice(0, 3).map((topic) => (
                    <Badge key={topic} variant="secondary" className="text-[10px]">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Burning the midnight oil';
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  if (hour < 21) return 'Good evening';
  return 'Late night grind';
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
