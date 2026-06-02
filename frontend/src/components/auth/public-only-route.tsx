import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAppAuth } from '@/hooks/use-app-auth';

interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

/**
 * Public pages (landing, sign-in, sign-up). Signed-in Clerk users are redirected
 * away. Guests are intentionally NOT redirected, so they can reach sign-in/sign-up
 * to upgrade their anonymous session into a real account.
 */
export function PublicOnlyRoute({
  children,
  redirectTo = '/dashboard',
}: PublicOnlyRouteProps): JSX.Element {
  const { isLoaded, isClerkUser } = useAppAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isClerkUser) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
