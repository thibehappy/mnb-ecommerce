'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Lang = 'FR' | 'EN';

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

/**
 * Persisted language store. The user's choice survives reloads.
 * FR is the default — the brand is French and most copy is written
 * in French first, with EN as a translation.
 */
export const useLang = create<LangState>()(
  persist(
    (set) => ({
      lang: 'FR',
      setLang: (lang) => set({ lang }),
    }),
    { name: 'mnb-lang' },
  ),
);
