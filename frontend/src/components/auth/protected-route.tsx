import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

import { LoadingScreen } from '@/components/ui/loading-screen';
import { useAppAuth } from '@/hooks/use-app-auth';

interface ProtectedRouteProps {
  children: ReactNode;
}

/** Allows access for a valid Clerk session OR an active guest session. */
export function ProtectedRoute({ children }: ProtectedRouteProps): JSX.Element {
  const { isLoaded, isAuthenticated } = useAppAuth();
  const location = useLocation();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
