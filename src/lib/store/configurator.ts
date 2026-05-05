'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Bead,
  BraceletComponent,
  BraceletConfig,
  Charm,
  FulfillmentMode,
  SizeLabel,
} from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import {
  CHAIN_BY_ID,
  CHAINS,
  CLASP_BY_ID,
  CLASPS,
  DEFAULT_CHAIN_ID,
  DEFAULT_CLASP_ID,
} from '@/lib/mocks/attachments';
import { ATELIER_BY_ID, ATELIERS } from '@/lib/mocks/ateliers';
import { uid } from '@/lib/utils/format';
import { inspire, type Mood } from '@/lib/harmony/rules';

export type ConfiguratorStep = 'atelier' | 'beads' | 'stones' | 'charms';
export type SizeFitStatus = 'empty' | 'too-short' | 'ready' | 'too-long';

export interface SizeFit {
  status: SizeFitStatus;
  lengthMm: number;
  targetMm: number;
  minMm: number;
  maxMm: number;
  remainingMm: number;
  overflowMm: number;
  deltaMm: number;
}

export interface SharedBraceletDesign {
  atelierId: string;
  sizeCm: number;
  sizeLabel: SizeLabel;
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  /** Kawaii attachment system — only meaningful when `figurine` exists. */
  figurineChainId?: string | null;
  figurineClaspId?: string | null;
  title?: string;
  intention?: string;
}

/**
 * Per-atelier "scratch pad" stashed when the user navigates away from
 * an atelier so we can restore exactly where they left off when they
 * come back. Only the user-editable bits — the rest (step, selection,
 * drag state, …) is intentionally re-initialized on switch.
 */
export interface AtelierStash {
  components: BraceletComponent[];
  figurine: BraceletComponent | null;
  sizeCm: number;
  sizeLabel: SizeLabel;
  draftTitle: string;
  draftIntention: string;
  /** Kawaii attachment ids — chain + clasp linking the figurine to
   *  the bracelet wire. Both null/undefined for non-Kawaii ateliers. */
  figurineChainId: string | null;
  figurineClaspId: string | null;
}

interface ConfiguratorState {
  atelierId: string;
  /** Source of truth for size in cm. Snaps to atelier presets via setSize, or
   *  freely adjustable via adjustSize (0.5 cm increments). Only meaningful
   *  for ateliers with sizing.mode === 'user-pick'. */
  sizeCm: number;
  /** Either a preset label or 'custom' when sizeCm doesn't match any preset. */
  sizeLabel: SizeLabel;
  /** Dense ordered list of components strung on the cord. The total length
   *  (sum of sizeMm) must respect the atelier's sizing rules :
   *    - user-pick : <= sizeCm * 10 + slackMm
   *    - fixed-range : <= maxMm */
  components: BraceletComponent[];
  /**
   * Figurine attached to the bracelet (Kawaii only). Stored OUTSIDE
   * `components` because it doesn't sit on the cord — it dangles next to
   * the bracelet (rendered as a side decoration in BraceletPreview).
   * Slot id is generated when set, used as a stable React key + selectable
   * target for the click-to-remove flow.
   */
  figurine: BraceletComponent | null;
  /**
   * Kawaii attachment system — these only carry visual / catalogue
   * meaning when the atelier is Kawaii AND `figurine` is non-null.
   * The user can still set them ahead of time (e.g. switch chain
   * colour without a figurine yet selected) — the renderer just
   * waits for the figurine to surface them.
   *
   *   - figurineChainId  : id of an `AttachmentChain` (small ball-chain)
   *   - figurineClaspId  : id of an `AttachmentClasp` (snap ring/heart)
   *
   * Default to `DEFAULT_CHAIN_ID` / `DEFAULT_CLASP_ID` so picking a
   * figurine renders something sensible without forcing the user to
   * touch the attachment pickers.
   */
  figurineChainId: string;
  figurineClaspId: string;
  step: ConfiguratorStep;
  selectedComponent: string | null;
  savedDesigns: BraceletConfig[];
  draftTitle: string;
  draftIntention: string;
  /**
   * Stashed state of the OTHER ateliers — populated on `setAtelier`
   * when the user leaves an atelier mid-composition. Switching back
   * restores from this map ; the entry for the currently-active
   * atelier is irrelevant (the live state is the source of truth)
   * and is overwritten on the next switch out.
   *
   * `reset` clears the whole stash — that action is the user
   * explicitly asking for a clean slate.
   */
  ateliersStash: Record<string, AtelierStash>;

