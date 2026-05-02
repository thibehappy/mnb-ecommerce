import type { BraceletComponent, SharedBracelet } from '@/types';

/**
 * Seed data for the gallery — only used the first time the persisted store
 * is initialised. Subsequent reloads use the localStorage state, so user
 * publications + votes are preserved.
 *
 * Each entry is hand-picked from the existing bead catalog (beads.ts) so
 * the photos render correctly. SizeCm + sizeLabel target the M preset for
 * user-pick ateliers; Kawaii sits inside its fixed range.
 */

let slotCounter = 0;
function slot(): string {
  slotCounter += 1;
  return `seed-slot-${slotCounter}`;
}

function bead(refId: string): BraceletComponent {
  return { slotId: slot(), kind: 'bead', refId };
}

function repeatBeads(refId: string, count: number): BraceletComponent[] {
  return Array.from({ length: count }, () => bead(refId));
}

function alternateBeads(a: string, b: string, totalCount: number): BraceletComponent[] {
  return Array.from({ length: totalCount }, (_, i) => bead(i % 2 === 0 ? a : b));
}

export const GALLERY_SEED: SharedBracelet[] = [
  {
    id: 'seed-1',
    title: 'Pure nacre',
    creator: 'Léa',
    atelierId: 'atelier_bracelet_bar',
    sizeCm: 17,
    sizeLabel: 'M',
    components: alternateBeads('bead_pearl_8_baroque', 'bead_celeste_8', 21),
    figurine: null,
    votesUp: 64,
    votesDown: 3,
    createdAt: '2026-04-22T14:32:00.000Z',
  },
  {
    id: 'seed-2',
    title: 'Soleil d’été',
    creator: 'Anaïs',
    atelierId: 'atelier_bracelet_bar',
    sizeCm: 17,
    sizeLabel: 'M',
    components: [
      ...repeatBeads('bead_carnelian_6', 12),
      ...repeatBeads('bead_turquoise_6', 8),
      bead('bead_pearl_8_baroque'),
    ],
    figurine: null,
    votesUp: 47,
    votesDown: 6,
    createdAt: '2026-04-25T09:18:00.000Z',
  },
  {
    id: 'seed-3',
    title: 'Hello Pink',
    creator: 'Mélina',
    atelierId: 'atelier_kawaii',
    sizeCm: 29,
    sizeLabel: 'M',
    components: [
      ...repeatBeads('bead_pearl_8_baroque', 18),
      ...repeatBeads('bead_heart_black', 12),
      bead('bead_bow_pearl'),
    ],
    figurine: { slotId: slot(), kind: 'charm', refId: 'charm_figurine_signature' },
    votesUp: 92,
    votesDown: 4,
    createdAt: '2026-04-28T18:04:00.000Z',
  },
  {
    id: 'seed-4',
    title: 'Iridescent Dream',
    creator: 'Camille',
    atelierId: 'atelier_kawaii',
    sizeCm: 29,
    sizeLabel: 'M',
    components: [
      ...alternateBeads('bead_moonstone_iris_6', 'bead_pearl_8_baroque', 32),
      bead('bead_flower_daisy'),
      bead('bead_bow_lightblue'),
    ],
    figurine: { slotId: slot(), kind: 'charm', refId: 'charm_figurine_signature' },
    votesUp: 38,
    votesDown: 2,
    createdAt: '2026-04-29T11:42:00.000Z',
  },
  {
    id: 'seed-5',
    title: 'Onyx Power',
    creator: 'Hugo',
    atelierId: 'atelier_classique',
    sizeCm: 19,
    sizeLabel: 'L',
    components: [
      ...repeatBeads('bead_onyx_tube', 16),
      ...repeatBeads('bead_carnelian_6', 14),
      bead('bead_heart_black'),
    ],
    figurine: null,
    votesUp: 56,
    votesDown: 11,
    createdAt: '2026-04-20T15:09:00.000Z',
  },
  {
    id: 'seed-6',
    title: 'Stellaire',
    creator: 'Marion',
    atelierId: 'atelier_classique',
    sizeCm: 17,
    sizeLabel: 'M',
    components: [
      ...alternateBeads('bead_moonstone_cube', 'bead_celeste_8', 20),
      bead('bead_star_green'),
    ],
    figurine: null,
    votesUp: 73,
    votesDown: 5,
    createdAt: '2026-04-30T20:21:00.000Z',
  },
  {
    id: 'seed-7',
    title: 'Garden Whispers',
    creator: 'Inès',
    atelierId: 'atelier_classique',
    sizeCm: 17,
    sizeLabel: 'M',
    components: [
      ...repeatBeads('bead_turquoise_8', 6),
      ...repeatBeads('bead_pearl_8_baroque', 8),
      ...repeatBeads('bead_carnelian_6', 6),
      bead('bead_flower_daisy'),
      bead('bead_star_orange'),
    ],
    figurine: null,
    votesUp: 29,
    votesDown: 8,
    createdAt: '2026-05-01T07:55:00.000Z',
  },
  {
    id: 'seed-8',
    title: 'Minimal Pearl',
    creator: 'Sarah',
    atelierId: 'atelier_bracelet_bar',
    sizeCm: 15,
    sizeLabel: 'S',
    components: repeatBeads('bead_pearl_8_baroque', 19),
    figurine: null,
    votesUp: 18,
    votesDown: 1,
    createdAt: '2026-05-01T22:13:00.000Z',
  },
];
