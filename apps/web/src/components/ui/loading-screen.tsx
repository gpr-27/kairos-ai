import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';

interface LoadingScreenProps {
  className?: string;
  message?: string;
}

export function LoadingScreen({ className, message }: LoadingScreenProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-3',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="relative">
        <div className="bg-primary/20 absolute inset-0 animate-pulse rounded-full blur-xl" />
        <Loader2 className="text-primary relative h-8 w-8 animate-spin" />
      </div>
      {message ? <p className="text-muted-foreground text-sm">{message}</p> : null}
    </div>
  );
}
