import type {
  Bead,
  BraceletComponent,
  Charm,
  CharmCategory,
  CharmKind,
  StoneFamily,
} from '@/types';
import { BEADS } from '@/lib/mocks/beads';
import { CHARMS } from '@/lib/mocks/charms';
import { uid } from '@/lib/utils/format';

/**
 * Curated palettes that look good together. Not random: we combine 2–3
 * stone families that share undertone + contrast rules.
 */
export type Mood =
  | 'jardin'
  | 'nuit'
  | 'solaire'
  | 'romantique'
  | 'minimaliste'
  | 'kawaii'
  | 'mystique';

interface PaletteRecipe {
  stones: StoneFamily[];
  /** Compatible charm categories for this mood. */
  charmBias: Charm['category'][];
}

const RECIPES: Record<Mood, PaletteRecipe> = {
  jardin: { stones: ['jade', 'rose-quartz', 'pearl'], charmBias: ['fleur', 'coeur'] },
  nuit: { stones: ['onyx', 'lapis', 'moonstone'], charmBias: ['lune', 'etoile', 'symbole'] },
  solaire: { stones: ['amber', 'citrine', 'carnelian'], charmBias: ['etoile', 'animal'] },
  romantique: { stones: ['rose-quartz', 'pearl', 'amethyst'], charmBias: ['coeur', 'fleur'] },
  minimaliste: { stones: ['onyx', 'pearl'], charmBias: ['symbole'] },
  kawaii: { stones: ['rose-quartz', 'pearl', 'turquoise'], charmBias: ['kawaii', 'fleur'] },
  mystique: { stones: ['amethyst', 'obsidian', 'moonstone'], charmBias: ['lune', 'symbole'] },
};

const MOOD_LIST: Mood[] = Object.keys(RECIPES) as Mood[];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function beadsFor(family: StoneFamily): Bead[] {
  return BEADS.filter((b) => b.family === family);
}

function charmsFor(categories: Charm['category'][], kind?: CharmKind): Charm[] {
  return CHARMS.filter(
    (c) => categories.includes(c.category) && (!kind || c.kind === kind),
  );
}

export interface InspiredConfig {
  mood: Mood;
  /** Dense ordered list of components — empty if nothing could be generated. */
  components: BraceletComponent[];
  /** Figurine attached to the bracelet (Kawaii only — null otherwise). */
  figurine: BraceletComponent | null;
  description: string;
}

export interface InspireConstraints {
  /**
   * Target circumference in mm. We fill the bracelet with beads (and at most
   * `maxCharms` charms) until we reach `targetMm`. Required for the new
   * length-based model.
   */
  targetMm?: number;
  /** Minimum acceptable circumference in mm (for fixed-range ateliers). */
  minMm?: number;
  allowedBeadFamilies?: StoneFamily[];
  allowedCharmCategories?: CharmCategory[];
  allowCharms?: boolean;
  maxCharms?: number;
  /** Restrict charm picks to a single kind ('charm' for Classique,
   *  'figurine' for Kawaii). When unset, both kinds are eligible. */
  charmKind?: CharmKind;
}

