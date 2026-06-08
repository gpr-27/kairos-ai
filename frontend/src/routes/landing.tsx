import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Boxes,
  Brain,
  Check,
  Code2,
  Cpu,
  Gauge,
  Lightbulb,
  MessageSquare,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';

import { Backdrop } from '@/components/brand/backdrop';
import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { config } from '@/config';

const FEATURES = [
  {
    icon: Zap,
    title: 'Groq-accelerated answers',
    body: 'Powered by Groq’s LPU inference. Hints and code reviews stream back in well under a second — fast enough to keep you in flow.',
    accent: 'from-amber-500/20 to-orange-500/20 text-amber-300',
    span: 'lg:col-span-2',
  },
  {
    icon: MessageSquare,
    title: 'Socratic, not spoon-feeding',
    body: 'Progressive hints — nudge first, idea second, code last. The coach asks the right questions instead of dumping the answer.',
    accent: 'from-violet-500/20 to-fuchsia-500/20 text-violet-300',
    span: '',
  },
  {
    icon: Code2,
    title: 'Run code in 15+ languages',
    body: 'Sandboxed execution for Python, C++, Java, Go, Rust, TypeScript and more — real test cases, real timing, real feedback.',
    accent: 'from-cyan-500/20 to-sky-500/20 text-cyan-300',
    span: '',
  },
  {
    icon: Boxes,
    title: 'Three tracks, one tutor',
    body: 'DSA fundamentals, competitive programming and system design — each with mode-specific tools and prompts.',
    accent: 'from-emerald-500/20 to-teal-500/20 text-emerald-300',
    span: '',
  },
  {
    icon: Target,
    title: 'Adaptive learning paths',
    body: 'Streaks, weak-topic detection and recommendations that evolve with the problems you solve.',
    accent: 'from-rose-500/20 to-pink-500/20 text-rose-300',
    span: '',
  },
  {
    icon: ShieldCheck,
    title: 'Open & private',
    body: 'Open source, swappable model backends, and sessions that stay yours. No dark patterns, no tracking.',
    accent: 'from-indigo-500/20 to-violet-500/20 text-indigo-300',
    span: 'lg:col-span-2',
  },
] as const;

const STATS = [
  { value: '<1s', label: 'First token' },
  { value: 'Groq', label: 'LPU inference' },
  { value: '15+', label: 'Languages' },
  { value: '$0', label: 'Forever free' },
] as const;

const STEPS = [
  {
    icon: Target,
    title: 'Pick a problem',
    body: 'Choose from curated DSA, CP and system-design problems — filtered by topic and difficulty.',
  },
  {
    icon: Code2,
    title: 'Solve in the IDE',
    body: 'Write and run code against real test cases in a Monaco editor with sandboxed execution.',
  },
  {
    icon: Brain,
    title: 'Coach when stuck',
    body: 'Ask Kairos for a nudge, a code review or a complexity check — it streams a Socratic reply instantly.',
  },
] as const;

const LANGUAGES = [
  'Python',
  'C++',
  'Java',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Ruby',
  'C',
  'C#',
  'Kotlin',
  'Swift',
  'PHP',
  'Scala',
  'Bash',
] as const;

