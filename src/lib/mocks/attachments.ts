import type { AttachmentChain, AttachmentClasp } from '@/types';
import { ATTACHMENT_PHOTOS } from './attachment-photos.generated';

/**
 * Catalogue des attaches Kawaii — petite chaîne à billes + anneau /
 * cœur de fermeture. Le tout relie la figurine émaillée à la corde
 * du bracelet.
 *
 * Conventions :
 *   - PNG dans `public/photos/attachments/<id>.png`
 *   - L'`id` doit suivre exactement le filename
 *   - `attach_chain_<color>`            → chaîne couleur
 *   - `attach_clasp_<shape>_<color>`    → anneau ou cœur
 *
 * Pour ajouter un élément :
 *   1. Drop le PNG détouré dans `public/photos/attachments/`
 *   2. Ajouter l'entrée ci-dessous
 *   3. `npm run sync:attachments` regénère `attachment-photos.generated.ts`
 */

const CHAINS_RAW: AttachmentChain[] = [
  {
    id: 'attach_chain_red',
    name: 'Chaîne rouge',
    color: 'red',
    hex: '#D43A3A',
    images: [],
  },
  {
    id: 'attach_chain_orange',
    name: 'Chaîne orange',
    color: 'orange',
    hex: '#E67338',
    images: [],
  },
  {
    id: 'attach_chain_black',
    name: 'Chaîne noire',
    color: 'black',
    hex: '#1A1A1A',
    images: [],
  },

  // ─── Batch PERLES_CANVA_DANY 82-93 (ajoute 2026-05-16) ───
  {
    id: 'attach_chain_brown',
    name: 'Chaîne brune',
    color: 'brown',
    hex: '#8B4A2D',
    images: [],
  },
  {
    id: 'attach_chain_brown_v2',
    name: 'Chaîne brun sombre',
    color: 'brown',
    hex: '#5A2E18',
    images: [],
  },
  {
    id: 'attach_chain_red_v2',
    name: 'Chaîne rouge (v2)',
    color: 'red',
    hex: '#C92828',
    images: [],
  },
  {
    id: 'attach_chain_olive',
    name: 'Chaîne olive',
    color: 'olive',
    hex: '#8B7A28',
    images: [],
  },
  {
    id: 'attach_chain_green',
    name: 'Chaîne verte',
    color: 'green',
    hex: '#5C8E58',
    images: [],
  },
  {
    id: 'attach_chain_black_v2',
    name: 'Chaîne noire (v2)',
    color: 'black',
    hex: '#1A1A1A',
    images: [],
  },
  {
    id: 'attach_chain_purple',
    name: 'Chaîne violette',
    color: 'purple',
    hex: '#6B45A8',
    images: [],
  },
  {
    id: 'attach_chain_lime',
    name: 'Chaîne lime',
    color: 'lime',
    hex: '#A0C03C',
    images: [],
  },
  {
    id: 'attach_chain_magenta',
    name: 'Chaîne magenta',
    color: 'magenta',
    hex: '#A82850',
    images: [],
  },
  {
    id: 'attach_chain_navy',
    name: 'Chaîne navy',
    color: 'navy',
    hex: '#1F2D5C',
    images: [],
  },
  {
    id: 'attach_chain_gray',
    name: 'Chaîne grise',
    color: 'gray',
    hex: '#A0A4AB',
    images: [],
  },
];

