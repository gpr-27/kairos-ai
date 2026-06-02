import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { toast } from 'sonner';

import { fetchGuestMe, migrateGuestToAccount } from '@/lib/guest-api';
import { useGuestStore } from '@/stores/guest-store';

/**
 * Headless manager mounted once at the app root. It:
 *  1. Restores/validates a guest session on startup (clears it if the guest
 *     record has expired or been removed server-side).
 *  2. Migrates guest data into a Clerk account the moment a guest signs up / in,
 *     then clears the guest session.
 */
export function GuestSessionManager(): null {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const guestToken = useGuestStore((s) => s.token);
  const clearGuest = useGuestStore((s) => s.clearGuest);
  const migratingRef = useRef(false);

  // 1. Validate the guest session on load (skip if signed into Clerk).
  useEffect(() => {
    if (!isLoaded || isSignedIn || !guestToken) return;
    fetchGuestMe(guestToken).catch(() => clearGuest());
  }, [isLoaded, isSignedIn, guestToken, clearGuest]);

  // 2. On Clerk sign-in while a guest session exists, migrate then clear.
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !guestToken || migratingRef.current) return;
    migratingRef.current = true;

    void (async () => {
      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          migratingRef.current = false;
          return;
        }
        const result = await migrateGuestToAccount(clerkToken, guestToken);
        clearGuest();
        if (result.chatsMigrated > 0 || result.submissionsMigrated > 0) {
          toast.success('Your guest work was saved to your account.');
        }
      } catch {
        // Leave the guest token in place so migration can retry on next load.
        migratingRef.current = false;
      }
    })();
  }, [isLoaded, isSignedIn, guestToken, getToken, clearGuest]);

  return null;
}
