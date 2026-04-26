import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

import { apiFetch, type ApiClientOptions } from '@/lib/api-client';

/**
 * Returns a fetch helper that automatically attaches a fresh Clerk JWT.
 *
 * @example
 *   const authedFetch = useAuthenticatedFetch();
 *   const profile = await authedFetch<UserProfile>('/api/v1/users/me');
 */
export function useAuthenticatedFetch() {
  const { getToken } = useAuth();

  return useCallback(
    async <T>(path: string, options?: ApiClientOptions): Promise<T> => {
      const token = await getToken();
      return apiFetch<T>(path, { ...options, token });
    },
    [getToken],
  );
}
