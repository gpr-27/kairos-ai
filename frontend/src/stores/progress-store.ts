import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SolvedEntry {
  slug: string;
  difficulty: 'easy' | 'medium' | 'hard';
  solvedAt: string; // ISO 8601 date string
}

interface ProgressState {
  /** Unique slugs of problems the user has fully solved at least once. */
  solvedSlugs: string[];
  /** Every solve event (one entry per solve, used for activity graph). */
  entries: SolvedEntry[];

  markSolved: (slug: string, difficulty?: 'easy' | 'medium' | 'hard') => void;
  isSolved: (slug: string) => boolean;

  /** Returns a map of "YYYY-MM-DD" → number of problems solved that day. */
  getDailyCount: () => Map<string, number>;

  /** Current streak in days (consecutive days ending today or yesterday). */
  getStreak: () => number;
}

/** Returns "YYYY-MM-DD" in the user's **local** timezone. */
function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Convert an ISO 8601 string to a local-timezone date key. */
function toDateKey(isoString: string): string {
  return localDateKey(new Date(isoString));
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      solvedSlugs: [],
      entries: [],

      markSolved: (slug, difficulty = 'easy') =>
        set((state) => ({
          solvedSlugs: state.solvedSlugs.includes(slug)
            ? state.solvedSlugs
            : [...state.solvedSlugs, slug],
          entries: [...state.entries, { slug, difficulty, solvedAt: new Date().toISOString() }],
        })),

      isSolved: (slug) => get().solvedSlugs.includes(slug),

      getDailyCount: () => {
        const map = new Map<string, number>();
        for (const entry of get().entries) {
          const key = toDateKey(entry.solvedAt);
          map.set(key, (map.get(key) ?? 0) + 1);
        }
        return map;
      },

      getStreak: () => {
        const dailyCount = get().getDailyCount();
        if (dailyCount.size === 0) return 0;

        // cursor stays in local time; localDateKey() extracts the correct date
        const cursor = new Date();

        // If nothing solved today, allow yesterday to be the streak anchor
        if (!dailyCount.has(localDateKey(cursor))) {
          cursor.setDate(cursor.getDate() - 1);
        }

        let streak = 0;
        while (dailyCount.has(localDateKey(cursor))) {
          streak++;
          cursor.setDate(cursor.getDate() - 1);
        }

        return streak;
      },
    }),
    { name: 'kairos.progress' },
  ),
);