export default function LandingPage(): JSX.Element {
  return (
    <div className="text-foreground relative min-h-screen overflow-x-clip">
      <Backdrop />

      {/* ── Header ── */}
      <header className="sticky top-0 z-50">
        <div className="glass-strong border-b border-white/5">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <Logo />
            <nav className="flex items-center gap-1.5 sm:gap-2">
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <a href="#features">Features</a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="hidden min-[380px]:inline-flex">
                <Link to="/sign-in">Sign in</Link>
              </Button>
              <Button asChild variant="gradient" size="sm">
                <Link to="/sign-up">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-3xl text-center"
        >
          <a
            href="#features"
            className="border-border/60 bg-card/50 text-muted-foreground hover:border-primary/40 hover:text-foreground mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-medium backdrop-blur transition-colors"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse-ring absolute inline-flex h-2 w-2 rounded-full bg-violet-400" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-violet-400" />
            </span>
            Powered by Groq’s LPU inference
            <span className="text-muted-foreground/50">·</span>
            <span className="gradient-text font-semibold">sub-second answers</span>
          </a>

          <h1 className="text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Learn algorithms the way you{' '}
            <span className="gradient-text-animated">should have been taught.</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed sm:text-xl">
            Kairos is a Socratic AI coach for DSA, competitive programming and system design. It asks
            the right questions, runs your code, and streams progressive hints — instead of dumping
            the answer.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="gradient" size="xl" className="w-full sm:w-auto">
              <Link to="/sign-up">
                Start solving free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="w-full sm:w-auto">
              <a href="#how">
                <Sparkles className="h-4 w-4" />
                See how it works
              </a>
            </Button>
          </div>

          <p className="text-muted-foreground mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> No credit card
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> Open source
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-400" /> 15+ languages
            </span>
          </p>
        </motion.div>

        {/* Coach preview */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-16 max-w-4xl"
        >
          <CoachPreview />
        </motion.div>

        {/* Stats */}
        <div className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {STATS.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="border-border/60 bg-card/40 rounded-xl border p-4 text-center backdrop-blur"
            >
              <div className="gradient-text text-3xl font-extrabold tabular-nums">{stat.value}</div>
              <div className="text-muted-foreground mt-1 text-xs uppercase tracking-wider">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Languages marquee ── */}
      <section className="py-10">
        <p className="text-muted-foreground mb-6 text-center text-xs font-medium uppercase tracking-[0.2em]">
          Run and review code in
        </p>
        <div className="mask-fade-x relative flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-3 pr-3">
            {[...LANGUAGES, ...LANGUAGES].map((lang, i) => (
              <span
                key={`${lang}-${i}`}
                className="border-border/60 bg-card/40 text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-sm backdrop-blur"
              >
                <Code2 className="h-3.5 w-3.5 text-violet-400" />
                {lang}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" /> Why Kairos
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for learners who want to{' '}
            <span className="gradient-text">actually understand.</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Every feature pushes you toward insight — not toward a copy-paste solution.
          </p>
        </div>

        <div className="mx-auto mt-14 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
              className={`card-hover border-border/60 bg-card/40 group relative overflow-hidden rounded-2xl border p-6 backdrop-blur ${feature.span}`}
            >
              <div
                className={`bg-gradient-to-br ${feature.accent} ring-border/40 mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ring-1`}
              >
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{feature.body}</p>
              <div className="from-primary/40 absolute inset-x-0 bottom-0 h-px bg-gradient-to-r to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="mx-auto max-w-7xl scroll-mt-20 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <Badge variant="outline" className="mb-4 gap-1.5">
            <Route className="h-3.5 w-3.5 text-violet-400" /> How it works
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            From stuck to <span className="gradient-text">solved</span>, in three steps.
          </h2>
        </div>

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="border-border/60 bg-card/40 relative rounded-2xl border p-6 backdrop-blur"
            >
              <span className="gradient-text absolute right-5 top-4 text-5xl font-black opacity-15">
                {i + 1}
              </span>
              <div className="text-primary ring-primary/20 mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1">
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="gradient-border bg-card/40 relative overflow-hidden rounded-3xl p-10 text-center backdrop-blur sm:p-16">
          <div className="bg-grid mask-fade-b absolute inset-0 -z-10 opacity-40" />
          <div className="ring-primary/20 mx-auto mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1">
            <Cpu className="h-7 w-7 text-violet-300" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to <span className="gradient-text">stop memorizing</span> and start thinking?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
            Free forever. Open source. No credit card. Your first hint is one click away.
          </p>
          <Button asChild variant="gradient" size="xl" className="mt-8">
            <Link to="/sign-up">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-border/50 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo size="sm" />
          <p className="text-muted-foreground text-center text-sm">
            Built with care by{' '}
            <a
              href="https://github.com/gpr-27"
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary font-medium transition-colors"
            >
              Praneeth Reddy Gandra
            </a>
            . MIT licensed.
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ── Coach preview window (decorative) ─────────────────────────────────────── */

function CoachPreview(): JSX.Element {
  const defaultModelLabel =
    config.llm.availableModels.find((m) => m.id === config.llm.defaultModel)?.label ??
    config.llm.defaultModel;

  return (
    <div className="glass-strong relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl shadow-violet-950/40">
      {/* Window chrome */}
      <div className="border-border/60 flex items-center gap-2 border-b px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-rose-400/80" />
        <span className="h-3 w-3 rounded-full bg-amber-400/80" />
        <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
        <span className="text-muted-foreground ml-3 font-mono text-xs">
          two-sum · python · kairos coach
        </span>
        <span className="ml-auto hidden items-center gap-1 rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300 sm:inline-flex">
          <Gauge className="h-3 w-3" /> {defaultModelLabel}
        </span>
      </div>

      <div className="grid gap-0 md:grid-cols-[1.1fr_1fr]">
        {/* Code side */}
        <div className="border-border/60 bg-[#0d0d16] p-5 font-mono text-[13px] leading-relaxed md:border-r">
          <pre className="whitespace-pre-wrap text-zinc-300">
            <span className="text-violet-400">def</span>{' '}
            <span className="text-sky-300">two_sum</span>(nums, target):
            {'\n'}    seen = {'{}'}
            {'\n'}    <span className="text-violet-400">for</span> i, n{' '}
            <span className="text-violet-400">in</span> enumerate(nums):
            {'\n'}        <span className="text-zinc-500"># what do I look up here?</span>
            {'\n'}        <span className="text-violet-400">if</span> ?{' '}
            <span className="text-violet-400">in</span> seen:
            {'\n'}            <span className="text-violet-400">return</span> [seen[?], i]
          </pre>
        </div>

        {/* Chat side */}
        <div className="space-y-4 p-5">
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground max-w-[85%] rounded-2xl rounded-br-sm px-3.5 py-2 text-sm">
              I built a hash map but I’m stuck on what to check. Hint?
            </div>
          </div>
          <div className="flex gap-2.5">
            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
              K
            </div>
            <div className="text-foreground/90 space-y-2 text-sm leading-relaxed">
              <p className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
                <Lightbulb className="h-3.5 w-3.5" /> hint
              </p>
              <p>
                You’re iterating with the current value{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-violet-300">n</code>. For a
                pair that sums to{' '}
                <code className="rounded bg-white/10 px-1 py-0.5 text-violet-300">target</code>, what
                value would its partner have to be? Check the map for <em>that</em>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