  setAtelier: (atelierId: string) => void;
  /** Pick a preset label. The cm + label snap together. */
  setSize: (label: SizeLabel) => void;
  /** Set an exact cm (used by the +/- stepper and the "custom" button). */
  setSizeCm: (cm: number) => void;
  /** Increment / decrement the cm by ±0.5. */
  adjustSize: (delta: number) => void;
  /** Insert a bead at a given index (clamped to 0..length). Honors length budget. */
  insertBeadAt: (beadId: string, idx: number) => void;
  /** Insert a charm at a given index. Respects maxCharms cap + length budget. */
  insertCharmAt: (charmId: string, idx: number) => void;
  /** Append a bead at the end (palette quick-add). */
  addBead: (beadId: string) => void;
  /** Append a charm at the end. */
  addCharm: (charmId: string) => void;
  /** Set / replace / clear the figurine attached to the bracelet (Kawaii). */
  setFigurine: (charmId: string | null) => void;
  /** Pick the chain colour linking the figurine to the bracelet (Kawaii). */
  setFigurineChain: (chainId: string) => void;
  /** Pick the snap-ring/heart clasp the chain hooks onto (Kawaii). */
  setFigurineClasp: (claspId: string) => void;
  /** Remove the component at the given index (splice). */
  removeAt: (idx: number) => void;
  /** Remove by slotId (used when click → trash on a selected component). */
  removeComponent: (slotId: string) => void;
  /** Move the component at index `from` to index `to` (drag-to-reorder). */
  moveComponent: (from: number, to: number) => void;
  /** Toggle the 180° flip flag of a single component (by slotId). */
  toggleFlip: (slotId: string) => void;
  /** Replace the entire components list (used by Inspire-moi). */
  replaceComponents: (next: BraceletComponent[]) => void;
  clearComponents: () => void;
  select: (slotId: string | null) => void;
  setStep: (step: ConfiguratorStep) => void;
  setDraftMeta: (title?: string, intention?: string) => void;
  applyInspired: (mood?: Mood) => Mood;
  reset: () => void;
  save: (title: string, intention?: string) => BraceletConfig;
  loadSharedDesign: (design: SharedBraceletDesign) => void;
  loadDesign: (id: string) => void;
  deleteDesign: (id: string) => void;
}

const DEFAULT_ATELIER = ATELIERS.find((a) => a.id === 'atelier_classique')?.id ?? ATELIERS[0]!.id;
const DEFAULT_SIZE: SizeLabel = 'M';
export const USER_PICK_FIT_TOLERANCE_MM = 3;

/* ────────────────────────────────────────────────────────────────
   Length & budget helpers
─────────────────────────────────────────────────────────────── */

/** Lookup the mm contribution of a single component (bead or charm). */
export function sizeMmOf(comp: BraceletComponent): number {
  if (comp.kind === 'bead') return BEAD_BY_ID[comp.refId]?.sizeMm ?? 0;
  return CHARM_BY_ID[comp.refId]?.sizeMm ?? 0;
}

/** Sum of sizeMm across all components — total cord length consumed. */
export function totalLengthMm(components: BraceletComponent[]): number {
  let total = 0;
  for (const c of components) total += sizeMmOf(c);
  return total;
}

/**
 * Target circumference (in mm) the bracelet aims for.
 *   - user-pick   : sizeCm * 10
 *   - fixed-range : the maxMm (the longest the bracelet can reach)
 *
 * For visual rendering, this is the value the path SVG represents — beads
 * scale relative to it.
 */
