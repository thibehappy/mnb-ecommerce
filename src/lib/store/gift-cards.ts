'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BraceletConfig, GiftCard } from '@/types';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { generateGiftCode } from '@/lib/utils/gift-code';

/**
 * Front-end mock of the gift-card system.
 *
 * In a real app the codes would be allocated server-side at payment time and
 * the store would only mirror cards the current browser has interacted with
 * (created or redeemed). For the demo we keep the full registry in
 * localStorage so a sender can hand off a code to a recipient on the same
 * machine and the recipient's browser instantly recognises it.
 *
 * Persistence intentionally short-circuits the typical confidentiality of a
 * real gift card — anyone with devtools can read every code created on this
 * device. Documented and accepted for the prototype.
 */

interface CreateDesignedGiftInput {
  design: BraceletConfig;
  senderName?: string;
  recipientName?: string;
  message?: string;
}

interface CreateOpenGiftInput {
  atelierId: string;
  senderName?: string;
  recipientName?: string;
  message?: string;
}

interface GiftCardsState {
  cards: GiftCard[];
  /** Code of the gift the recipient is currently redeeming (loaded into the
   *  configurator). null when no redemption is in progress. Survives reloads
   *  via persist so a recipient can come back to finish their tweak. */
  activeRedemptionCode: string | null;
  /** Mint a designed gift card from a finalised bracelet config. The amount
   *  is taken from `design.price`. Code is unique against existing cards. */
  createDesignedGift: (input: CreateDesignedGiftInput) => GiftCard;
  /** Mint an open gift card scoped to a specific atelier. The amount is the
   *  atelier's posted price. */
  createOpenGift: (input: CreateOpenGiftInput) => GiftCard;
  /** Lookup a card by its canonical code. Returns undefined when missing. */
  getByCode: (code: string) => GiftCard | undefined;
  /** Mark a card as opened by the recipient (idempotent). */
  markViewed: (code: string) => void;
  /** Mark a card as fully redeemed. After this the card is "spent" and the
   *  recipient can't tweak the design anymore. Also clears any active
   *  redemption pointing to this code. */
  markRedeemed: (code: string) => void;
  /** Update the bracelet design on a designed gift card — used when the
   *  recipient tweaks the bracelet before confirming. No-op for open gifts
   *  or already-redeemed cards. */
  updateDesignedGift: (code: string, design: BraceletConfig) => void;
  /** Begin a redemption flow — sets activeRedemptionCode so the
   *  configurator UI knows it's being used in gift-redemption mode. */
  beginRedemption: (code: string) => void;
  /** Drop the active redemption pointer (recipient cancelled / left the
   *  flow). Doesn't remove the card itself. */
  endRedemption: () => void;
  /** Permanently remove a card from the local registry. */
  remove: (code: string) => void;
}

function freshCode(existing: GiftCard[]): string {
  // Avoid collisions in the local registry. The probability is astronomically
  // low for a single-user demo but the loop costs nothing.
  const taken = new Set(existing.map((card) => card.code));
  for (let i = 0; i < 8; i++) {
    const candidate = generateGiftCode();
    if (!taken.has(candidate)) return candidate;
  }
  // Extreme fallback — append a random suffix.
  return `${generateGiftCode()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export const useGiftCards = create<GiftCardsState>()(
  persist(
    (set, get) => ({
      cards: [],
      activeRedemptionCode: null,

      createDesignedGift: ({ design, senderName, recipientName, message }) => {
        const card: GiftCard = {
          code: freshCode(get().cards),
          kind: 'designed',
          status: 'pending',
          design,
          atelierId: design.atelierId,
          amount: design.price,
          senderName: senderName?.trim() || undefined,
          recipientName: recipientName?.trim() || undefined,
          message: message?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [card, ...state.cards] }));
        return card;
      },

      createOpenGift: ({ atelierId, senderName, recipientName, message }) => {
        const atelier = ATELIER_BY_ID[atelierId];
        const card: GiftCard = {
          code: freshCode(get().cards),
          kind: 'open',
          status: 'pending',
          atelierId,
          amount: atelier?.price ?? 0,
          senderName: senderName?.trim() || undefined,
          recipientName: recipientName?.trim() || undefined,
          message: message?.trim() || undefined,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ cards: [card, ...state.cards] }));
        return card;
      },

      getByCode: (code) => get().cards.find((card) => card.code === code),

      markViewed: (code) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.code === code && card.status === 'pending'
              ? { ...card, status: 'viewed', viewedAt: new Date().toISOString() }
              : card,
          ),
        })),

      markRedeemed: (code) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.code === code && card.status !== 'redeemed'
              ? { ...card, status: 'redeemed', redeemedAt: new Date().toISOString() }
              : card,
          ),
          activeRedemptionCode:
            state.activeRedemptionCode === code ? null : state.activeRedemptionCode,
        })),

      updateDesignedGift: (code, design) =>
        set((state) => ({
          cards: state.cards.map((card) =>
            card.code === code && card.kind === 'designed' && card.status !== 'redeemed'
              ? { ...card, design, amount: design.price, atelierId: design.atelierId }
              : card,
          ),
        })),

      beginRedemption: (code) => set({ activeRedemptionCode: code }),
      endRedemption: () => set({ activeRedemptionCode: null }),

      remove: (code) =>
        set((state) => ({
          cards: state.cards.filter((card) => card.code !== code),
          activeRedemptionCode:
            state.activeRedemptionCode === code ? null : state.activeRedemptionCode,
        })),
    }),
    {
      name: 'mnb-gift-cards-v1',
      partialize: (state) => ({
        cards: state.cards,
        activeRedemptionCode: state.activeRedemptionCode,
      }),
    },
  ),
);

/** Format the gift code for display: `MNB-AB12-CD34`. */
export function displayGiftCode(card: GiftCard): string {
  return card.code;
}
