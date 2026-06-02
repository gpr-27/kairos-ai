import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: { mark: 'h-6 w-6', text: 'text-base' },
  md: { mark: 'h-8 w-8', text: 'text-lg' },
  lg: { mark: 'h-10 w-10', text: 'text-2xl' },
} as const;

export function Logo({ className, showText = true, size = 'md' }: LogoProps): JSX.Element {
  const styles = sizeClasses[size];
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white shadow-lg shadow-violet-600/30',
          styles.mark,
        )}
      >
        <svg viewBox="0 0 32 32" className="h-3/5 w-3/5" fill="currentColor" aria-hidden="true">
          <path d="M9 8.5h3v15H9zM23 8.5h-3l-5 7v-7h-3v15h3v-5l1.5-2 4 7h3.5l-5.5-9z" />
        </svg>
      </div>
      {showText ? (
        <span className={cn('font-bold tracking-tight', styles.text)}>
          Kairos<span className="gradient-text">.AI</span>
        </span>
      ) : null}
    </div>
  );
}
