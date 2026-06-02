import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Language } from '@kairos/types';

/**
 * Persisted editor preferences. Survives reloads.
 *
 * @example
 *   const language = useEditorStore((s) => s.language);
 *   const setLanguage = useEditorStore((s) => s.setLanguage);
 */
interface EditorState {
  language: Language;
  fontSize: number;
  tabSize: number;
  setLanguage: (language: Language) => void;
  setFontSize: (size: number) => void;
  setTabSize: (size: number) => void;
}

export const useEditorStore = create<EditorState>()(
  persist(
    (set) => ({
      language: 'cpp',
      fontSize: 14,
      tabSize: 4,
      setLanguage: (language) => set({ language }),
      setFontSize: (fontSize) => set({ fontSize }),
      setTabSize: (tabSize) => set({ tabSize }),
    }),
    { name: 'kairos.editor' },
  ),
);
