import { Link } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { Award, Calendar, CheckCircle2, Flame, Mail, Target, Zap } from 'lucide-react';

import { ActivityHeatmap } from '@/components/activity-heatmap';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SAMPLE_PROBLEMS } from '@/data/sample-problems';
import { useProgressStore } from '@/stores/progress-store';

const DIFFICULTY_COLORS = {
  easy: { text: 'text-emerald-400', bar: 'bg-emerald-500' },
  medium: { text: 'text-amber-400', bar: 'bg-amber-500' },
  hard: { text: 'text-rose-400', bar: 'bg-rose-500' },
} as const;

export default function ProfilePage(): JSX.Element {
  const { user } = useUser();

  const solvedSlugs = useProgressStore((s) => s.solvedSlugs);
  const entries = useProgressStore((s) => s.entries);
  const getDailyCount = useProgressStore((s) => s.getDailyCount);
  const getStreak = useProgressStore((s) => s.getStreak);

  const totalSolved = solvedSlugs.length;
  const streak = getStreak();
  const dailyCount = getDailyCount();
  const totalSubmissions = entries.length;

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

  const STATS = [
    { label: 'Solved', value: totalSolved, icon: Award },
    { label: 'Streak', value: `${streak}d`, icon: Flame },
    { label: 'Submissions', value: totalSubmissions, sub: `${totalSolved} / ${SAMPLE_PROBLEMS.filter(p => p.track === 'dsa').length} problems`, icon: Target },
    { label: 'XP', value: totalSolved * 50, icon: Zap },
  ] as const;

  const recentSolves = entries
    .slice()
    .reverse()
    .slice(0, 8)
    .map((e) => ({
      ...e,
      problem: SAMPLE_PROBLEMS.find((p) => p.slug === e.slug),
    }))
    .filter((e) => e.problem);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <Card className="border-border/60 bg-card/50 overflow-hidden">
        {/* Banner */}
        <div className="h-32 bg-gradient-to-r from-violet-500/30 via-fuchsia-500/20 to-cyan-500/20" />

        <CardContent className="-mt-12 p-6">
          {/* Avatar + name */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <Avatar className="border-background h-24 w-24 border-4 shadow-xl">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName ?? ''} />
                <AvatarFallback className="text-2xl">{user?.firstName?.[0] ?? 'K'}</AvatarFallback>
              </Avatar>
              <div className="space-y-0.5">
                <h1 className="text-2xl font-bold tracking-tight">
                  {user?.fullName ?? 'Kairos learner'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  @{user?.username ?? user?.id?.slice(-8) ?? 'kairos-user'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {user?.primaryEmailAddress?.emailAddress && (
                    <Badge variant="outline" className="max-w-[200px] gap-1">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{user.primaryEmailAddress.emailAddress}</span>
                    </Badge>
                  )}
                  <Badge variant="outline" className="gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined{' '}
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'recently'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Quick stats */}
          <div>
            <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider">
              Stats
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {STATS.map((stat) => (
                <Card key={stat.label} className="border-border/60 bg-background/40">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div className="bg-primary/10 text-primary rounded-lg p-2">
                      <stat.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[10px] uppercase tracking-wider">
                        {stat.label}
                      </p>
                      <p className="text-xl font-bold">{stat.value}</p>
                      {'sub' in stat && stat.sub && (
                        <p className="text-muted-foreground text-xs mt-0.5 font-medium">{stat.sub}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Activity heatmap */}
          <div>
            <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">
              Activity
            </h2>
            <Card className="border-border/60 bg-background/40">
              <CardContent className="p-5">
                <ActivityHeatmap dailyCount={dailyCount} totalSolved={totalSolved} />
              </CardContent>
            </Card>
          </div>

          <Separator className="my-6" />

          {/* Difficulty breakdown */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">
                By Difficulty
              </h2>
              <div className="space-y-4">
                {(
                  [
                    { label: 'Easy', solved: easySolved, total: easyTotal, diff: 'easy' as const },
                    { label: 'Medium', solved: medSolved, total: medTotal, diff: 'medium' as const },
                    { label: 'Hard', solved: hardSolved, total: hardTotal, diff: 'hard' as const },
                  ]
                ).map(({ label, solved, total, diff }) => (
                  <div key={label}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className={`font-medium ${DIFFICULTY_COLORS[diff].text}`}>{label}</span>
                      <span className="text-muted-foreground text-xs">{solved} / {total}</span>
                    </div>
                    <div className="bg-muted h-1.5 w-full rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${DIFFICULTY_COLORS[diff].bar}`}
                        style={{ width: total ? `${(solved / total) * 100}%` : '0%' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent solves */}
            <div>
              <h2 className="text-muted-foreground text-sm font-semibold uppercase tracking-wider mb-4">
                Recent Submissions
              </h2>
              {recentSolves.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  No submissions yet.{' '}
                  <Link to="/problems" className="text-primary underline underline-offset-2">
                    Solve a problem
                  </Link>
                </p>
              ) : (
                <ul className="divide-border/50 divide-y max-h-72 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-muted/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/50">
                  {recentSolves.map(({ slug, problem, difficulty, solvedAt }, idx) => (
                    <li key={`${slug}-${idx}`} className="flex items-center justify-between py-2">
                      <Link
                        to={`/problem/${slug}`}
                        className="hover:text-primary flex min-w-0 flex-1 items-center gap-2 text-sm font-medium transition-colors"
                      >
                        <CheckCircle2 className="text-emerald-400 h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{problem!.title}</span>
                      </Link>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <span
                          className={`text-[10px] font-medium capitalize ${
                            difficulty === 'easy'
                              ? 'text-emerald-400'
                              : difficulty === 'medium'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                          }`}
                        >
                          {difficulty}
                        </span>
                        <span className="text-muted-foreground text-[10px]">
                          {timeAgo(solvedAt)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
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
