import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Brain,
  Code2,
  Github,
  Layers,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const FEATURES = [
  {
    icon: Brain,
    title: 'Specialized AI brain',
    body: 'A fine-tuned 1.5B language model trained on curated DSA reasoning, competitive programming editorials, and system design archives — small, fast, and laser-focused.',
  },
  {
    icon: MessageSquare,
    title: 'Socratic, not spoon-feeding',
    body: 'Get progressive hints, code reviews, and complexity analysis. The coach asks the right questions instead of dumping answers.',
  },
  {
    icon: Code2,
    title: 'Code in 15+ languages',
    body: 'Sandboxed execution for Python, C++, Java, Go, Rust, TypeScript, and more. Real test cases, real timing, real feedback.',
  },
  {
    icon: Layers,
    title: 'Three tracks, one tutor',
    body: 'DSA fundamentals, competitive programming, and system design — all guided by the same coach with mode-specific tools.',
  },
  {
    icon: Target,
    title: 'Adaptive learning paths',
    body: 'Spaced-repetition review, weak-topic detection, and personalized recommendations that evolve with your skill graph.',
  },
  {
    icon: ShieldCheck,
    title: 'Open and private',
    body: 'Open weights, open source, open evaluation. Your sessions stay yours. No hidden tracking, no dark patterns.',
  },
] as const;

const STATS = [
  { value: '15+', label: 'Languages' },
  { value: '1.5B', label: 'Parameter brain' },
  { value: '0', label: 'Tutorial dumps' },
  { value: '∞', label: 'Patience' },
] as const;

export default function LandingPage(): JSX.Element {
  return (
    <div className="bg-background relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[1200px] -translate-x-1/2 rounded-full bg-gradient-to-b from-violet-600/30 via-fuchsia-600/15 to-transparent blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-32 left-0 h-[400px] w-[400px] rounded-full bg-violet-500/10 blur-3xl" />
      </div>

      <header className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href="https://github.com/gpr-27/kairos-ai" target="_blank" rel="noreferrer">
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/sign-in">Sign in</Link>
          </Button>
          <Button asChild variant="gradient" size="sm">
            <Link to="/sign-up">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </nav>
      </header>

      <section className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <Badge className="mb-6 gap-1.5 px-3 py-1.5 text-xs">
            <Sparkles className="h-3.5 w-3.5" />
            Now in private alpha · Free forever for students
          </Badge>

          <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Learn algorithms the way you{' '}
            <span className="gradient-text">should have been taught.</span>
          </h1>

          <p className="text-muted-foreground mx-auto mt-6 max-w-2xl text-pretty text-lg sm:text-xl">
            Kairos is a Socratic AI tutor for DSA, competitive programming, and system design. It
            asks the right questions, runs your code, and gives progressive hints — instead of
            dumping the answer.
          </p>

          <div className="mt-10 flex items-center justify-center gap-3">
            <Button asChild variant="gradient" size="xl">
              <Link to="/sign-up">
                Start solving
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="xl">
              <a href="#features">See how it works</a>
            </Button>
          </div>

          <dl className="mx-auto mt-16 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="border-border/50 bg-card/50 rounded-xl border p-4 backdrop-blur"
              >
                <dt className="text-muted-foreground text-xs uppercase tracking-wider">
                  {stat.label}
                </dt>
                <dd className="gradient-text mt-1 text-2xl font-bold">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </motion.div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Built for learners who want to{' '}
            <span className="gradient-text">actually understand.</span>
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            Every feature is designed to push you toward insight, not toward a copy-paste solution.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="border-border/60 bg-card/40 hover:border-primary/40 hover:bg-card/70 group rounded-xl border p-6 backdrop-blur transition-all"
            >
              <div className="text-primary ring-primary/20 group-hover:ring-primary/50 mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 ring-1">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{feature.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="border-border/60 rounded-2xl border bg-gradient-to-br from-violet-500/10 via-fuchsia-500/5 to-transparent p-10 text-center backdrop-blur sm:p-16">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Ready to <span className="gradient-text">stop memorizing</span> and start thinking?
          </h2>
          <p className="text-muted-foreground mx-auto mt-4 max-w-xl">
            Free forever. Open source. No credit card. Your first hint awaits.
          </p>
          <Button asChild variant="gradient" size="xl" className="mt-8">
            <Link to="/sign-up">
              Create free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-border/50 border-t">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo size="sm" />
          <p className="text-muted-foreground text-sm">
            Built with care by{' '}
            <a
              href="https://github.com/gpr-27"
              target="_blank"
              rel="noreferrer"
              className="text-foreground hover:text-primary font-medium"
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
