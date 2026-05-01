import type { Atelier, StoneFamily, CharmCategory } from '@/types';

/** Full catalogue of stone families (all semi-precious + pearls + enamel shapes). */
const STANDARD_BEAD_FAMILIES: StoneFamily[] = [
  'amethyst',
  'turquoise',
  'rose-quartz',
  'lapis',
  'onyx',
  'jade',
  'amber',
  'pearl',
  'citrine',
  'obsidian',
  'carnelian',
  'moonstone',
  'garnet',
  'enamel',
];

/**
 * Familles "entrée de gamme" : perles & teintes pastels, sans pierres
 * semi-précieuses prestigieuses (lapis, jade, onyx noir, etc.).
 * Partagées entre Bracelet Bar et Kawaii — la différence entre les deux
 * ateliers se joue sur le système d'attache + la possibilité d'ajouter une
 * figurine, pas sur les perles.
 */
const ENTRY_BEAD_FAMILIES: StoneFamily[] = [
  'pearl',
  'rose-quartz',
  'turquoise',
  'moonstone',
  'amber',
  'amethyst',
  'enamel',
];

/**
 * "Vrais" charms du Classique — petits éléments métalliques / symboliques
 * destinés à se glisser entre les perles. Volontairement disjoint des
 * catégories qu'on retrouve en figurines Kawaii (cœur, étoile, fleur, nœud,
 * animal, kawaii) pour qu'aucun élément ne se retrouve dans les deux ateliers.
 *
 * À ce jour aucun PNG ne correspond → le picker Charm du Classique affichera
 * l'empty state "Aucun charm disponible pour le moment." Les charms photographiés
 * arriveront ensuite dans ces catégories.
 */
const CLASSIQUE_CHARMS: CharmCategory[] = ['lettre', 'symbole', 'lune'];

/**
 * Figurines du Kawaii — formes émaillées (Sanrio / Disney / signature MNB).
 * Sémantiquement ce ne sont pas des "charms" : on les nomme "Figurines"
 * dans l'UI (cf. CharmPicker / Configurator).
 */
const KAWAII_FIGURINES: CharmCategory[] = [
  'kawaii',
  'fleur',
  'coeur',
  'etoile',
  'noeud',
  'animal',
];

const PICK_SIZES = [
  { label: 'S' as const, cm: 15 },
  { label: 'M' as const, cm: 17 },
  { label: 'L' as const, cm: 19 },
];

/**
 * 3-tier line-up — sorted cheapest → priciest:
 *   - Bracelet Bar     : 18 € — perles & nacre (sans pierres semi-précieuses)
 *   - Kawaii           : 28 € — perles pastel + figurines kawaii (Sanrio / Disney inclus)
 *   - Classique        : 36 € — collection complète (toutes pierres + tous charms)
 *
 * Sizing :
 *   - Bracelet Bar / Classique : `user-pick` (S 15 cm / M 17 cm / L 19 cm + perso).
 *     Le total des sizeMm des composants doit égaler sizeCm × 10 mm.
 *   - Kawaii : `fixed-range` 290–330 mm (fil de fer mémoire). L'utilisateur ne
 *     choisit pas de taille — il peut ajouter des perles tant que le total reste
 *     dans la fourchette.
 */
export const ATELIERS: Atelier[] = [
  {
    id: 'atelier_bracelet_bar',
    slug: 'bracelet-bar',
    name: 'Bracelet Bar',
    tagline: 'L’essentiel, perles & nacre',
    description:
      'Fil élastique premium à composer librement avec nos perles nacrées et nos teintes douces. Sans pierres semi-précieuses, pour un bracelet pur et lumineux.',
    image: '/photos/atelier-bracelet-bar.jpg',
    wireType: 'Fil élastique',
    sizing: { mode: 'user-pick' },
    allowedBeadFamilies: ENTRY_BEAD_FAMILIES,
    allowedCharmCategories: [],
    allowCharms: false,
    maxCharms: 0,
    slackMm: 0,
    price: 18,
    sizes: PICK_SIZES,
  },
  {
    id: 'atelier_kawaii',
    slug: 'kawaii',
    name: 'Kawaii',
    tagline: 'Pastel & figurines, votre signature ludique',
    description:
      'Fil de fer mémoire à composer avec des perles pastel haut de gamme et jusqu’à 1 figurine kawaii — Sanrio (Hello Kitty, Cinnamoroll) ou Disney (Mickey, Stitch) au choix.',
    image: '/photos/atelier-kawaii.jpg',
    wireType: 'Fil de fer mémoire',
    sizing: { mode: 'fixed-range', minMm: 290, maxMm: 330 },
    allowedBeadFamilies: ENTRY_BEAD_FAMILIES,
    allowedCharmCategories: KAWAII_FIGURINES,
    allowCharms: true,
    maxCharms: 1,
    slackMm: 0,
    price: 24,
    // Sizes irrelevant for fixed-range — the user doesn't pick a circumference.
    sizes: [],
  },
  {
    id: 'atelier_classique',
    slug: 'classique',
    name: 'Classique',
    tagline: 'Notre collection complète, sans limite',
    description:
      'Fil élastique premium à composer dans toute notre collection : pierres semi-précieuses, perles, et l’ensemble de nos charms. L’atelier sans contrainte.',
    image: '/photos/atelier-bracelet-bar.jpg',
    wireType: 'Fil élastique',
    sizing: { mode: 'user-pick' },
    allowedBeadFamilies: STANDARD_BEAD_FAMILIES,
    allowedCharmCategories: CLASSIQUE_CHARMS,
    allowCharms: true,
    maxCharms: 2,
    slackMm: 0,
    price: 36,
    sizes: PICK_SIZES,
  },
];

export const ATELIER_BY_ID = Object.fromEntries(ATELIERS.map((a) => [a.id, a])) as Record<
  string,
  Atelier
>;
export const ATELIER_BY_SLUG = Object.fromEntries(ATELIERS.map((a) => [a.slug, a])) as Record<
  string,
  Atelier
>;