export function targetMm(atelierId: string, sizeCm: number): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 170;
  if (atelier.sizing.mode === 'fixed-range') return atelier.sizing.maxMm;
  return Math.round(sizeCm * 10);
}

/**
 * Smallest valid circumference for the atelier (in mm).
 *   - user-pick   : sizeCm * 10  (no flexibility, target == min)
 *   - fixed-range : minMm
 */
export function minMmOf(atelierId: string, sizeCm: number): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 170;
  if (atelier.sizing.mode === 'fixed-range') return atelier.sizing.minMm;
  return Math.round(sizeCm * 10);
}

/**
 * Maximum circumference the bracelet can reach (in mm), accounting for slack.
 *   - user-pick   : sizeCm * 10 + slackMm
 *   - fixed-range : maxMm + slackMm
 */
export function maxMmOf(atelierId: string, sizeCm: number): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 170;
  if (atelier.sizing.mode === 'fixed-range') return atelier.sizing.maxMm + atelier.slackMm;
  return Math.round(sizeCm * 10) + atelier.slackMm;
}

export function minAllowedMmOf(atelierId: string, sizeCm: number): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 170 - USER_PICK_FIT_TOLERANCE_MM;
  if (atelier.sizing.mode === 'fixed-range') return atelier.sizing.minMm;
  return Math.max(0, Math.round(sizeCm * 10) - USER_PICK_FIT_TOLERANCE_MM);
}

export function maxAllowedMmOf(atelierId: string, sizeCm: number): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 170 + USER_PICK_FIT_TOLERANCE_MM;
  if (atelier.sizing.mode === 'fixed-range') return atelier.sizing.maxMm + atelier.slackMm;
  return Math.round(sizeCm * 10) + atelier.slackMm + USER_PICK_FIT_TOLERANCE_MM;
}

export function getSizeFit(
  atelierId: string,
  sizeCm: number,
  components: BraceletComponent[],
): SizeFit {
  const lengthMm = totalLengthMm(components);
  const target = targetMm(atelierId, sizeCm);
  const min = minAllowedMmOf(atelierId, sizeCm);
  const max = maxAllowedMmOf(atelierId, sizeCm);
  const epsilon = 0.0001;
  const status: SizeFitStatus =
    components.length === 0
      ? 'empty'
      : lengthMm < min - epsilon
        ? 'too-short'
        : lengthMm > max + epsilon
          ? 'too-long'
          : 'ready';

  return {
    status,
    lengthMm,
    targetMm: target,
    minMm: min,
    maxMm: max,
    remainingMm: Math.max(0, min - lengthMm),
    overflowMm: Math.max(0, lengthMm - max),
    deltaMm: lengthMm - target,
  };
}

/** Can we still fit `addedMm` more on the bracelet ? */
export function canFit(
  atelierId: string,
  sizeCm: number,
  components: BraceletComponent[],
  addedMm: number,
): boolean {
  const limit = maxAllowedMmOf(atelierId, sizeCm);
  return totalLengthMm(components) + addedMm <= limit + 0.0001;
}

/* ────────────────────────────────────────────────────────────────
   Pricing
─────────────────────────────────────────────────────────────── */

/**
 * Fallback per-charm fee (€) for a charm placed BEYOND the atelier's
 * included count when that charm doesn't declare its own `extraFee` in
 * the catalogue. Different charms can override this with their own
 * value (Tour Eiffel +1 €, médaille gravée +3 €, …).
 *
 * The first `atelier.maxCharms` charms always ride free with the
 * bracelet price ; only the surplus is billed.
 */
export const DEFAULT_EXTRA_CHARM_FEE = 1;

/** How many charms exceed the atelier's included `maxCharms` (≥ 0). */
export function extraCharmsCount(atelierId: string, components: BraceletComponent[]): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 0;
  const onCord = components.filter((c) => c.kind === 'charm').length;
  return Math.max(0, onCord - atelier.maxCharms);
}

/**
 * Surcharge (€) for charms beyond the atelier's included count.
 *
 * The first `maxCharms` charms (in cord order) are free ; the rest are
 * billed at each charm's own `extraFee`, falling back to
 * `DEFAULT_EXTRA_CHARM_FEE` when undefined.
 *
 * Cord order is used (not insertion order) so the breakdown stays
 * stable when the user reorders the bracelet — the visible "later"
 * charms are the surplus.
 */
