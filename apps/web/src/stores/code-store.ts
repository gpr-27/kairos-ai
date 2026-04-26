import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Persists user-written code per problem + language.
 * Key format: "{slug}|{language}" → code string.
 *
 * Survives page reloads and navigation. Each language slot is independent,
 * so switching from Java to Python and back restores each buffer.
 */
interface CodeStore {
  codes: Record<string, string>;

  /** Retrieve saved code for a problem + language. Returns undefined if never saved. */
  getCode: (slug: string, language: string) => string | undefined;

  /** Persist code for a problem + language. */
  setCode: (slug: string, language: string, code: string) => void;

  /** Remove the saved code (used by Reset — reverts to starter on next load). */
  clearCode: (slug: string, language: string) => void;
}

export const useCodeStore = create<CodeStore>()(
  persist(
    (set, get) => ({
      codes: {},

      getCode: (slug, language) => get().codes[`${slug}|${language}`],

      setCode: (slug, language, code) =>
        set((state) => ({
          codes: { ...state.codes, [`${slug}|${language}`]: code },
        })),

      clearCode: (slug, language) =>
        set((state) => {
          const next = { ...state.codes };
          delete next[`${slug}|${language}`];
          return { codes: next };
        }),
    }),
    { name: 'kairos.codes' },
  ),
);
