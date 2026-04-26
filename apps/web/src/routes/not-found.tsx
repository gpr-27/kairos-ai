import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="bg-background relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gradient-to-b from-violet-600/15 to-transparent blur-3xl" />
      </div>

      <Logo size="lg" />

      <h1 className="gradient-text mt-8 text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-4 max-w-md">
        That page slipped through the cracks. Let's get you back on track.
      </p>

      <div className="mt-8 flex gap-3">
        <Button asChild variant="outline">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Link>
        </Button>
        <Button asChild variant="gradient">
          <Link to="/problems">
            <Search className="h-4 w-4" />
            Browse problems
          </Link>
        </Button>
      </div>
    </div>
  );
}
