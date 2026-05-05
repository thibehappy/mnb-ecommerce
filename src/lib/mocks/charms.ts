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
 * Tarification — deux champs distincts (NE PAS CONFONDRE) :
 *   • `surcharge?` : supplément ajouté à CHAQUE pose, peu importe le contexte
 *                    (ex. licence Sanrio/Disney = +6 € systématique).
 *   • `extraFee?`  : supplément ajouté UNIQUEMENT quand ce charm est posé
 *                    AU-DELÀ du nombre inclus dans l'atelier (ex. Classique
 *                    inclut 3 charms gratuits ; à partir du 4ᵉ on facture le
 *                    `extraFee` propre du charm). Si omis, fallback sur
 *                    `DEFAULT_EXTRA_CHARM_FEE` (1 €) — cf.
 *                    `src/lib/store/configurator.ts`.
 *                    Charms d'entrée de gamme : 1 €. Charms premium
 *                    (médaille gravée, motif élaboré) : 3 €.
 *
 * À ce jour le catalogue est volontairement minimaliste :
 *   - 1 figurine signature (placeholder, pas encore de PNG)
 *   - 1 charm Tour Eiffel (Classique)
 *
 * Les anciennes formes émaillées (cœur, étoile, marguerite, nœuds) qu'on
 * appelait "figurines" sont en fait des perles : elles ont migré vers
 * src/lib/mocks/beads.ts avec family='enamel'.
 *
 * Pour ajouter un nouvel élément :
 *   1. Drop le PNG détouré dans le dossier correspondant à son kind.
 *   2. `npm run sync:charms` regénère charm-photos.generated.ts.
 *   3. Ajouter l'entrée ci-dessous avec id matchant + kind matchant.
 *   4. Définir `extraFee` selon le tier (1 € entrée de gamme / 3 € premium).
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

  // ─── Charms Classique (s'insèrent entre les perles, attache fine) ───
  {
    id: 'charm_tour_eiffel',
    name: 'Tour Eiffel',
    category: 'symbole',
    material: 'argente',
    kind: 'charm',
    // L'attache est très fine — ce qui consomme la circonférence du fil,
    // c'est l'anneau d'accroche, pas le corps pendant. 2 mm pour s'insérer
    // entre les perles sans déranger la composition.
    sizeMm: 2,
    price: 3.5,
    stock: 80,
    description: 'Tour Eiffel argentée, signature parisienne ajourée.',
    images: [],
    // Charm "entrée de gamme" : surcoût modéré quand il dépasse les 3
    // charms inclus dans le Classique. Une médaille gravée ou une
    // pièce premium serait à `extraFee: 3`.
    extraFee: 1,
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
