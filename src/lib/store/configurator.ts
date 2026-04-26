'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Bead, BraceletComponent, BraceletConfig, Charm, SizeLabel } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { ATELIER_BY_ID, ATELIERS } from '@/lib/mocks/ateliers';
import { uid } from '@/lib/utils/format';
import { inspire, type Mood } from '@/lib/harmony/rules';

export type ConfiguratorStep = 'atelier' | 'beads' | 'charms';

interface ConfiguratorState {
  /** Selected atelier (bracelet recipe) */
  atelierId: string;
  /** Selected size within that atelier */
  sizeLabel: SizeLabel;
  components: BraceletComponent[];
  step: ConfiguratorStep;
  selectedComponent: string | null;
  savedDesigns: BraceletConfig[];

  setAtelier: (atelierId: string) => void;
  setSize: (label: SizeLabel) => void;
  addBead: (beadId: string) => void;
  addCharm: (charmId: string) => void;
  /** Insert a bead at a specific position (used by drag-from-palette) */
  insertBead: (beadId: string, atIdx: number) => void;
  /** Insert a charm at a specific position (used by drag-from-palette) */
  insertCharm: (charmId: string, atIdx: number) => void;
  removeComponent: (slotId: string) => void;
  /** Replace the components array (used by drag-and-drop reorder) */
  reorderComponents: (next: BraceletComponent[]) => void;
  /** Move a component by slotId left (-1) or right (+1) in the order */
  moveByDelta: (slotId: string, delta: -1 | 1) => void;
  clearComponents: () => void;
  select: (slotId: string | null) => void;
  setStep: (step: ConfiguratorStep) => void;
  applyInspired: (mood?: Mood) => Mood;
  reset: () => void;
  save: (title: string) => BraceletConfig;
  loadDesign: (id: string) => void;
  deleteDesign: (id: string) => void;
}

// Pin default to the classic atelier regardless of display order in the array
const DEFAULT_ATELIER =
  ATELIERS.find((a) => a.id === 'atelier_bracelet_bar')?.id ?? ATELIERS[0]!.id;
const DEFAULT_SIZE: SizeLabel = 'M';

/** Resolve the fixed price from current atelier (same price for all sizes) */
export function priceOf(atelierId: string, _sizeLabel: SizeLabel): number {
  const atelier = ATELIER_BY_ID[atelierId];
  return atelier?.price ?? 0;
}

/** Resolve the fixed sizeCm from current atelier + size */
export function sizeCmOf(atelierId: string, sizeLabel: SizeLabel): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 17;
  const size = atelier.sizes.find((s) => s.label === sizeLabel);
  return size?.cm ?? atelier.sizes[0]!.cm;
}

