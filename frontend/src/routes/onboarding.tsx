import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, Target, Zap } from 'lucide-react';
import { toast } from 'sonner';

import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Just starting', desc: 'Learning the basics, building confidence.' },
  { id: 'intermediate', label: 'Comfortable', desc: 'Solving easies, working through mediums.' },
  { id: 'advanced', label: 'Crushing it', desc: 'Hard problems, contests, system design.' },
] as const;

const GOALS = [
  { id: 'placements', label: 'College placements', icon: Target },
  { id: 'internships', label: 'Internships', icon: Zap },
  { id: 'contests', label: 'Competitive programming', icon: Sparkles },
  { id: 'interviews', label: 'FAANG interviews', icon: Target },
  { id: 'curiosity', label: 'Pure curiosity', icon: Sparkles },
] as const;

const TOPICS = [
  'arrays',
  'dynamic_programming',
  'graphs',
  'trees',
  'strings',
  'greedy',
  'binary_search',
  'recursion',
  'system_design',
] as const;

const TOPIC_LABELS: Record<(typeof TOPICS)[number], string> = {
  arrays: 'Arrays',
  dynamic_programming: 'Dynamic Programming',
  graphs: 'Graphs',
  trees: 'Trees',
  strings: 'Strings',
  greedy: 'Greedy',
  binary_search: 'Binary Search',
  recursion: 'Recursion',
  system_design: 'System Design',
};

type SkillLevel = (typeof SKILL_LEVELS)[number]['id'];
type Goal = (typeof GOALS)[number]['id'];
type Topic = (typeof TOPICS)[number];

export default function OnboardingPage(): JSX.Element {
  const navigate = useNavigate();
  const { user } = useUser();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [skill, setSkill] = useState<SkillLevel | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function toggle<T extends string>(value: T, list: T[], setList: (v: T[]) => void): void {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleFinish(): Promise<void> {
    setSubmitting(true);
    try {
      // TODO: POST to /api/users/me/onboarding once backend is wired
      await new Promise((r) => setTimeout(r, 600));
      toast.success(`You're all set, ${user?.firstName ?? 'friend'}.`);
      navigate('/dashboard');
    } catch {
      toast.error('Could not save preferences. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  const stepProgress = (step / 3) * 100;

  return (
    <div className="bg-background relative flex min-h-screen flex-col">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-1/2 top-0 h-[500px] w-[900px] max-w-[150vw] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-600/20 via-fuchsia-600/10 to-transparent blur-3xl" />
      </div>

      <header className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-6 sm:px-6">
        <Logo />
        <span className="text-muted-foreground text-sm">Step {step} of 3</span>
      </header>

      <div className="bg-muted mx-auto h-1 w-full max-w-4xl overflow-hidden rounded-full">
        <motion.div
          className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
          initial={{ width: '0%' }}
          animate={{ width: `${stepProgress}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-12 sm:px-6">
        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome, {user?.firstName ?? 'friend'} 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              First, where are you in your journey? Honest answer — it shapes how Kairos coaches
              you.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {SKILL_LEVELS.map((level) => (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => setSkill(level.id)}
                  className={`group rounded-xl border p-6 text-left transition-all ${
                    skill === level.id
                      ? 'border-primary bg-primary/5 ring-primary/30 ring-2'
                      : 'border-border bg-card hover:border-primary/50 hover:bg-card/80'
                  }`}
                >
                  <h3 className="text-lg font-semibold">{level.label}</h3>
                  <p className="text-muted-foreground mt-2 text-sm">{level.desc}</p>
                </button>
              ))}
            </div>

            <div className="mt-10 flex justify-end">
              <Button disabled={!skill} onClick={() => setStep(2)} variant="gradient" size="lg">
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              What are you working toward?
            </h1>
            <p className="text-muted-foreground mt-2">
              Pick all that apply. We'll prioritize accordingly.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {GOALS.map((goal) => (
                <button
                  key={goal.id}
                  type="button"
                  onClick={() => toggle(goal.id, goals, setGoals)}
                  className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                    goals.includes(goal.id)
                      ? 'border-primary bg-primary/5 ring-primary/30 ring-2'
                      : 'border-border bg-card hover:border-primary/50'
                  }`}
                >
                  <div className="bg-primary/10 text-primary flex h-10 w-10 items-center justify-center rounded-lg">
                    <goal.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{goal.label}</span>
                </button>
              ))}
            </div>

            <div className="mt-10 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(1)} size="lg">
                Back
              </Button>
              <Button
                disabled={goals.length === 0}
                onClick={() => setStep(3)}
                variant="gradient"
                size="lg"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Topics you want to focus on?
            </h1>
            <p className="text-muted-foreground mt-2">
              Pick a few. We'll start your queue here. You can change this anytime.
            </p>

            <Card className="border-border/60 bg-card/40 mt-8">
              <CardContent className="flex flex-wrap gap-2 p-6">
                {TOPICS.map((topic) => (
                  <Badge
                    key={topic}
                    variant={topics.includes(topic) ? 'default' : 'outline'}
                    onClick={() => toggle(topic, topics, setTopics)}
                    className="cursor-pointer select-none px-4 py-2 text-sm transition-all hover:scale-105"
                  >
                    {TOPIC_LABELS[topic]}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <div className="mt-10 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(2)} size="lg">
                Back
              </Button>
              <Button
                disabled={topics.length === 0 || submitting}
                onClick={handleFinish}
                variant="gradient"
                size="lg"
              >
                {submitting ? 'Saving…' : 'Finish'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
