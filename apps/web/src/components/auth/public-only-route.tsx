import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';

import { LoadingScreen } from '@/components/ui/loading-screen';

interface PublicOnlyRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicOnlyRoute({
  children,
  redirectTo = '/dashboard',
}: PublicOnlyRouteProps): JSX.Element {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  if (isSignedIn) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
