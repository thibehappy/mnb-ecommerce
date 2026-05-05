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
