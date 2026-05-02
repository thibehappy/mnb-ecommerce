'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BraceletComponent, SharedBracelet, SizeLabel } from '@/types';
import { GALLERY_SEED } from '@/lib/mocks/gallery';
import { uid } from '@/lib/utils/format';

/**
 * Public gallery of shared bracelets + lightweight voting.
 *
 * In a real product, votes would be backed by accounts / cookies. For the
 * demo every device persists its own vote map in localStorage, which means :
 *   - You can't vote twice on the same bracelet from this device.
 *   - Switching device "resets" what you've voted on, but the vote totals
 *     persist (they live alongside the bracelets).
 *
 * Seed data comes from `mocks/gallery.ts` so the page is never empty on a
 * fresh install. We only seed when the persisted store is empty, so user
 * publications aren't overwritten on reload.
 */

type VoteDirection = 'up' | 'down';

interface PublishInput {
  title: string;
  creator?: string;
  atelierId: string;
  sizeCm: number;
  sizeLabel: SizeLabel;
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
}

interface GalleryState {
  items: SharedBracelet[];
  /** Per-bracelet vote cast on this device. Used to prevent double-voting
   *  and to drive the active state of the up/down buttons. */
  myVotes: Record<string, VoteDirection>;
  publish: (input: PublishInput) => SharedBracelet;
  vote: (id: string, direction: VoteDirection) => void;
  remove: (id: string) => void;
}

export const useGallery = create<GalleryState>()(
  persist(
    (set) => ({
      items: GALLERY_SEED,
      myVotes: {},

      publish: (input) => {
        const entry: SharedBracelet = {
          id: uid('share'),
          title: input.title.trim() || 'Ma création',
          creator: input.creator?.trim() || undefined,
          atelierId: input.atelierId,
          sizeCm: input.sizeCm,
          sizeLabel: input.sizeLabel,
          // Re-key components so the gallery item is independent of the
          // configurator's slot ids (which would otherwise change on edit).
          components: input.components.map((c) => ({
            slotId: uid('share-slot'),
            kind: c.kind,
            refId: c.refId,
          })),
          figurine: input.figurine
            ? {
                slotId: uid('share-fig'),
                kind: input.figurine.kind,
                refId: input.figurine.refId,
              }
            : null,
          votesUp: 0,
          votesDown: 0,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ items: [entry, ...state.items] }));
        return entry;
      },

      vote: (id, direction) =>
        set((state) => {
          const previous = state.myVotes[id];
          // Toggle off if user clicks the same direction twice.
          const nextDirection = previous === direction ? null : direction;

          const items = state.items.map((entry) => {
            if (entry.id !== id) return entry;
            let votesUp = entry.votesUp;
            let votesDown = entry.votesDown;
            // Withdraw the previous vote (if any) before applying the new one.
            if (previous === 'up') votesUp = Math.max(0, votesUp - 1);
            if (previous === 'down') votesDown = Math.max(0, votesDown - 1);
            if (nextDirection === 'up') votesUp += 1;
            if (nextDirection === 'down') votesDown += 1;
            return { ...entry, votesUp, votesDown };
          });

          const myVotes = { ...state.myVotes };
          if (nextDirection) {
            myVotes[id] = nextDirection;
          } else {
            delete myVotes[id];
          }

          return { items, myVotes };
        }),

      remove: (id) =>
        set((state) => {
          const myVotes = { ...state.myVotes };
          delete myVotes[id];
          return { items: state.items.filter((entry) => entry.id !== id), myVotes };
        }),
    }),
    {
      name: 'mnb-gallery-v1',
      // Persist both the items (so user publications survive reloads) and
      // the vote map (so the user keeps their UI state).
      partialize: (state) => ({ items: state.items, myVotes: state.myVotes }),
    },
  ),
);

/** Score derived from up / down votes — used as the default sort key. */
export function score(entry: SharedBracelet): number {
  return entry.votesUp - entry.votesDown;
}

/** Sort the gallery items in-place fashion: by score desc, then most recent. */
export function sortByScore(items: SharedBracelet[]): SharedBracelet[] {
  return [...items].sort((a, b) => {
    const diff = score(b) - score(a);
    if (diff !== 0) return diff;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/** Sort by createdAt desc — used for the "latest" tab. */
export function sortByRecent(items: SharedBracelet[]): SharedBracelet[] {
  return [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
