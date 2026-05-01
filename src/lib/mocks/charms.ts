import type { Charm } from '@/types';
import { CHARM_PHOTOS } from './charm-photos.generated';

/**
 * Catalogue charms + figurines.
 *
 * Discriminator `kind` :
 *   - 'charm'    → vrai charm (Classique uniquement, à glisser entre perles).
 *                  PNG dans public/photos/charms/<id>.png
 *   - 'figurine' → figurine émaillée 3D (Kawaii uniquement, type Sanrio/Disney).
 *                  PNG dans public/photos/figurines/<id>.png
 *                  Si licensed: 'sanrio' | 'disney' → ajouter surcharge: 6 €.
 *
 * À ce jour le catalogue est volontairement vide :
 *   - Les vrais charms (lettres / médailles / lunes) ne sont pas encore shootés
 *   - Aucune figurine licenciée Sanrio / Disney n'est encore référencée
 *
 * Les anciennes formes émaillées (cœur, étoile, marguerite, nœuds) qu'on
 * appelait "figurines" sont en fait des perles : elles ont migré vers
 * src/lib/mocks/beads.ts avec family='enamel'.
 *
 * Pour ajouter un nouvel élément :
 *   1. Drop le PNG détouré dans le dossier correspondant à son kind.
 *   2. `npm run sync:charms` regénère charm-photos.generated.ts.
 *   3. Ajouter l'entrée ci-dessous avec id matchant + kind matchant.
 */
const CHARMS_RAW: Charm[] = [
  // ─── Figurines (Kawaii) ───
  {
    id: 'charm_figurine_signature',
    name: 'Figurine signature',
    category: 'kawaii',
    material: 'email',
    kind: 'figurine',
    sizeMm: 12,
    price: 4.5,
    stock: 50,
    description: 'Figurine émaillée signature MyNiceBracelet.',
    images: [],
  },
];

/** Final CHARMS export with photo URLs merged in from the photo manifest. */
export const CHARMS: Charm[] = CHARMS_RAW.map((c) => {
  const photos = CHARM_PHOTOS[c.id];
  return photos && photos.length > 0 ? { ...c, images: photos } : c;
});

export const CHARM_BY_ID = Object.fromEntries(CHARMS.map((c) => [c.id, c])) as Record<
  string,
  Charm
>;
