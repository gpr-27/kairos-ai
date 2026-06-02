import { Link } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';

import { Backdrop } from '@/components/brand/backdrop';
import { Logo } from '@/components/brand/logo';
import { Button } from '@/components/ui/button';

export default function NotFoundPage(): JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <Backdrop />

      <Logo size="lg" />

      <h1 className="gradient-text mt-8 text-7xl font-bold tracking-tight">404</h1>
      <p className="text-muted-foreground mt-4 max-w-md">
        That page slipped through the cracks. Let's get you back on track.
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
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
