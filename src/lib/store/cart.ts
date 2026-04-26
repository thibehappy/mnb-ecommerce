'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BraceletConfig, CartLine, Kit } from '@/types';
import { KIT_BY_ID } from '@/lib/mocks/kits';
import { uid } from '@/lib/utils/format';

interface CartState {
  lines: CartLine[];
  isOpen: boolean;
  addKit: (kit: Kit, quantity?: number) => void;
  addCustom: (config: BraceletConfig, quantity?: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  remove: (lineId: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,
      addKit: (kit, quantity = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (l) => l.kind === 'kit' && l.kitId === kit.id,
          );
          if (existing && existing.kind === 'kit') {
            return {
              lines: state.lines.map((l) =>
                l.lineId === existing.lineId ? { ...l, quantity: l.quantity + quantity } : l,
              ),
              isOpen: true,
            };
          }
          return {
            lines: [
              ...state.lines,
              { lineId: uid('line'), kind: 'kit', kitId: kit.id, quantity },
            ],
            isOpen: true,
          };
        }),
      addCustom: (config, quantity = 1) =>
        set((state) => ({
          lines: [
            ...state.lines,
            { lineId: uid('line'), kind: 'custom', config, quantity },
          ],
          isOpen: true,
        })),
      updateQuantity: (lineId, quantity) =>
        set((state) => ({
          lines: state.lines
            .map((l) => (l.lineId === lineId ? { ...l, quantity: Math.max(1, quantity) } : l))
            .filter((l) => l.quantity > 0),
        })),
      remove: (lineId) =>
        set((state) => ({ lines: state.lines.filter((l) => l.lineId !== lineId) })),
      clear: () => set({ lines: [] }),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
    }),
    {
      name: 'mnb-cart',
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

export function subtotalForLine(line: CartLine): number {
  if (line.kind === 'kit') {
    const kit = KIT_BY_ID[line.kitId];
    return (kit?.price ?? 0) * line.quantity;
  }
  return line.config.price * line.quantity;
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + subtotalForLine(l), 0);
}

export function cartShipping(subtotal: number): number {
  if (subtotal === 0) return 0;
  if (subtotal >= 60) return 0;
  return 4.9;
}

export function cartTotal(lines: CartLine[]): number {
  const subtotal = cartSubtotal(lines);
  return subtotal + cartShipping(subtotal);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((acc, l) => acc + l.quantity, 0);
}