export function extraCharmsFee(atelierId: string, components: BraceletComponent[]): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 0;
  const charmComponents = components.filter((c) => c.kind === 'charm');
  if (charmComponents.length <= atelier.maxCharms) return 0;
  const surplus = charmComponents.slice(atelier.maxCharms);
  let total = 0;
  for (const c of surplus) {
    const charm = CHARM_BY_ID[c.refId];
    total += charm?.extraFee ?? DEFAULT_EXTRA_CHARM_FEE;
  }
  return total;
}

/**
 * Resolve the bracelet price :
 *   base = atelier price (forfaitaire, identique quelle que soit la taille)
 * + surcharge sum from any placed charm in the cord (Classique)
 * + per-charm `extraFee` for each charm beyond atelier.maxCharms (see above)
 * + surcharge of the attached figurine if any (Kawaii)
 *   (typically +6€ for Sanrio / Disney licensed figurines).
 */
export function priceOf(
  atelierId: string,
  _sizeLabel: SizeLabel,
  components?: BraceletComponent[],
  figurine?: BraceletComponent | null,
): number {
  const atelier = ATELIER_BY_ID[atelierId];
  let total = atelier?.price ?? 0;
  if (components) {
    for (const c of components) {
      if (c.kind !== 'charm') continue;
      const charm = CHARM_BY_ID[c.refId];
      if (charm?.surcharge) total += charm.surcharge;
    }
    total += extraCharmsFee(atelierId, components);
  }
  if (figurine) {
    const charm = CHARM_BY_ID[figurine.refId];
    if (charm?.surcharge) total += charm.surcharge;
  }
  return total;
}

/* ────────────────────────────────────────────────────────────────
   Sizing helpers
─────────────────────────────────────────────────────────────── */

export function sizeCmOf(atelierId: string, sizeLabel: SizeLabel): number {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 17;
  if (atelier.sizes.length === 0) {
    // fixed-range : derive a "reasonable" cm from the range midpoint
    if (atelier.sizing.mode === 'fixed-range') {
      return (atelier.sizing.minMm + atelier.sizing.maxMm) / 20; // mm → cm midpoint
    }
    return 17;
  }
  const size = atelier.sizes.find((s) => s.label === sizeLabel);
  return size?.cm ?? atelier.sizes[0]!.cm;
}

/** Allowed cm range for the custom-size stepper (Bracelet Bar / Classique). */
export const SIZE_CM_MIN = 13;
export const SIZE_CM_MAX = 22;
export const SIZE_CM_STEP = 0.5;

function clampCm(cm: number): number {
  const snapped = Math.round(cm / SIZE_CM_STEP) * SIZE_CM_STEP;
  return Math.max(SIZE_CM_MIN, Math.min(SIZE_CM_MAX, snapped));
}

/** Derive the matching SizeLabel ('S'|'M'|'L') for the current cm, else 'custom'. */
export function deriveSizeLabel(atelierId: string, sizeCm: number): SizeLabel {
  const atelier = ATELIER_BY_ID[atelierId];
  if (!atelier) return 'custom';
  const match = atelier.sizes.find((s) => s.cm === sizeCm);
  return (match?.label as SizeLabel) ?? 'custom';
}

/* ────────────────────────────────────────────────────────────────
   Store
─────────────────────────────────────────────────────────────── */

