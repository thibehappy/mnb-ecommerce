import type { Bead, BraceletComponent, Charm, CharmCategory, StoneFamily } from '@/types';
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
  /** Preferred size distribution. */
  beadSizes?: Bead['size'][];
}

const RECIPES: Record<Mood, PaletteRecipe> = {
  jardin: {
    stones: ['jade', 'rose-quartz', 'pearl'],
    charmBias: ['fleur', 'coeur'],
  },
  nuit: {
    stones: ['onyx', 'lapis', 'moonstone'],
    charmBias: ['lune', 'etoile', 'symbole'],
  },
  solaire: {
    stones: ['amber', 'citrine', 'carnelian'],
    charmBias: ['etoile', 'animal'],
  },
  romantique: {
    stones: ['rose-quartz', 'pearl', 'amethyst'],
    charmBias: ['coeur', 'fleur'],
  },
  minimaliste: {
    stones: ['onyx', 'pearl'],
    charmBias: ['symbole'],
  },
  kawaii: {
    stones: ['rose-quartz', 'pearl', 'turquoise'],
    charmBias: ['kawaii', 'fleur'],
  },
  mystique: {
    stones: ['amethyst', 'obsidian', 'moonstone'],
    charmBias: ['lune', 'symbole'],
  },
};

const MOOD_LIST: Mood[] = Object.keys(RECIPES) as Mood[];

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function beadsFor(family: StoneFamily, sizes?: Bead['size'][]): Bead[] {
  return BEADS.filter(
    (b) => b.family === family && (!sizes || sizes.includes(b.size)),
  );
}

function charmsFor(categories: Charm['category'][]): Charm[] {
  return CHARMS.filter((c) => categories.includes(c.category));
}

/**
 * Generate a harmonious bracelet configuration for a mood.
 * Pattern: mostly symmetrical with a central charm and accent beads.
 */
export interface InspiredConfig {
  mood: Mood;
  components: BraceletComponent[];
  description: string;
}

export interface InspireConstraints {
  beadCount?: number;
  allowedBeadFamilies?: StoneFamily[];
  allowedCharmCategories?: CharmCategory[];
  allowCharms?: boolean;
}

export function inspire(mood?: Mood, constraints?: InspireConstraints): InspiredConfig {
  const chosenMood = mood ?? pickRandom(MOOD_LIST);
  const recipe = RECIPES[chosenMood];
  const beadCount = Math.max(3, constraints?.beadCount ?? 11);
  const allowCharms = constraints?.allowCharms ?? true;

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

  const primaryChoices = beadsFor(primaryFam!, recipe.beadSizes);
  const secondaryChoices = beadsFor(secondaryFam!, recipe.beadSizes);
  const accentChoices = beadsFor(accentFam!, recipe.beadSizes);

  const primary = pickRandom(primaryChoices.length ? primaryChoices : BEADS);
  const secondary = pickRandom(secondaryChoices.length ? secondaryChoices : BEADS);
  const accent = pickRandom(accentChoices.length ? accentChoices : BEADS);

  // Restrict charms
  const allowedCharmCats = constraints?.allowedCharmCategories;
  const effectiveCharmBias = allowedCharmCats
    ? recipe.charmBias.filter((c) => allowedCharmCats.includes(c))
    : recipe.charmBias;
  const charmCandidates = charmsFor(
    effectiveCharmBias.length ? effectiveCharmBias : (allowedCharmCats ?? recipe.charmBias),
  );
  const centerCharm = pickRandom(charmCandidates.length ? charmCandidates : CHARMS);

  // Build pattern of exactly beadCount beads (+ optional center charm)
  const pattern: BraceletComponent[] = [];
  const half = Math.floor(beadCount / 2);
  const bgSeq = [primary, secondary, primary, accent, primary, secondary, primary, accent, primary, secondary, primary];

  for (let i = 0; i < half; i++) {
    pattern.push({ slotId: uid('s'), kind: 'bead', refId: bgSeq[i % bgSeq.length]!.id });
  }
  if (allowCharms) {
    pattern.push({ slotId: uid('s'), kind: 'charm', refId: centerCharm.id });
  }
  for (let i = 0; i < beadCount - half; i++) {
    pattern.push({
      slotId: uid('s'),
      kind: 'bead',
      refId: bgSeq[(half + i) % bgSeq.length]!.id,
    });
  }

  const description = moodDescription(chosenMood, primary.name, secondary.name, centerCharm.name);

  return { mood: chosenMood, components: pattern, description };
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
      return `Un bouquet de ${primary.toLowerCase()} et ${secondary.toLowerCase()}, rehaussé d\u2019un ${charm.toLowerCase()}.`;
    case 'nuit':
      return `Ancré dans le ${primary.toLowerCase()}, ponctué d\u2019un ${charm.toLowerCase()}.`;
    case 'solaire':
      return `Les teintes chaudes de ${primary.toLowerCase()} et ${secondary.toLowerCase()}.`;
    case 'romantique':
      return `${primary} et ${secondary.toLowerCase()} pour une composition douce.`;
    case 'minimaliste':
      return `L\u2019essentiel : ${primary.toLowerCase()}, et un ${charm.toLowerCase()}.`;
    case 'kawaii':
      return `Pastels et charm ${charm.toLowerCase()}, signature kawaii.`;
    case 'mystique':
      return `${primary} et ${secondary.toLowerCase()}, ${charm.toLowerCase()} en centre.`;
  }
}

export const AVAILABLE_MOODS = MOOD_LIST;
