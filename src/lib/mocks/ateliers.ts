import type { Atelier, StoneFamily, CharmCategory } from '@/types';

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
];

const STANDARD_CHARMS: CharmCategory[] = [
  'coeur',
  'etoile',
  'lune',
  'fleur',
  'animal',
  'symbole',
  'lettre',
];

/**
 * 3-tier pricing — same as kits, displayed cheapest → priciest :
 *   - kawaii            : 24 €
 *   - kawaii-premium    : 30 € (figurines Sanrio + Disney)
 *   - classique         : 36 €
 */
export const ATELIERS: Atelier[] = [
  {
    id: 'atelier_kawaii',
    slug: 'kawaii',
    name: 'Kawaii',
    tagline: 'Pour les plus jeunes (et les grands)',
    description:
      'Fil de fer mémoire, 9 perles pastel spécifiques et jusqu’à 3 charms kawaii signature.',
    image: '/photos/atelier-kawaii.jpg',
    wireType: 'Fil de fer mémoire',
    beadCount: 9,
    allowedBeadFamilies: ['rose-quartz', 'pearl', 'turquoise', 'moonstone'],
    allowedCharmCategories: ['kawaii', 'fleur', 'coeur'],
    allowCharms: true,
    maxCharms: 3,
    price: 24,
    sizes: [
      { label: 'S', cm: 14 },
      { label: 'M', cm: 16 },
      { label: 'L', cm: 18 },
    ],
  },
  {
    id: 'atelier_kawaii_premium',
    slug: 'kawaii-premium',
    name: 'Kawaii Premium',
    tagline: 'Figurines Sanrio & Disney incluses',
    description:
      'Fil de fer mémoire, 8 perles pastel haut de gamme et figurines officielles Sanrio (Hello Kitty, Cinnamoroll) ou Disney (Mickey, Stitch).',
    image: '/photos/atelier-kawaii-premium.jpg',
    wireType: 'Fil de fer mémoire',
    beadCount: 8,
    allowedBeadFamilies: ['rose-quartz', 'pearl', 'turquoise', 'moonstone', 'amethyst'],
    allowedCharmCategories: ['kawaii', 'fleur', 'coeur', 'etoile'],
    allowCharms: true,
    maxCharms: 3,
    price: 30,
    sizes: [
      { label: 'S', cm: 15 },
      { label: 'M', cm: 17 },
      { label: 'L', cm: 19 },
    ],
  },
  {
    id: 'atelier_bracelet_bar',
    slug: 'bracelet-bar',
    name: 'Bracelet Bar',
    tagline: 'Notre classique signature',
    description:
      'Fil élastique premium, 8 perles en pierres naturelles au choix dans toute notre collection, un charm offert.',
    image: '/photos/atelier-bracelet-bar.jpg',
    wireType: 'Fil élastique',
    beadCount: 8,
    allowedBeadFamilies: STANDARD_BEAD_FAMILIES,
    allowedCharmCategories: STANDARD_CHARMS,
    allowCharms: true,
    maxCharms: 2,
    price: 36,
    sizes: [
      { label: 'S', cm: 15 },
      { label: 'M', cm: 17 },
      { label: 'L', cm: 19 },
    ],
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
