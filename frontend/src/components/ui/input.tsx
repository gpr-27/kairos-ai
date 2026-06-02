import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '@/lib/utils';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'border-border/80 bg-card/50 ring-offset-background flex h-11 w-full rounded-lg border px-3.5 py-2 text-sm backdrop-blur-sm',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-muted-foreground',
          'hover:border-border focus-visible:border-primary/60 focus-visible:ring-ring/40 focus-visible:outline-none focus-visible:ring-4',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-200',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
