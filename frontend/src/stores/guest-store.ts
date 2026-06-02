import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Anonymous guest session. Persisted to localStorage so a guest's session
 * survives page refreshes (the guestId + signed token ARE the credential).
 */
interface GuestState {
  guestId: string | null;
  token: string | null;
  setGuest: (guestId: string, token: string) => void;
  clearGuest: () => void;
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      guestId: null,
      token: null,
      setGuest: (guestId, token) => set({ guestId, token }),
      clearGuest: () => set({ guestId: null, token: null }),
    }),
    { name: 'kairos-guest' },
  ),
);