export const useConfigurator = create<ConfiguratorState>()(
  persist(
    (set, get) => ({
      atelierId: DEFAULT_ATELIER,
      sizeCm: sizeCmOf(DEFAULT_ATELIER, DEFAULT_SIZE),
      sizeLabel: DEFAULT_SIZE,
      components: [],
      figurine: null,
      figurineChainId: DEFAULT_CHAIN_ID,
      figurineClaspId: DEFAULT_CLASP_ID,
      step: 'beads',
      selectedComponent: null,
      savedDesigns: [],
      draftTitle: '',
      draftIntention: '',
      ateliersStash: {},

      setAtelier: (atelierId) => {
        const next = ATELIER_BY_ID[atelierId];
        if (!next) return set({ atelierId });
        const state = get();
        // Same atelier clicked again : nothing to stash, nothing to restore.
        if (state.atelierId === atelierId) return;

        // Snapshot the current atelier's composition so the user can
        // come back to it untouched. We always overwrite — the live
        // state is the source of truth for the atelier we're leaving.
        const stash: Record<string, AtelierStash> = {
          ...(state.ateliersStash ?? {}),
          [state.atelierId]: {
            components: state.components,
            figurine: state.figurine,
            sizeCm: state.sizeCm,
            sizeLabel: state.sizeLabel,
            draftTitle: state.draftTitle,
            draftIntention: state.draftIntention,
            figurineChainId: state.figurineChainId,
            figurineClaspId: state.figurineClaspId,
          },
        };

        // If we have a stash for the target atelier, restore it as-is.
        // Otherwise start fresh : each first-visit gets a clean canvas.
        const restored = stash[atelierId];
        if (restored) {
          set({
            atelierId,
            components: restored.components,
            figurine: restored.figurine,
            sizeCm: restored.sizeCm,
            sizeLabel: restored.sizeLabel,
            draftTitle: restored.draftTitle,
            draftIntention: restored.draftIntention,
            figurineChainId: restored.figurineChainId ?? DEFAULT_CHAIN_ID,
            figurineClaspId: restored.figurineClaspId ?? DEFAULT_CLASP_ID,
            selectedComponent: null,
            ateliersStash: stash,
          });
        } else {
          const nextSizeCm = sizeCmOf(atelierId, 'M');
          set({
            atelierId,
            components: [],
            figurine: null,
            sizeCm: nextSizeCm,
            sizeLabel: deriveSizeLabel(atelierId, nextSizeCm),
            selectedComponent: null,
            draftTitle: '',
            draftIntention: '',
            // Fresh atelier = catalogue defaults for the attachments
            // (only consumed visually when atelier is Kawaii anyway).
            figurineChainId: DEFAULT_CHAIN_ID,
            figurineClaspId: DEFAULT_CLASP_ID,
            ateliersStash: stash,
          });
        }
      },

      setSize: (label) =>
        set((state) => {
          if (label === 'custom') return { sizeLabel: 'custom' };
          const cm = sizeCmOf(state.atelierId, label);
          return { sizeCm: cm, sizeLabel: label };
        }),

      setSizeCm: (cm) =>
        set((state) => {
          const c = clampCm(cm);
          return { sizeCm: c, sizeLabel: deriveSizeLabel(state.atelierId, c) };
        }),

      adjustSize: (delta) =>
        set((state) => {
          const c = clampCm(state.sizeCm + delta);
          return { sizeCm: c, sizeLabel: 'custom' };
        }),

      insertBeadAt: (beadId, idx) =>
        set((state) => {
          const bead = BEAD_BY_ID[beadId];
          if (!bead) return state;
          if (!canFit(state.atelierId, state.sizeCm, state.components, bead.sizeMm)) return state;
          const clamped = Math.max(0, Math.min(idx, state.components.length));
          const next = [...state.components];
          next.splice(clamped, 0, { slotId: uid('s'), kind: 'bead', refId: beadId });
          return { components: next };
        }),

      insertCharmAt: (charmId, idx) =>
        set((state) => {
          const atelier = ATELIER_BY_ID[state.atelierId];
          if (!atelier?.allowCharms) return state;
          const charm = CHARM_BY_ID[charmId];
          if (!charm) return state;
          // No hard count cap — charms beyond `atelier.maxCharms` are
          // allowed and each one adds its own `extraFee` to the price
          // (catalogue-defined, fallback DEFAULT_EXTRA_CHARM_FEE — see
          // extraCharmsFee in priceOf). The cord-length budget is the
          // only structural cap.
          if (!canFit(state.atelierId, state.sizeCm, state.components, charm.sizeMm)) return state;
          const clamped = Math.max(0, Math.min(idx, state.components.length));
          const next = [...state.components];
          next.splice(clamped, 0, { slotId: uid('s'), kind: 'charm', refId: charmId });
          return { components: next };
        }),

      addBead: (beadId) => {
        const state = get();
        get().insertBeadAt(beadId, state.components.length);
      },

      addCharm: (charmId) => {
        const state = get();
        get().insertCharmAt(charmId, state.components.length);
      },

      setFigurine: (charmId) =>
        set((state) => {
          if (charmId === null) {
            return {
              figurine: null,
              selectedComponent:
                state.figurine && state.selectedComponent === state.figurine.slotId
                  ? null
                  : state.selectedComponent,
            };
          }
          const charm = CHARM_BY_ID[charmId];
          if (!charm) return state;
          return {
            figurine: { slotId: uid('s'), kind: 'charm', refId: charmId },
          };
        }),

      setFigurineChain: (chainId) =>
        set((state) => {
          // Reject unknown ids defensively — the picker passes valid
          // ids, but a stale URL or corrupted localStorage shouldn't
          // wipe the current choice.
          if (!CHAIN_BY_ID[chainId]) return state;
          return { figurineChainId: chainId };
        }),

      setFigurineClasp: (claspId) =>
        set((state) => {
          if (!CLASP_BY_ID[claspId]) return state;
          return { figurineClaspId: claspId };
        }),

      removeAt: (idx) =>
        set((state) => {
          if (idx < 0 || idx >= state.components.length) return state;
          const removed = state.components[idx]!;
          const next = state.components.filter((_, i) => i !== idx);
          return {
            components: next,
            selectedComponent:
              state.selectedComponent === removed.slotId ? null : state.selectedComponent,
          };
        }),

      removeComponent: (slotId) =>
        set((state) => {
          // Figurine slot ?
          if (state.figurine && state.figurine.slotId === slotId) {
            return {
              figurine: null,
              selectedComponent:
                state.selectedComponent === slotId ? null : state.selectedComponent,
            };
          }
          const idx = state.components.findIndex((c) => c.slotId === slotId);
          if (idx === -1) return state;
          const next = state.components.filter((_, i) => i !== idx);
          return {
            components: next,
            selectedComponent: state.selectedComponent === slotId ? null : state.selectedComponent,
          };
        }),

      toggleFlip: (slotId) =>
        set((state) => {
          const idx = state.components.findIndex((c) => c.slotId === slotId);
          if (idx === -1) return state;
          const target = state.components[idx]!;
          const next = [...state.components];
          next[idx] = { ...target, flipped: !target.flipped };
          return { components: next };
        }),

      moveComponent: (from, to) =>
        set((state) => {
          const len = state.components.length;
          if (from < 0 || from >= len) return state;
          const target = Math.max(0, Math.min(to, len - 1));
          if (target === from) return state;
          const next = [...state.components];
          const [moved] = next.splice(from, 1);
          if (!moved) return state;
          next.splice(target, 0, moved);
          return { components: next };
        }),

      replaceComponents: (next) => set({ components: next }),

      clearComponents: () => set({ components: [], figurine: null, selectedComponent: null }),

      select: (slotId) => set({ selectedComponent: slotId }),

      setStep: (step) => set({ step }),

      setDraftMeta: (title, intention) =>
        set({
          draftTitle: title ?? '',
          draftIntention: intention ?? '',
        }),

      applyInspired: (mood) => {
        const state = get();
        const atelier = ATELIER_BY_ID[state.atelierId];
        const result = inspire(mood, {
          targetMm: targetMm(state.atelierId, state.sizeCm),
          minMm: minAllowedMmOf(state.atelierId, state.sizeCm),
          maxMm: maxAllowedMmOf(state.atelierId, state.sizeCm),
          allowedBeadFamilies: atelier?.allowedBeadFamilies,
          allowedCharmCategories: atelier?.allowedCharmCategories,
          allowCharms: atelier?.allowCharms ?? true,
          maxCharms: atelier?.maxCharms,
          charmKind: atelier?.id === 'atelier_kawaii' ? 'figurine' : 'charm',
        });

        // Kawaii : also randomise the figurine attachment system so
        // each "Inspire-moi" press gives a fresh chain colour + clasp
        // shape combo, not just a fresh bead composition. Stays inert
        // for non-Kawaii ateliers (no figurine → no attachment).
        const isKawaii = atelier?.id === 'atelier_kawaii';
        const randomChainId =
          isKawaii && CHAINS.length > 0
            ? CHAINS[Math.floor(Math.random() * CHAINS.length)]!.id
            : null;
        const randomClaspId =
          isKawaii && CLASPS.length > 0
            ? CLASPS[Math.floor(Math.random() * CLASPS.length)]!.id
            : null;

        set({
          components: result.components,
          figurine: result.figurine,
          selectedComponent: null,
          ...(randomChainId ? { figurineChainId: randomChainId } : {}),
          ...(randomClaspId ? { figurineClaspId: randomClaspId } : {}),
        });
        return result.mood;
      },

      reset: () =>
        set({
          atelierId: DEFAULT_ATELIER,
          sizeCm: sizeCmOf(DEFAULT_ATELIER, DEFAULT_SIZE),
          sizeLabel: DEFAULT_SIZE,
          components: [],
          figurine: null,
          figurineChainId: DEFAULT_CHAIN_ID,
          figurineClaspId: DEFAULT_CLASP_ID,
          step: 'beads',
          selectedComponent: null,
          draftTitle: '',
          draftIntention: '',
          // Reset is the explicit "clean slate" action — drop the
          // per-atelier stash so re-entering an atelier starts fresh.
          ateliersStash: {},
        }),

      save: (title, intention) => {
        const state = get();
        const isKawaii = state.atelierId === 'atelier_kawaii';
        const design: BraceletConfig = {
          id: uid('design'),
          atelierId: state.atelierId,
          sizeLabel: state.sizeLabel,
          sizeCm: state.sizeCm,
          components: state.components,
          figurine: state.figurine,
          // Only persist the attachment ids when they're meaningful
          // (Kawaii + figurine present). Otherwise omit so non-Kawaii
          // designs stay clean and round-trip identically.
          figurineChainId: isKawaii && state.figurine ? state.figurineChainId : undefined,
          figurineClaspId: isKawaii && state.figurine ? state.figurineClaspId : undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          title,
          intention,
          price: priceOf(state.atelierId, state.sizeLabel, state.components, state.figurine),
        };
        set({ savedDesigns: [design, ...state.savedDesigns].slice(0, 24) });
        return design;
      },

      loadSharedDesign: (design) =>
        set(() => {
          const atelier = ATELIER_BY_ID[design.atelierId];
          const atelierId = atelier?.id ?? DEFAULT_ATELIER;
          const sizeCm =
            atelier?.sizing.mode === 'fixed-range'
              ? sizeCmOf(atelierId, 'M')
              : typeof design.sizeCm === 'number' && Number.isFinite(design.sizeCm)
                ? clampCm(design.sizeCm)
                : sizeCmOf(atelierId, design.sizeLabel);
          const components = design.components
            .filter((component) =>
              component.kind === 'bead'
                ? Boolean(BEAD_BY_ID[component.refId])
                : Boolean(CHARM_BY_ID[component.refId]),
            )
            .map((component) => ({
              slotId: uid('s'),
              kind: component.kind,
              refId: component.refId,
              // Preserve the orientation flag so a shared/recovered
              // design renders identically to the sender's bracelet.
              ...(component.flipped ? { flipped: true } : {}),
            }));
          const nextFigurine =
            design.figurine && CHARM_BY_ID[design.figurine.refId]
              ? {
                  slotId: uid('s'),
                  kind: 'charm' as const,
                  refId: design.figurine.refId,
                }
              : null;

          // Hydrate attachments from the shared payload, falling back
          // to defaults when missing or when the catalogue no longer
          // recognises the id (graceful migration).
          const chainId =
            design.figurineChainId && CHAIN_BY_ID[design.figurineChainId]
              ? design.figurineChainId
              : DEFAULT_CHAIN_ID;
          const claspId =
            design.figurineClaspId && CLASP_BY_ID[design.figurineClaspId]
              ? design.figurineClaspId
              : DEFAULT_CLASP_ID;

          return {
            atelierId,
            sizeCm,
            sizeLabel: deriveSizeLabel(atelierId, sizeCm),
            components,
            figurine: nextFigurine,
            figurineChainId: chainId,
            figurineClaspId: claspId,
            selectedComponent: null,
            step: 'beads',
            draftTitle: design.title ?? '',
            draftIntention: design.intention ?? '',
          };
        }),

      loadDesign: (id) => {
        const design = get().savedDesigns.find((d) => d.id === id);
        if (!design) return;
        const chainId =
          design.figurineChainId && CHAIN_BY_ID[design.figurineChainId]
            ? design.figurineChainId
            : DEFAULT_CHAIN_ID;
        const claspId =
          design.figurineClaspId && CLASP_BY_ID[design.figurineClaspId]
            ? design.figurineClaspId
            : DEFAULT_CLASP_ID;
        set({
          atelierId: design.atelierId,
          sizeCm: design.sizeCm,
          sizeLabel: design.sizeLabel,
          components: design.components,
          figurine: design.figurine ?? null,
          figurineChainId: chainId,
          figurineClaspId: claspId,
          selectedComponent: null,
          step: 'beads',
          draftTitle: design.title ?? '',
          draftIntention: design.intention ?? '',
        });
      },

      deleteDesign: (id) =>
        set((state) => ({
          savedDesigns: state.savedDesigns.filter((d) => d.id !== id),
        })),
    }),
    { name: 'mnb-configurator-v8' },
  ),
);

