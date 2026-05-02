import type { Bead } from '@/types';
import { BEAD_PHOTOS } from './bead-photos.generated';

/**
 * Catalogue. Only beads with a real product photo (transparent PNG in
 * /public/photos/beads/) are listed — the SVG-fallback entries have been
 * pruned from the catalog so the configurator and the inspire/random engine
 * never surface a stylized placeholder.
 *
 * To add a new bead:
 *   1. Drop its detoured PNG in /public/photos/beads/<id>.png
 *   2. Run `npm run sync:beads` to regenerate bead-photos.generated.ts
 *   3. Add a new entry below with the matching id
 */
const BEADS_RAW: Bead[] = [
  // Turquoise
  {
    id: 'bead_turquoise_8',
    name: 'Turquoise brute',
    family: 'turquoise',
    hex: '#6B9B95',
    veinHex: '#4A7A74',
    shape: 'nugget',
    sizeMm: 8,
    price: 2.8,
    stock: 80,
    description: 'Éclat bleu-vert minéral, chaque perle est unique.',
    meaning: ['protection', 'voyage'],
    images: [],
  },
  {
    id: 'bead_turquoise_6',
    name: 'Turquoise lisse',
    family: 'turquoise',
    hex: '#7CADA6',
    veinHex: '#5A8983',
    shape: 'round',
    sizeMm: 6,
    price: 2.4,
    stock: 160,
    description: 'Turquoise polie, bleu laiteux.',
    images: [],
  },
  // Pearl
  {
    id: 'bead_pearl_8_baroque',
    name: 'Perle baroque',
    family: 'pearl',
    hex: '#F5EDE0',
    veinHex: '#D4C5A8',
    shape: 'nugget',
    sizeMm: 8,
    price: 3.8,
    stock: 60,
    description: 'Perle irrégulière, chaque pièce est différente.',
    images: [],
  },
  // Carnelian
  {
    id: 'bead_carnelian_6',
    name: 'Cornaline',
    family: 'carnelian',
    hex: '#B85A3C',
    veinHex: '#8F3D23',
    shape: 'round',
    sizeMm: 6,
    price: 2.2,
    stock: 110,
    description: 'Orange terre cuite, vive et chaleureuse.',
    meaning: ['courage', 'vitalité'],
    images: [],
  },
  // Onyx tube
  {
    id: 'bead_onyx_tube',
    name: 'Tube onyx',
    family: 'onyx',
    hex: '#1A1A1A',
    veinHex: '#0A0A0A',
    shape: 'tube',
    sizeMm: 6,
    price: 1.8,
    stock: 180,
    description: 'Tube en onyx noir poli, ponctuation profonde.',
    images: [],
  },
  // Moonstone iridescent (vert / rose)
  {
    id: 'bead_moonstone_iris_6',
    name: 'Pierre de lune iridescente',
    family: 'moonstone',
    hex: '#88B5A8',
    veinHex: '#C97FA8',
    shape: 'round',
    sizeMm: 6,
    price: 2.8,
    stock: 90,
    description: 'Pierre de lune avec inclusions roses et reflets verts.',
    meaning: ['intuition', 'magie'],
    images: [],
  },
  // Moonstone cube
  {
    id: 'bead_moonstone_cube',
    name: 'Cube pierre de lune',
    family: 'moonstone',
    hex: '#D4D0C8',
    veinHex: '#A8A098',
    shape: 'cube',
    sizeMm: 8,
    price: 3.0,
    stock: 70,
    description: 'Cube en pierre de lune translucide, sculpté à la main.',
    images: [],
  },
  {
    id: 'bead_celeste_8',
    name: 'Céleste',
    family: 'moonstone',
    hex: '#A9BED4',
    veinHex: '#7F91A8',
    shape: 'round',
    sizeMm: 8,
    price: 3.2,
    stock: 80,
    description: 'Perle bleu laiteux translucide, douce et lumineuse.',
    meaning: ['clarté', 'douceur'],
    images: [],
  },

  // ─── Enamel beads (formes émaillées) ───
  // Perles décoratives non semi-précieuses, percées comme une perle classique.
  // Disponibles dans tous les ateliers.
  {
    id: 'bead_heart_black',
    name: 'Cœur noir',
    family: 'enamel',
    hex: '#1A1A1A',
    veinHex: '#3A3838',
    shape: 'heart',
    sizeMm: 10,
    price: 4.6,
    stock: 100,
    description: 'Cœur ajouré noir laqué, esprit Y2K.',
    images: [],
  },
  {
    id: 'bead_star_orange',
    name: 'Étoile orange',
    family: 'enamel',
    hex: '#E89060',
    veinHex: '#B86838',
    shape: 'star',
    sizeMm: 10,
    price: 4.2,
    stock: 90,
    description: 'Étoile émaillée orange, finition iridescente.',
    images: [],
  },
  {
    id: 'bead_star_green',
    name: 'Étoile verte',
    family: 'enamel',
    hex: '#9BC4A8',
    veinHex: '#6E9B7E',
    shape: 'star',
    sizeMm: 10,
    price: 4.2,
    stock: 90,
    description: 'Étoile émaillée vert tendre, reflets nacrés.',
    images: [],
  },
  {
    id: 'bead_flower_daisy',
    name: 'Marguerite',
    family: 'enamel',
    hex: '#F5EFE3',
    veinHex: '#D4A8A0',
    shape: 'flower',
    sizeMm: 12,
    price: 4.5,
    stock: 90,
    description: 'Marguerite émaillée blanc et jaune.',
    images: [],
  },
  {
    id: 'bead_bow_pearl',
    name: 'Nœud nacré',
    family: 'enamel',
    hex: '#F5EDE0',
    veinHex: '#D4C5A8',
    shape: 'bow',
    sizeMm: 10,
    price: 5.0,
    stock: 80,
    description: 'Nœud papillon ivoire à reflets nacrés.',
    images: [],
  },
  {
    id: 'bead_bow_pearl_v2',
    name: 'Nœud nacré V2',
    family: 'enamel',
    hex: '#E6D978',
    veinHex: '#BFB35F',
    shape: 'bow',
    sizeMm: 10,
    price: 5.0,
    stock: 80,
    description: 'Nœud papillon nacré nouvelle photo, reflets irisés plus détaillés.',
    images: [],
  },
  {
    id: 'bead_bow_blue',
    name: 'Nœud bleu',
    family: 'enamel',
    hex: '#7CADA6',
    veinHex: '#5A8983',
    shape: 'bow',
    sizeMm: 10,
    price: 5.0,
    stock: 80,
    description: 'Nœud papillon bleu cyan, émail satiné.',
    images: [],
  },
  {
    id: 'bead_bow_lightblue',
    name: 'Nœud bleu pâle',
    family: 'enamel',
    hex: '#B8D4D8',
    veinHex: '#8DAFB4',
    shape: 'bow',
    sizeMm: 10,
    price: 5.0,
    stock: 80,
    description: 'Nœud papillon bleu pâle, émail satiné.',
    images: [],
  },
];

/** Final BEADS export with photo URLs merged in from /public/photos/beads/. */
export const BEADS: Bead[] = BEADS_RAW.map((b) => {
  const photos = BEAD_PHOTOS[b.id];
  return photos && photos.length > 0 ? { ...b, images: photos } : b;
});

export const BEAD_BY_ID = Object.fromEntries(BEADS.map((b) => [b.id, b])) as Record<string, Bead>;