const CLASPS_RAW: AttachmentClasp[] = [
  {
    id: 'attach_clasp_round_yellow',
    name: 'Anneau jaune',
    shape: 'round',
    hex: '#E8DC3F',
    images: [],
  },
  {
    id: 'attach_clasp_round_green',
    name: 'Anneau vert',
    shape: 'round',
    hex: '#3FA844',
    images: [],
  },
  {
    id: 'attach_clasp_heart_blue',
    name: 'Cœur bleu à pois',
    shape: 'heart',
    hex: '#1E3A8A',
    dotsHex: '#E8DC3F',
    images: [],
  },
  {
    id: 'attach_clasp_heart_orange',
    name: 'Cœur orange à pois',
    shape: 'heart',
    hex: '#E55B2B',
    dotsHex: '#FFFFFF',
    images: [],
  },

  // ─── Batch PERLES_CANVA_DANY 64-80 (ajoute 2026-05-16) ───
  // 17 nouveaux clasps colores. Renomes pour eviter collisions avec
  // les existants (round_green, heart_orange). Le snaphook utilise
  // shape='round' (ClaspShape enum ne supporte pas 'snaphook').

  // ── Cœurs à pois
  {
    id: 'attach_clasp_heart_navy_dots',
    name: 'Cœur navy à pois jaunes',
    shape: 'heart',
    hex: '#1F2D5C',
    dotsHex: '#E8DC3F',
    images: [],
  },
  {
    id: 'attach_clasp_heart_navy_dots_v2',
    name: 'Cœur navy à pois jaunes (v2)',
    shape: 'heart',
    hex: '#1F2D5C',
    dotsHex: '#E8DC3F',
    images: [],
  },
  {
    id: 'attach_clasp_heart_orange_dots',
    name: 'Cœur orange à pois (v2)',
    shape: 'heart',
    hex: '#E55B2B',
    dotsHex: '#FFFFFF',
    images: [],
  },

  // ── Anneaux ronds (palette élargie)
  {
    id: 'attach_clasp_round_blue',
    name: 'Anneau bleu pastel',
    shape: 'round',
    hex: '#4B8BC7',
    images: [],
  },
  {
    id: 'attach_clasp_round_teal',
    name: 'Anneau teal',
    shape: 'round',
    hex: '#2D7E7A',
    images: [],
  },
  {
    id: 'attach_clasp_round_emerald',
    name: 'Anneau vert émeraude',
    shape: 'round',
    hex: '#2D8A47',
    images: [],
  },
  {
    id: 'attach_clasp_round_emerald_v2',
    name: 'Anneau vert émeraude (v2)',
    shape: 'round',
    hex: '#3FA844',
    images: [],
  },
  {
    id: 'attach_clasp_round_lavender',
    name: 'Anneau lavande',
    shape: 'round',
    hex: '#8B7BB5',
    images: [],
  },
  {
    id: 'attach_clasp_round_black',
    name: 'Anneau noir',
    shape: 'round',
    hex: '#1A1A1A',
    images: [],
  },
  {
    id: 'attach_clasp_round_orange',
    name: 'Anneau orange',
    shape: 'round',
    hex: '#C84A26',
    images: [],
  },
  {
    id: 'attach_clasp_round_gray',
    name: 'Anneau gris perle',
    shape: 'round',
    hex: '#A8A8B0',
    images: [],
  },
  {
    id: 'attach_clasp_round_lime',
    name: 'Anneau lime',
    shape: 'round',
    hex: '#A0C03C',
    images: [],
  },
  {
    id: 'attach_clasp_round_chartreuse',
    name: 'Anneau chartreuse',
    shape: 'round',
    hex: '#9DB04A',
    images: [],
  },
  {
    id: 'attach_clasp_round_burgundy',
    name: 'Anneau bordeaux',
    shape: 'round',
    hex: '#8B1F38',
    images: [],
  },
  {
    id: 'attach_clasp_round_mauve',
    name: 'Anneau mauve',
    shape: 'round',
    hex: '#A05F75',
    images: [],
  },
  {
    id: 'attach_clasp_round_caramel',
    name: 'Anneau caramel',
    shape: 'round',
    hex: '#B5894A',
    images: [],
  },
  {
    id: 'attach_clasp_round_snaphook_yellow',
    name: 'Mousqueton porte-clés jaune',
    shape: 'round',
    hex: '#C9B83C',
    images: [],
  },
  {
    id: 'attach_clasp_round_snaphook_brown',
    name: 'Mousqueton porte-clés brun',
    shape: 'round',
    hex: '#8B5A2D',
    images: [],
  },
];

/** CHAINS export with photo URLs hydrated from the manifest. */
export const CHAINS: AttachmentChain[] = CHAINS_RAW.map((c) => {
  const photos = ATTACHMENT_PHOTOS[c.id];
  return photos && photos.length > 0 ? { ...c, images: photos } : c;
});

/** CLASPS export with photo URLs hydrated from the manifest. */
export const CLASPS: AttachmentClasp[] = CLASPS_RAW.map((c) => {
  const photos = ATTACHMENT_PHOTOS[c.id];
  return photos && photos.length > 0 ? { ...c, images: photos } : c;
});

export const CHAIN_BY_ID = Object.fromEntries(CHAINS.map((c) => [c.id, c])) as Record<
  string,
  AttachmentChain
>;
export const CLASP_BY_ID = Object.fromEntries(CLASPS.map((c) => [c.id, c])) as Record<
  string,
  AttachmentClasp
>;

/** Default attachment — picked when a Kawaii figurine is added without
 *  the user touching the chain/clasp choices yet. Red chain is the
 *  catalogue's "primary" chain; the green round clasp pairs with it. */
export const DEFAULT_CHAIN_ID = 'attach_chain_red';
export const DEFAULT_CLASP_ID = 'attach_clasp_round_green';
