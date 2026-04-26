import type { BraceletBase } from '@/types';

export const BASES: BraceletBase[] = [
  {
    id: 'base_elastique',
    type: 'elastique',
    name: 'Élastique tressé',
    description:
      'Fil élastique durable, tressé à la main. Parfait pour les créations multi-perles sans fermoir.',
    price: 0,
    beadSlots: { small: 20, medium: 22, large: 24 },
    sizes: [
      { label: 'S', cm: 15 },
      { label: 'M', cm: 17 },
      { label: 'L', cm: 19 },
    ],
    images: [],
  },
  {
    id: 'base_cordon',
    type: 'cordon',
    name: 'Cordon ajustable',
    description:
      'Cordon coton tressé avec nœud coulissant, se porte du poignet à la cheville.',
    price: 3,
    beadSlots: { small: 14, medium: 16, large: 18 },
    sizes: [
      { label: 'Unique', cm: 22 },
    ],
    images: [],
  },
  {
    id: 'base_chaine_dore',
    type: 'chaine-dore',
    name: 'Chaîne dorée',
    description:
      'Chaîne laiton doré à l\u2019or fin, fermoir mousqueton. Accueille les charms librement.',
    price: 18,
    beadSlots: { small: 8, medium: 10, large: 12 },
    sizes: [
      { label: 'S', cm: 16 },
      { label: 'M', cm: 18 },
      { label: 'L', cm: 20 },
    ],
    images: [],
  },
  {
    id: 'base_chaine_argent',
    type: 'chaine-argent',
    name: 'Chaîne argent',
    description:
      'Chaîne argent 925, maillons ovales, fermoir mousqueton.',
    price: 22,
    beadSlots: { small: 8, medium: 10, large: 12 },
    sizes: [
      { label: 'S', cm: 16 },
      { label: 'M', cm: 18 },
      { label: 'L', cm: 20 },
    ],
    images: [],
  },
];

export const BASE_BY_ID = Object.fromEntries(BASES.map((b) => [b.id, b])) as Record<
  string,
  BraceletBase
>;
