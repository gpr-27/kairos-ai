import type { ReactNode } from 'react';
import { Component } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  message: string;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  public constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  public static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'Unknown frontend error',
    };
  }

  public override componentDidCatch(error: unknown): void {
    console.error('Frontend runtime error:', error);
  }

  public override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
          <div className="w-full max-w-2xl rounded-lg border border-red-500/30 bg-red-500/10 p-5">
            <h1 className="mb-2 text-xl font-semibold">Frontend failed to load</h1>
            <p className="text-sm opacity-90">{this.state.message}</p>
            <p className="mt-4 text-sm opacity-80">
              Check <code>.env.local</code> values (especially Clerk keys), then restart{' '}
              <code>pnpm dev</code>.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