export const useConfigurator = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      atelierId: DEFAULT_ATELIER,
      sizeLabel: DEFAULT_SIZE,
      components: [],
      step: 'atelier',
      selectedComponent: null,
      savedDesigns: [],

      setAtelier: (atelierId) => {
        // Switching atelier purges components that are no longer allowed
        const nextAtelier = ATELIER_BY_ID[atelierId];
        if (!nextAtelier) return set({ atelierId });
        set((state) => {
          const filtered = state.components.filter((c) => {
            if (c.kind === 'bead') {
              const bead = BEAD_BY_ID[c.refId];
              return bead ? nextAtelier.allowedBeadFamilies.includes(bead.family) : false;
            }
            const charm = CHARM_BY_ID[c.refId];
            return charm ? nextAtelier.allowedCharmCategories.includes(charm.category) : false;
          });
          return { atelierId, components: filtered };
        });
      },

      setSize: (sizeLabel) => set({ sizeLabel }),

      addBead: (beadId) =>
        set((state) => {
          const atelier = ATELIER_BY_ID[state.atelierId];
          if (!atelier) return state;
          const beadsCount = state.components.filter((c) => c.kind === 'bead').length;
          // Block if already at fixed count
          if (beadsCount >= atelier.beadCount) return state;
          return {
            components: [
              ...state.components,
              { slotId: uid('s'), kind: 'bead', refId: beadId },
            ],
          };
        }),

      addCharm: (charmId) =>
        set((state) => {
          const atelier = ATELIER_BY_ID[state.atelierId];
          if (!atelier || !atelier.allowCharms) return state;
          const charmsCount = state.components.filter((c) => c.kind === 'charm').length;
          if (charmsCount >= atelier.maxCharms) return state;
          return {
            components: [
              ...state.components,
              { slotId: uid('s'), kind: 'charm', refId: charmId },
            ],
          };
        }),

      insertBead: (beadId, atIdx) =>
        set((state) => {
          const atelier = ATELIER_BY_ID[state.atelierId];
          if (!atelier) return state;
          const beadsCount = state.components.filter((c) => c.kind === 'bead').length;
          if (beadsCount >= atelier.beadCount) return state;
          const next = [...state.components];
          const idx = Math.max(0, Math.min(atIdx, next.length));
          next.splice(idx, 0, { slotId: uid('s'), kind: 'bead', refId: beadId });
          return { components: next };
        }),

      insertCharm: (charmId, atIdx) =>
        set((state) => {
          const atelier = ATELIER_BY_ID[state.atelierId];
          if (!atelier?.allowCharms) return state;
          const charmsCount = state.components.filter((c) => c.kind === 'charm').length;
          if (charmsCount >= atelier.maxCharms) return state;
          const next = [...state.components];
          const idx = Math.max(0, Math.min(atIdx, next.length));
          next.splice(idx, 0, { slotId: uid('s'), kind: 'charm', refId: charmId });
          return { components: next };
        }),

      removeComponent: (slotId) =>
        set((state) => ({
          components: state.components.filter((c) => c.slotId !== slotId),
          selectedComponent:
            state.selectedComponent === slotId ? null : state.selectedComponent,
        })),

      reorderComponents: (next) => set({ components: next }),

      moveByDelta: (slotId, delta) =>
        set((state) => {
          const idx = state.components.findIndex((c) => c.slotId === slotId);
          if (idx === -1) return state;
          const target = idx + delta;
          if (target < 0 || target >= state.components.length) return state;
          const next = [...state.components];
          const [moved] = next.splice(idx, 1);
          if (!moved) return state;
          next.splice(target, 0, moved);
          return { components: next };
        }),

      clearComponents: () => set({ components: [], selectedComponent: null }),

      select: (slotId) => set({ selectedComponent: slotId }),

      setStep: (step) => set({ step }),

      applyInspired: (mood) => {
        const state = get();
        const atelier = ATELIER_BY_ID[state.atelierId];
        const result = inspire(mood, {
          beadCount: atelier?.beadCount,
          allowedBeadFamilies: atelier?.allowedBeadFamilies,
          allowedCharmCategories: atelier?.allowedCharmCategories,
          allowCharms: atelier?.allowCharms ?? true,
        });
        set({ components: result.components, selectedComponent: null });
        return result.mood;
      },

      reset: () =>
        set({
          atelierId: DEFAULT_ATELIER,
          sizeLabel: DEFAULT_SIZE,
          components: [],
          step: 'atelier',
          selectedComponent: null,
        }),

      save: (title) => {
        const state = get();
        const design: BraceletConfig = {
          id: uid('design'),
          atelierId: state.atelierId,
          sizeLabel: state.sizeLabel,
          sizeCm: sizeCmOf(state.atelierId, state.sizeLabel),
          components: state.components,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          title,
          price: priceOf(state.atelierId, state.sizeLabel),
        };
        set({ savedDesigns: [design, ...state.savedDesigns].slice(0, 24) });
        return design;
      },

      loadDesign: (id) => {
        const design = get().savedDesigns.find((d) => d.id === id);
        if (!design) return;
        set({
          atelierId: design.atelierId,
          sizeLabel: design.sizeLabel,
          components: design.components,
          selectedComponent: null,
          step: 'beads',
        });
      },

      deleteDesign: (id) =>
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((d) => d.id !== id),
        })),
    }),
    { name: 'mnb-configurator-v2' },
  ),
);

/** Helpers for components */
export function useConfiguratorPrice() {
  return useConfigurator((s) => priceOf(s.atelierId, s.sizeLabel));
}

export function snapshotConfig(state: ConfiguratorState, title?: string): BraceletConfig {
  const now = new Date().toISOString();
  return {
    id: uid('design'),
    atelierId: state.atelierId,
    sizeLabel: state.sizeLabel,
    sizeCm: sizeCmOf(state.atelierId, state.sizeLabel),
    components: state.components,
    createdAt: now,
    updatedAt: now,
    title,
    price: priceOf(state.atelierId, state.sizeLabel),
  };
}

export function resolveBead(id: string): Bead | undefined {
  return BEAD_BY_ID[id];
}
export function resolveCharm(id: string): Charm | undefined {
  return CHARM_BY_ID[id];
}