export function useConfiguratorPrice() {
  return useConfigurator((s) => priceOf(s.atelierId, s.sizeLabel, s.components, s.figurine));
}

export function snapshotConfig(
  state: ConfiguratorState,
  title?: string,
  intention?: string,
  fulfillmentMode: FulfillmentMode = 'assembled-paris',
): BraceletConfig {
  const now = new Date().toISOString();
  const isKawaii = state.atelierId === 'atelier_kawaii';
  return {
    id: uid('design'),
    atelierId: state.atelierId,
    sizeLabel: state.sizeLabel,
    sizeCm: state.sizeCm,
    components: state.components,
    figurine: state.figurine,
    // Attachment ids are only meaningful for Kawaii + with a figurine.
    // We snapshot them so the artisan knows which chain/clasp to use
    // when assembling the order.
    figurineChainId: isKawaii && state.figurine ? state.figurineChainId : undefined,
    figurineClaspId: isKawaii && state.figurine ? state.figurineClaspId : undefined,
    createdAt: now,
    updatedAt: now,
    title,
    intention,
    fulfillmentMode,
    price: priceOf(state.atelierId, state.sizeLabel, state.components, state.figurine),
  };
}

export function resolveBead(id: string): Bead | undefined {
  return BEAD_BY_ID[id];
}
export function resolveCharm(id: string): Charm | undefined {
  return CHARM_BY_ID[id];
}
export function resolveChain(id: string | null | undefined) {
  if (!id) return undefined;
  return CHAIN_BY_ID[id];
}
export function resolveClasp(id: string | null | undefined) {
  if (!id) return undefined;
  return CLASP_BY_ID[id];
}

/* ────────────────────────────────────────────────────────────────
   Helpers used by views
─────────────────────────────────────────────────────────────── */
export function countBeads(components: BraceletComponent[]): number {
  return components.filter((c) => c.kind === 'bead').length;
}
export function countCharms(components: BraceletComponent[]): number {
  return components.filter((c) => c.kind === 'charm').length;
}

/** Is the bracelet long enough to be considered "complete" (within minMm) ? */
export function isComplete(
  atelierId: string,
  sizeCm: number,
  components: BraceletComponent[],
): boolean {
  return getSizeFit(atelierId, sizeCm, components).status === 'ready';
}