export function inspire(mood?: Mood, constraints?: InspireConstraints): InspiredConfig {
  const chosenMood = mood ?? pickRandom(MOOD_LIST);
  const recipe = RECIPES[chosenMood];
  const targetMm = Math.max(0, constraints?.targetMm ?? 170);
  const minMm = Math.max(0, constraints?.minMm ?? targetMm);
  const allowCharms = constraints?.allowCharms ?? true;
  const maxCharms = Math.min(constraints?.maxCharms ?? 1, allowCharms ? 3 : 0);

  // Restrict stone families to those the atelier allows
  const allowedFams = constraints?.allowedBeadFamilies;
  const allowedRecipeStones = allowedFams
    ? recipe.stones.filter((s) => allowedFams.includes(s))
    : recipe.stones;
  const effectiveStones = allowedRecipeStones.length
    ? allowedRecipeStones
    : (allowedFams ?? recipe.stones);

  const [primaryFam, secondaryFam, accentFam] = [
    effectiveStones[0],
    effectiveStones[1] ?? effectiveStones[0],
    effectiveStones[2] ?? effectiveStones[1] ?? effectiveStones[0],
  ];

  const primaryChoices = beadsFor(primaryFam!);
  const secondaryChoices = beadsFor(secondaryFam!);
  const accentChoices = beadsFor(accentFam!);

  const fallbackBeads = allowedFams
    ? BEADS.filter((b) => allowedFams.includes(b.family))
    : BEADS;

  const primary = pickRandom(primaryChoices.length ? primaryChoices : fallbackBeads.length ? fallbackBeads : BEADS);
  const secondary = pickRandom(secondaryChoices.length ? secondaryChoices : fallbackBeads.length ? fallbackBeads : BEADS);
  const accent = pickRandom(accentChoices.length ? accentChoices : fallbackBeads.length ? fallbackBeads : BEADS);

  // Restrict charms : intersect mood recipe with atelier whitelist + filter by kind.
  const allowedCharmCats = constraints?.allowedCharmCategories;
  const wantedKind = constraints?.charmKind;
  const effectiveCharmBias = allowedCharmCats
    ? recipe.charmBias.filter((c) => allowedCharmCats.includes(c))
    : recipe.charmBias;
  const charmCandidates = charmsFor(
    effectiveCharmBias.length ? effectiveCharmBias : (allowedCharmCats ?? recipe.charmBias),
    wantedKind,
  );
  const charmFallback = wantedKind ? CHARMS.filter((c) => c.kind === wantedKind) : CHARMS;
  const centerCharm =
    maxCharms > 0
      ? charmCandidates.length
        ? pickRandom(charmCandidates)
        : charmFallback.length
          ? pickRandom(charmFallback)
          : null
      : null;

  // For Kawaii (kind === 'figurine'), centerCharm goes to the SIDE figurine
  // slot (off the cord). For Classique (kind === 'charm'), it goes onto the
  // cord between beads. We split the two paths.
  const figurineForSide =
    centerCharm && wantedKind === 'figurine'
      ? { slotId: uid('s'), kind: 'charm' as const, refId: centerCharm.id }
      : null;
  const chordCharm = centerCharm && wantedKind !== 'figurine' ? centerCharm : null;

  // Build the bracelet : alternate primary/secondary/primary/accent beads,
  // optionally inserting one (cord) charm near the center. Stop when adding
  // the next bead would exceed targetMm.
  const bgSeq = [primary, secondary, primary, accent];
  const components: BraceletComponent[] = [];
  let totalMm = 0;
  let charmsPlaced = 0;
  let i = 0;

  const charmInsertAtMm = chordCharm ? targetMm / 2 : Number.POSITIVE_INFINITY;
  let charmInserted = false;

  while (true) {
    if (
      !charmInserted &&
      chordCharm &&
      charmsPlaced < maxCharms &&
      totalMm >= charmInsertAtMm &&
      totalMm + chordCharm.sizeMm <= targetMm
    ) {
      components.push({ slotId: uid('s'), kind: 'charm', refId: chordCharm.id });
      totalMm += chordCharm.sizeMm;
      charmsPlaced++;
      charmInserted = true;
      continue;
    }

    const bead = bgSeq[i % bgSeq.length]!;
    if (totalMm + bead.sizeMm > targetMm + 0.0001) break;
    components.push({ slotId: uid('s'), kind: 'bead', refId: bead.id });
    totalMm += bead.sizeMm;
    i++;

    if (i > 500) break;
  }

  // If we ended up too short of minMm (rare — fixed-range), keep going with the
  // smallest available bead until we cross minMm or run out of room.
  if (totalMm < minMm) {
    const smallest = (fallbackBeads.length ? fallbackBeads : BEADS).slice().sort(
      (a, b) => a.sizeMm - b.sizeMm,
    )[0];
    while (smallest && totalMm + smallest.sizeMm <= targetMm + 0.0001) {
      components.push({ slotId: uid('s'), kind: 'bead', refId: smallest.id });
      totalMm += smallest.sizeMm;
      if (totalMm >= minMm) break;
    }
  }

  const description = moodDescription(
    chosenMood,
    primary.name,
    secondary.name,
    centerCharm?.name ?? primary.name,
  );

  return { mood: chosenMood, components, figurine: figurineForSide, description };
}

const MOOD_LABELS: Record<Mood, string> = {
  jardin: 'Jardin',
  nuit: 'Nuit',
  solaire: 'Solaire',
  romantique: 'Romantique',
  minimaliste: 'Minimaliste',
  kawaii: 'Kawaii',
  mystique: 'Mystique',
};

export function moodLabel(mood: Mood): string {
  return MOOD_LABELS[mood];
}

function moodDescription(mood: Mood, primary: string, secondary: string, charm: string): string {
  switch (mood) {
    case 'jardin':
      return `Un bouquet de ${primary.toLowerCase()} et ${secondary.toLowerCase()}, rehaussé d’un ${charm.toLowerCase()}.`;
    case 'nuit':
      return `Ancré dans le ${primary.toLowerCase()}, ponctué d’un ${charm.toLowerCase()}.`;
    case 'solaire':
      return `Les teintes chaudes de ${primary.toLowerCase()} et ${secondary.toLowerCase()}.`;
    case 'romantique':
      return `${primary} et ${secondary.toLowerCase()} pour une composition douce.`;
    case 'minimaliste':
      return `L’essentiel : ${primary.toLowerCase()}, et un ${charm.toLowerCase()}.`;
    case 'kawaii':
      return `Pastels et charm ${charm.toLowerCase()}, signature kawaii.`;
    case 'mystique':
      return `${primary} et ${secondary.toLowerCase()}, ${charm.toLowerCase()} en centre.`;
  }
}

export const AVAILABLE_MOODS = MOOD_LIST;
