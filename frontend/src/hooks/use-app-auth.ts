import { useAuth } from '@clerk/clerk-react';

import { useGuestStore } from '@/stores/guest-store';

export interface AppAuth {
  /** Clerk has finished loading. */
  isLoaded: boolean;
  /** Signed in via Clerk OR an active guest session. */
  isAuthenticated: boolean;
  /** True only for real Clerk accounts. */
  isClerkUser: boolean;
  /** True for anonymous guests. */
  isGuest: boolean;
  /** Clerk user id, or guest id, or null. */
  userId: string | null;
}

/**
 * Unified auth: a user is authenticated if they have a Clerk session OR a guest
 * session. Existing Clerk behavior is unchanged; guests are layered on top.
 */
export function useAppAuth(): AppAuth {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const guestId = useGuestStore((s) => s.guestId);
  const guestToken = useGuestStore((s) => s.token);

  const isClerkUser = !!isSignedIn;
  const isGuest = !isClerkUser && !!guestId && !!guestToken;

  return {
    isLoaded,
    isAuthenticated: isClerkUser || isGuest,
    isClerkUser,
    isGuest,
    userId: isClerkUser ? (userId ?? null) : isGuest ? guestId : null,
  };
}
