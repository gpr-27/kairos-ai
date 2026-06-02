import { apiFetch } from './api-client';

export interface GuestSession {
  guestId: string;
  isGuest: true;
  displayName: string;
  createdAt: string;
  lastActiveAt: string;
  token: string;
}

export interface GuestMigrationResult {
  chatsMigrated: number;
  submissionsMigrated: number;
}

/** Create a brand-new anonymous guest (public endpoint, no auth). */
export function createGuestSession(): Promise<GuestSession> {
  return apiFetch<GuestSession>('/api/v1/guests', { method: 'POST' });
}

/** Restore/validate an existing guest session by its signed token. */
export function fetchGuestMe(token: string): Promise<GuestSession> {
  return apiFetch<GuestSession>('/api/v1/guests/me', {
    headers: { 'X-Guest-Token': token },
  });
}

/** Migrate a guest's data into the now-signed-in Clerk account. */
export function migrateGuestToAccount(
  clerkToken: string,
  guestToken: string,
): Promise<GuestMigrationResult> {
  return apiFetch<GuestMigrationResult>('/api/v1/guests/migrate', {
    method: 'POST',
    token: clerkToken,
    headers: { 'X-Guest-Token': guestToken },
  });
}
