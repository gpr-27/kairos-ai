import { cn } from '@/lib/utils';

interface BackdropProps {
  className?: string;
  /** Render the subtle grid overlay. Defaults to true. */
  grid?: boolean;
}

/**
 * Ambient page background: layered aurora blobs + a faint grid that fades out.
 * Purely decorative and pointer-events-none, so it never intercepts clicks.
 */
export function Backdrop({ className, grid = true }: BackdropProps): JSX.Element {
  return (
    <div className={cn('pointer-events-none fixed inset-0 -z-10 overflow-hidden', className)}>
      {grid && <div className="bg-grid mask-fade-b absolute inset-0 opacity-60" />}

      {/* Aurora blobs */}
      <div className="animate-aurora absolute -top-40 left-1/2 h-[640px] w-[1100px] -translate-x-1/2 rounded-full bg-gradient-to-br from-violet-600/30 via-fuchsia-600/20 to-transparent blur-[120px]" />
      <div className="animate-float absolute right-[-10%] top-1/4 h-[460px] w-[460px] rounded-full bg-cyan-500/12 blur-[120px]" />
      <div
        className="animate-float absolute bottom-[-12%] left-[-6%] h-[420px] w-[420px] rounded-full bg-violet-500/14 blur-[120px]"
        style={{ animationDelay: '1.5s' }}
      />

      {/* Top vignette so the navbar reads cleanly */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background/80 to-transparent" />
    </div>
  );
}
