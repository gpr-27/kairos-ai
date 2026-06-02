import { useAuth } from '@clerk/clerk-react';
import { useCallback } from 'react';

import { useGuestStore } from '@/stores/guest-store';

/**
 * Returns a function that resolves the right auth headers for the current user:
 * a Clerk `Authorization: Bearer <jwt>` for signed-in users, or an
 * `X-Guest-Token` header for anonymous guests. Used by every authenticated
 * request so the API can resolve a unified identity for Clerk users and guests.
 */
export function useAuthHeaders(): () => Promise<Record<string, string>> {
  const { isSignedIn, getToken } = useAuth();
  const guestToken = useGuestStore((s) => s.token);

  return useCallback(async (): Promise<Record<string, string>> => {
    const headers: Record<string, string> = {};
    if (isSignedIn) {
      const token = await getToken();
      if (token) headers.Authorization = `Bearer ${token}`;
      return headers;
    }
    if (guestToken) headers['X-Guest-Token'] = guestToken;
    return headers;
  }, [isSignedIn, getToken, guestToken]);
}
