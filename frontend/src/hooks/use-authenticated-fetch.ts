import { useCallback } from 'react';

import { apiFetch, type ApiClientOptions } from '@/lib/api-client';
import { useAuthHeaders } from './use-auth-headers';

/**
 * Returns a fetch helper that automatically attaches the right identity headers —
 * a Clerk JWT for signed-in users, or the guest token for anonymous guests.
 *
 * @example
 *   const authedFetch = useAuthenticatedFetch();
 *   const profile = await authedFetch<UserProfile>('/api/v1/users/me');
 */
export function useAuthenticatedFetch() {
  const getAuthHeaders = useAuthHeaders();

  return useCallback(
    async <T>(path: string, options?: ApiClientOptions): Promise<T> => {
      const authHeaders = await getAuthHeaders();
      return apiFetch<T>(path, {
        ...options,
        headers: { ...authHeaders, ...((options?.headers as Record<string, string>) ?? {}) },
      });
    },
    [getAuthHeaders],
  );
}
