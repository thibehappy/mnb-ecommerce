# MyNiceBracelet — Guide pour le back-end

> Documentation à destination d'**Aurélien** (gestion du stock perles + photos)
> et de quiconque branche le back-end derrière le front actuel.
>
> Ce document explique **le produit**, **les données**, **le workflow d'ajout
> de perles**, **les contraintes côté front**, et **ce qu'il faudra brancher
> serveur-side** quand on quittera les mocks.
>
> Auteur : Claude (Anthropic) · Mai 2026 · Lecture estimée : ~25 min

---

## Sommaire

1. [Le produit en 1 minute](#1-le-produit-en-1-minute)
2. [Architecture technique](#2-architecture-technique)
3. [Modèle de données — types canoniques](#3-modèle-de-données--types-canoniques)
4. [Catalogue : structure de `Bead` et `Charm`](#4-catalogue--structure-de-bead-et-charm)
5. [Workflow photos : comment ajouter une nouvelle perle](#5-workflow-photos--comment-ajouter-une-nouvelle-perle)
6. [Stock — fonctionnement attendu](#6-stock--fonctionnement-attendu)
7. [Pricing — où vivent les prix](#7-pricing--où-vivent-les-prix)
8. [Les 3 ateliers et leurs règles](#8-les-3-ateliers-et-leurs-règles)
9. [Le configurateur — comment ça calcule](#9-le-configurateur--comment-ça-calcule)
10. [Persistence côté client (Zustand) — ce qui doit migrer en DB](#10-persistence-côté-client-zustand--ce-qui-doit-migrer-en-db)
11. [Cartes cadeaux + galerie : statut actuel](#11-cartes-cadeaux--galerie--statut-actuel)
12. [Internationalisation FR/EN](#12-internationalisation-fren)
13. [Contrat API recommandé](#13-contrat-api-recommandé)
14. [Commandes utiles + arborescence](#14-commandes-utiles--arborescence)
15. [FAQ rapide](#15-faq-rapide)

---

## 1. Le produit en 1 minute

**MyNiceBracelet** (MNB) = boutique parisienne de bracelets personnalisés. Le
client compose son bracelet en ligne, on lui livre soit le bracelet **assemblé
à Paris** soit un **kit DIY** à monter chez lui.

### 3 ateliers (= 3 styles de bracelet)

| Atelier | Prix | Fil | Cible | Particularité |
|---|---|---|---|---|
| **Bracelet Bar** | 18 € | Élastique | Entrée de gamme | Perles & nacre uniquement |
| **Kawaii** | 24 € | Fil de fer mémoire | Adolescentes / fans Sanrio | Une figurine 3D side-attached |
| **Classique** | 36 € | Élastique | Premium | Pierres semi-précieuses + charms |

### Flow client

```
Choix de l'atelier  →  Composition (perles + charms/figurines + taille)
       ↓
Choix de l'assemblage (Kit DIY recommandé / Assemblé Paris)
       ↓
Ajouter au panier  →  Commande (formulaire) → Confirmation
```

### Features secondaires côté front
- **Cartes cadeaux** (codes `MNB-XXXX-XXXX`) : offrir un bracelet déjà composé
  OU offrir une carte ouverte que le destinataire compose lui-même.
- **Partage par lien** : `/creer?design=<encoded>` charge un bracelet pré-composé
  dans le configurator (la composition voyage dans l'URL).
- **Mode FR/EN** persistant.

---

## 2. Architecture technique

### Stack
- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript strict** (`tsc --noEmit --noUnusedLocals` doit passer)
- **TailwindCSS 4** pour le style
- **Zustand** + middleware `persist` (localStorage) pour les stores
- **Framer Motion** pour les animations + transitions
- **react-hook-form** + **Zod** pour les forms
- **lucide-react** pour les icônes

### Côté front, **pas de back-end** pour l'instant
Tout est mocké :
- Catalogue : fichiers TypeScript dans `src/lib/mocks/`
- Panier : `Zustand` + localStorage
- Configurator state : `Zustand` + localStorage
- Cartes cadeaux : `Zustand` + localStorage (fake codes générés client-side)
- Paiement : placeholder, le formulaire valide via Zod et fait `setTimeout(900ms)` pour simuler

### Côté serveur (à brancher plus tard)
La frontière est claire : tout ce qui passe par le store **Zustand** est
candidat à la migration vers une API. Voir §10 et §13.

---

## 3. Modèle de données — types canoniques

Tous les types vivent dans **`src/types/index.ts`**. C'est la **source de
vérité**. Le back-end devra exposer ces mêmes formes via API.

### Types fondamentaux
```ts
type UUID = string;        // identifiant unique
type ISODate = string;     // "2026-05-04T18:32:00.000Z"
type Euros = number;       // prix en €, decimal autorisé (4.5, 2.8, …)
```

### Familles & formes de perles
```ts
type StoneFamily =
  | 'amethyst' | 'turquoise' | 'rose-quartz' | 'lapis' | 'onyx' | 'jade'
  | 'amber' | 'pearl' | 'citrine' | 'obsidian' | 'carnelian' | 'moonstone'
  | 'garnet' | 'enamel';                     // 14 familles

type BeadShape =
  | 'round' | 'faceted' | 'rondelle' | 'nugget' | 'tube' | 'cube'
  | 'heart' | 'star' | 'flower' | 'bow';     // 10 formes
```

> ⚠️ Si tu introduis une nouvelle famille ou forme, **il faut éditer le type**
> dans `src/types/index.ts` ET mettre à jour les éventuels switches qui en
> dépendent (notamment `formatBeadSize`, `beadPhotoZoom`, etc.).

### Charms vs figurines (sémantique)

```ts
type CharmKind = 'charm' | 'figurine';
```

- **`charm`** = petit pendentif métallique destiné au **Classique**, qui se
  glisse **entre les perles** sur le fil. Catégories : `lettre`, `symbole`, `lune`.
  Photos dans `public/photos/charms/`.
- **`figurine`** = forme émaillée 3D destinée au **Kawaii**, qui s'attache
  **à côté** du bracelet (off-cord). Inclut Sanrio (Hello Kitty…), Disney
  (Mickey, Stitch…), signature MNB. Photos dans `public/photos/figurines/`.

### Ateliers
```ts
type AtelierSizing =
  | { mode: 'user-pick' }                         // S/M/L sélectionnable
  | { mode: 'fixed-range'; minMm: number; maxMm: number };  // ex Kawaii 280-300mm

interface Atelier {
  id: UUID;                       // 'atelier_classique'
  slug: string;                   // 'classique'
  name: string;                   // 'Classique'
  tagline: string;
  description: string;
  image: string;                  // chemin photo de la card atelier
  wireType: string;               // 'Fil élastique'
  sizing: AtelierSizing;
  allowedBeadFamilies: StoneFamily[];   // restriction du catalogue
  allowedCharmCategories: CharmCategory[];
  allowCharms: boolean;
  maxCharms: number;              // ex 3 pour Classique
  slackMm: number;                // tolérance circonférence (en pratique 0)
  price: Euros;                   // prix de base
  sizes: AtelierSize[];           // [{label:'S', cm:15}, ...] vide si fixed-range
}
```

### Bracelet final (snapshot envoyé en commande)
```ts
interface BraceletConfig {
  id: UUID;
  atelierId: UUID;
  sizeLabel: 'S' | 'M' | 'L' | 'custom';
  sizeCm: number;                                  // 17, 19, 16.5…
  components: BraceletComponent[];                 // ce qui est sur le fil
  figurine: BraceletComponent | null;              // hors fil (Kawaii uniquement)
  createdAt: ISODate;
  updatedAt: ISODate;
  title?: string;                                  // "Pure Nacre" donné par le client
  intention?: string;                              // petit mot facultatif
  fulfillmentMode?: 'assembled-paris' | 'diy-kit';
  price: Euros;                                    // calculé front-side
}

interface BraceletComponent {
  slotId: string;                                  // id local pour React keys
  kind: 'bead' | 'charm';
  refId: UUID;                                     // id de la perle / charm dans le catalogue
}
```

> 📌 **`components` est dense et ordonné**. La position dans l'array = la
> position physique sur le fil. La somme des `sizeMm` de chaque composant =
> circonférence du bracelet (= `sizeCm × 10` mm pour les ateliers user-pick).

### Panier
```ts
type CartLine = CartLineKit | CartLineCustom;
interface CartLineKit { lineId: string; kind: 'kit'; kitId: UUID; quantity: number; }
interface CartLineCustom { lineId: string; kind: 'custom'; config: BraceletConfig; quantity: number; }
```

### Cartes cadeaux
```ts
interface GiftCard {
  code: string;                       // "MNB-AB12-CD34"
  kind: 'designed' | 'open';
  status: 'pending' | 'viewed' | 'redeemed';
  design?: BraceletConfig;            // si designed
  atelierId?: UUID;                   // si open : atelier réservé
  amount: Euros;                      // pré-payé
  senderName?: string;
  recipientName?: string;
  message?: string;
  createdAt: ISODate;
  viewedAt?: ISODate;
  redeemedAt?: ISODate;
}
```

---

## 4. Catalogue : structure de `Bead` et `Charm`

### `Bead` (perle / pierre)

Définition complète dans `src/types/index.ts` :

```ts
interface Bead {
  id: UUID;                  // ⚠️ DOIT matcher le filename PNG (voir §5)
  name: string;              // "Cœur noir", "Turquoise brute"
  family: StoneFamily;       // 'pearl', 'turquoise', 'enamel', …
  hex: string;               // "#1A1A1A" — couleur dominante (fallback SVG)
  veinHex?: string;          // couleur secondaire pour les nuances
  shape: BeadShape;          // 'round', 'heart', 'tube', …
  sizeMm: number;            // ⚠️ critique : voir §6
  price: Euros;              // 2.8, 4.6, …
  stock: number;             // unités en stock
  description: string;       // 1-2 phrases pour le tooltip
  meaning?: string[];        // ['protection', 'voyage'] — symbolisme optionnel
  images: string[];          // rempli automatiquement par sync:beads
}
```

#### Exemple d'entrée (extrait de `src/lib/mocks/beads.ts`) :

```ts
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
  images: [],                // ne pas remplir manuellement
}
```

### `Charm` (charm OU figurine)

```ts
interface Charm {
  id: UUID;                  // ⚠️ DOIT matcher le filename PNG
  name: string;
  category: CharmCategory;   // 'kawaii', 'lettre', 'lune', …
  material: CharmMaterial;   // 'dore', 'argente', 'email', 'pierre'
  kind: CharmKind;           // 'charm' OU 'figurine' — discrimine où il sera proposé
  price: Euros;
  stock: number;
  description: string;
  images: string[];          // rempli automatiquement par sync:charms
  sizeMm: number;            // largeur dans le sens du fil (mm)
  renderSize?: number;
  licensed?: 'sanrio' | 'disney';   // déclenche surcharge
  surcharge?: Euros;                // typiquement 6 € pour Sanrio/Disney
}
```

---

## 5. Workflow photos : comment ajouter une nouvelle perle

C'est **la partie principale du job d'Aurélien**. Voici le workflow exact.

### Pré-requis
- Python 3.10+ installé localement
- Pour les détourages auto (cas B) : `pip install rembg pillow`

### Cas A — Tu as déjà détouré un PNG (fond transparent)

#### Étape 1 — Nommer le PNG avec l'`id`
Le filename **doit** correspondre au champ `id` de la perle dans
`src/lib/mocks/beads.ts`, suivi de `.png`.

```
✅ bead_amethyst_8.png    ← matche id: 'bead_amethyst_8'
✅ bead_heart_black.png   ← matche id: 'bead_heart_black'
❌ amethyst-8mm.png       ← ne matche aucun id, sera ignoré
```

#### Étape 2 — Déposer dans `public/photos/beads/`

```
public/photos/
├── beads/                ← perles ICI
│   ├── bead_pearl_8_baroque.png
│   ├── bead_turquoise_8.png
│   └── ...
├── charms/               ← charms ICI (Classique)
│   └── charm_xxx.png
└── figurines/            ← figurines ICI (Kawaii)
    └── charm_figurine_signature.png
```

#### Étape 3 — Lancer le sync
```bash
npm run sync:beads
```

Le script Python `scripts/sync_beads.py` :
1. Scanne `public/photos/beads/`
2. Génère `src/lib/mocks/bead-photos.generated.ts` qui mappe
   `bead_id → ['/photos/beads/bead_xxx.png']`
3. Le mock `beads.ts` merge automatiquement ces URLs dans le champ `images`
   de chaque perle au moment du build

#### Étape 4 — Pour les charms / figurines
Pareil, mais avec `npm run sync:charms` (qui scanne **les deux dossiers**
`charms/` et `figurines/`).

#### Étape 5 — Vérifier
```bash
npm run dev
```
Ouvre `http://localhost:3000/creer`, choisis Classique, va sur l'onglet "Pierres"
ou "Perles" — la nouvelle perle doit apparaître avec sa photo.

### Cas B — Photo brute (fond blanc) à détourer
```bash
npm run detour:bead -- "C:/path/IMG_4438.JPG" "public/photos/beads/bead_amethyst_6.png"
```

Le script utilise **`rembg`** (modèle U²Net) pour retirer le fond, crop sur le
sujet, pad carré transparent, sortie PNG ≤ 1500×1500.

Puis suis l'étape 3 du cas A.

### Cas C — La perle n'existe pas encore dans le catalogue

1. **Ajouter l'entrée dans `src/lib/mocks/beads.ts`** :
   ```ts
   {
     id: 'bead_jade_8',                       // ← convention bead_<famille>_<taille>
     name: 'Jade vert pomme',
     family: 'jade',
     hex: '#7FB069',
     veinHex: '#5C8C4C',
     shape: 'round',
     sizeMm: 8,
     price: 3.2,
     stock: 100,
     description: 'Jade naturel poli, vert intense.',
     meaning: ['harmonie', 'sagesse'],
     images: [],
   },
   ```
2. Drop le PNG nommé `bead_jade_8.png` dans `public/photos/beads/`.
3. Lance `npm run sync:beads`.
4. **Affecter la famille à un atelier** si nécessaire (cf. §8) — par défaut,
   `jade` n'est dans `STANDARD_BEAD_FAMILIES` que pour le Classique.

### Spécifications techniques des PNG

| Critère | Valeur |
|---|---|
| Format | PNG avec alpha (transparence) |
| Taille | ≤ 1500×1500 (le script `detour_bead.py` y veille) |
| Cropping | **La perle doit être centrée**. Padding minimal acceptable. |
| Aspect ratio | **Carré** (1:1) — sinon le bead glyph va se déformer |
| Trou de la perle | Orienté **nord-sud** (vertical) sur la photo |
| Fond | **Transparent** (alpha = 0). Pas de fond blanc résiduel. |

### Photo padding & rendu visuel

> **Pourquoi c'est important :** Le front utilise un zoom commun ×3 sur les
> photos pour les afficher dans la prévisualisation et la palette. Si la perle
> occupe trop peu de surface dans le PNG (trop de padding), elle apparaîtra
> petite. Si elle déborde du carré, elle se fera couper.

**Règle empirique** :
- Perles **rondes / nuggets / facettées** : occupation de **~40%** du carré (padding important pour les ombres/highlights)
- Perles **émaillées en forme** (cœur, étoile, fleur, nœud) : occupation **~70%** (crop serré, la forme touche presque les bords)
- Perles **tubes / cubes** : occupation **~42%** (padding modéré)

Le ratio `multiplier` dans `BeadPicker.tsx` et `bead-display.ts` compense ces
différences. Ne change pas ces ratios sans concertation.

### Liste actuelle des PNG en place

```
public/photos/beads/                    public/photos/figurines/
├── bead_bow_blue.png                   └── charm_figurine_signature.png
├── bead_bow_lightblue.png
├── bead_bow_pearl.png
├── bead_bow_pearl_v2.png
├── bead_carnelian_6.png
├── bead_celeste_8.png
├── bead_flower_daisy.png
├── bead_heart_black.png
├── bead_moonstone_cube.png
├── bead_moonstone_iris_6.png
├── bead_onyx_tube.png
├── bead_pearl_8_baroque.png
├── bead_star_green.png
├── bead_star_orange.png
├── bead_turquoise_6.png
└── bead_turquoise_8.png
```

**16 perles photographiées + 1 figurine signature.** À toi de compléter.

### Liste des `bead_id` connus mais sans photo

Le fichier `scripts/README.md` liste les IDs candidats. Pour chacun, il manque
encore le PNG :

```
bead_amethyst_6        bead_amber_8           bead_pearl_4
bead_amethyst_facette  bead_pearl_6           bead_citrine_6
bead_rose_quartz_6     bead_rose_quartz_8     bead_obsidian_8
bead_lapis_6           bead_onyx_6            bead_onyx_8_facette
bead_jade_6            bead_garnet_6          bead_moonstone_6
bead_gold_tube         bead_onyx_4
```

Ces IDs ne sont **PAS encore dans `beads.ts`** — il faudra les ajouter au mock
en même temps que tu déposes leur PNG.

---

## 6. Stock — fonctionnement attendu

### Champ `stock` actuel
Chaque entrée `Bead` et `Charm` a un champ `stock: number` qui indique le
nombre d'unités disponibles.

### Comportement front actuel
**Aucun.** Le `stock` est dans la donnée mais le front ne le lit pas pour
l'instant. La perle est sélectionnable indépendamment du stock affiché.

### Comportement attendu côté back-end
Quand le back arrive, il faudra :
1. **Décrémenter le stock** à chaque `BraceletConfig` validé (commande payée).
2. **Refuser la commande** si une perle dans la composition est `stock === 0`
   au moment du paiement (race condition possible avec d'autres clients).
3. **Renvoyer le stock** dans l'API catalogue (`GET /api/beads`).
4. (Optionnel mais souhaitable) **Marquer la perle "rupture"** côté front
   quand `stock === 0`, en grisant la tuile + tooltip "Bientôt de retour".

### Important : `stock` au niveau de la perle, pas du bracelet

Une perle d'`id: 'bead_turquoise_8'` n'est **pas une instance unique** — c'est
une référence catalogue. Si Aurélien dit "j'ai 80 perles turquoises 8mm en
stock", on met `stock: 80` sur cette ligne. Si un client compose un bracelet
avec 6 perles turquoises 8mm, il faut décrémenter de 6.

### Granularité des décréments
Il faut compter les **occurrences** de chaque `refId` dans
`BraceletConfig.components` ET vérifier `figurine?.refId`. Exemple en TS :

```ts
function decrementStockForOrder(config: BraceletConfig, db: Db) {
  const beadCounts = new Map<string, number>();
  const charmCounts = new Map<string, number>();

  for (const c of config.components) {
    const map = c.kind === 'bead' ? beadCounts : charmCounts;
    map.set(c.refId, (map.get(c.refId) ?? 0) + 1);
  }
  if (config.figurine) {
    charmCounts.set(config.figurine.refId, (charmCounts.get(config.figurine.refId) ?? 0) + 1);
  }

  // pour chaque (id, count), db.beads.decrementBy(id, count) etc.
}
```

---

## 7. Pricing — où vivent les prix

### Niveau atelier (prix de base du bracelet)
`Atelier.price` — fixé par atelier :
- Bracelet Bar : 18 €
- Kawaii : 24 €
- Classique : 36 €

C'est le prix **de base** indépendant de la composition (le client paye le même
prix qu'il y mette 5 perles peu chères ou 20 perles cher — c'est la philosophie
"all-inclusive").

### Niveau perle / charm (prix unitaire)
`Bead.price` et `Charm.price` — pas utilisés pour le pricing du bracelet final
actuellement. Le bracelet coûte `atelier.price` quoi qu'il arrive.

> **MAIS** : ces prix unitaires sont utilisés pour les **kits** (`Kit.beads[]`,
> `Kit.charms[]`), où on agrège les prix des perles incluses pour calculer le
> coût matière (info éditoriale, pas affichée au client).

### Surcharge (Sanrio/Disney)
`Charm.surcharge?` — typiquement 6 €. S'ajoute à `atelier.price` quand le
client choisit une figurine licenciée. C'est implémenté côté front dans
`priceOf()` (`src/lib/store/configurator.ts`).

### Calcul actuel (front)
```ts
function priceOf(atelierId, sizeLabel, components, figurine) {
  let base = ATELIER_BY_ID[atelierId].price;
  // Sum of charm/figurine surcharges (only Sanrio/Disney charge extra today)
  for (const c of components) {
    if (c.kind === 'charm') {
      const charm = CHARM_BY_ID[c.refId];
      if (charm?.surcharge) base += charm.surcharge;
    }
  }
  if (figurine) {
    const charm = CHARM_BY_ID[figurine.refId];
    if (charm?.surcharge) base += charm.surcharge;
  }
  return base;
}
```

Le back devra **reproduire ce calcul** exactement — ne pas faire confiance au
`config.price` envoyé par le client (il pourrait le tamponner).

### Livraison
- **Gratuite** si `subtotal >= 60 €`
- **4,90 €** sinon
- Implémenté dans `src/lib/store/cart.ts` (`cartShipping`)

### Kits (catalogue prêt-à-emporter)
`Kit.price` est fixe par kit. Pas de variation selon le contenu. Cf. types
`KIT_PRICES` et `KIT_DUO_PRICES` dans `src/types/index.ts` pour les valeurs
de référence.

---

## 8. Les 3 ateliers et leurs règles

### Bracelet Bar (`atelier_bracelet_bar`) — 18 €
- Fil élastique
- Sizing user-pick : S 15 cm / M 17 cm / L 19 cm + perso (pas par 0,5 cm)
- **Familles autorisées** : `pearl`, `rose-quartz`, `turquoise`, `moonstone`,
  `amber`, `amethyst`, `enamel` (= `ENTRY_BEAD_FAMILIES`)
- **Pas de charms** (`allowCharms: false`, `maxCharms: 0`)
- Onglet visible : **Perles** seulement

### Kawaii (`atelier_kawaii`) — 24 €
- Fil de fer mémoire
- Sizing fixed-range 280–300 mm (29 cm ±1) — pas de S/M/L
- **Familles autorisées** : mêmes que Bracelet Bar
- **1 figurine max** (`maxCharms: 1`), catégorie `kawaii / fleur / coeur / etoile / noeud / animal`
- Onglets visibles : **Perles** + **Figurines**
- La figurine n'est **pas sur le fil** : elle s'attache à côté (rendue à gauche du bracelet en preview)

### Classique (`atelier_classique`) — 36 €
- Fil élastique
- Sizing user-pick : S/M/L + perso
- **Familles autorisées** : toutes (= `STANDARD_BEAD_FAMILIES`)
- **3 charms max** (`maxCharms: 3`), catégories `lettre / symbole / lune`
- Onglets visibles : **Perles** + **Pierres** + **Charms** (3 colonnes)
  - **Perles** = familles `pearl` + `enamel` (constants `NON_STONE_FAMILIES`)
  - **Pierres** = 12 familles semi-précieuses (`STONE_FAMILIES`)

### Constants exportés (`src/lib/mocks/ateliers.ts`)
```ts
export const STONE_FAMILIES: StoneFamily[] = [
  'amethyst', 'turquoise', 'rose-quartz', 'lapis', 'onyx', 'jade',
  'amber', 'citrine', 'obsidian', 'carnelian', 'moonstone', 'garnet',
];
export const NON_STONE_FAMILIES: StoneFamily[] = ['pearl', 'enamel'];
```

> 🔧 **Pour ajouter une nouvelle famille de pierre semi-précieuse** : ajoute-la
> à `STONE_FAMILIES` ET à `STANDARD_BEAD_FAMILIES` (et éventuellement à
> `ENTRY_BEAD_FAMILIES` si Bracelet Bar/Kawaii doivent y avoir accès).

---

## 9. Le configurateur — comment ça calcule

### Vérification de la taille
La règle est : **somme des `sizeMm` de tous les `components` doit égaler la
circonférence cible** (à `slackMm` près, en pratique 0).

```
Σ sizeMm(components[i])  ==  sizeCm × 10 mm  (atelier user-pick)
ou
minMm  ≤  Σ sizeMm(components[i])  ≤  maxMm   (atelier fixed-range)
```

### Statuts possibles
```ts
type SizeFitStatus = 'empty' | 'too-short' | 'ready' | 'too-long';
```

- `empty` : aucun composant, le client commence
- `too-short` : il manque encore `remainingMm` mm
- `ready` : ✅ le bracelet est commandable
- `too-long` : `overflowMm` mm en trop, il faut retirer une perle

Voir `getSizeFit()` dans `src/lib/store/configurator.ts`.

### `canFit(beadMm)`
Avant de proposer une perle dans le picker, le front check si elle peut
encore rentrer dans le budget. Désactive la tuile sinon.

### Position des perles sur le fil (visuel)
Les perles sont **équiréparties** angulairement le long du chemin du bracelet
(ellipse en preview, U-shape pour Kawaii). L'ordre des `components` =
l'ordre apparent (gauche → droite, sens horaire). Pas d'autre logique
géométrique côté front.

### Figurine (Kawaii)
Stockée séparément dans `BraceletConfig.figurine` (pas dans `components`).
Elle ne contribue pas au budget de longueur (off-cord). Limite : 1 max.

---

## 10. Persistence côté client (Zustand) — ce qui doit migrer en DB

| Store front | localStorage key | Données | Doit aller en DB ? |
|---|---|---|---|
| `useCart` | `mnb-cart` | Lignes panier | **Oui** (sessions, paniers persistants par user) |
| `useConfigurator` | `mnb-configurator-v8` | Atelier en cours, taille, components, figurine, draftTitle | **Partiellement** : draft à conserver, état de session OK en localStorage |
| `useGiftCards` | `mnb-gift-cards-v1` | Cards créées + active redemption | **Oui** (codes côté serveur évidemment) |
| `useLang` | `mnb-lang` | FR/EN | Non, pure préférence UI |

### Note sur les migrations Zustand
Les keys ont des suffixes versionnés (`-v8`, `-v1`). Si on change le shape du
state, il faut soit incrémenter (`-v9`) pour invalider, soit écrire un
`migrate` function dans la config persist.

---

## 11. Cartes cadeaux + galerie : statut actuel

### Cartes cadeaux ✅ implémentées (front-only)
- Création : modal en bout de configurator → génère un code `MNB-XXXX-XXXX`
  (alphabet anti-confusion : pas de 0/O, pas de 1/I/L)
- Stockage : `localStorage` côté sender (donc partage cross-device cassé en démo)
- Redemption : URL `/creer?gift=CODE` ou via modal "J'ai un code cadeau"
- Modes :
  - `designed` : sender compose le bracelet → recipient peut modifier ou valider
  - `open` : sender choisit l'atelier → recipient compose entièrement
- **Aucun paiement réel.** À brancher : Stripe/Mollie + persistence serveur des
  codes (pour qu'ils marchent cross-device, qu'on puisse les invalider, etc.)

### Galerie ❌ retirée
La galerie publique des bracelets partagés a été retirée par décision produit.
**Ne pas implémenter côté back.** Si elle revient un jour, le code est dans
l'historique git (commits `01ddfc5` et `cb366ba`).

---

## 12. Internationalisation FR/EN

### Système maison ultra-léger
- Store : `src/lib/i18n/store.ts` (Zustand persist `mnb-lang`)
- Hook : `src/lib/i18n/use-t.ts` — `const { t, lang } = useT();`
- Dictionnaires : `src/lib/i18n/messages.ts` (~280 clés × 2 langues)
- Toggle : boutons FR/EN dans le Header (desktop + mobile menu)

### Convention de clés
Format `<namespace>.<feature>.<variant>`, ex : `gallery.empty.title`,
`fit.tooLong`, `giftModal.fromPlaceholder`.

Interpolation : `{0}`, `{1}` dans le message FR/EN, params passés à `t()`.

```ts
t('charm.subtitle.classicPlural', 3)
// → FR : "Optionnel. Jusqu'à 3 charms."
// → EN : "Optional. Up to 3 charms."
```

### Conversion d'unités
Mode EN convertit automatiquement :
- mm → inches (`/25.4`) via `formatBeadSize`, `formatCmFromMm`, `formatCm`
- Dates : `Intl.DateTimeFormat` reçoit `'en-GB'` au lieu de `'fr-FR'`

### Contenu non-traduit (volontairement)
- Noms de perles (`Bead.name` dans les mocks)
- Descriptions / taglines des ateliers
- Tags des kits

C'est du contenu éditorial qui sera traduit via le futur CMS, pas via le dict
i18n. Si Aurélien gère un back avec CMS, prévois ces champs en multilingue
(`{ fr: '…', en: '…' }`).

---

## 13. Contrat API recommandé

Voici les endpoints que le front consommera quand il quittera les mocks. Le
shape suit les types canoniques de §3.

### Catalogue
```
GET  /api/beads                    → Bead[]
GET  /api/charms                   → Charm[]
GET  /api/ateliers                 → Atelier[]
GET  /api/kits                     → Kit[]
```

> Astuce : ces données changent rarement → bonne candidate pour cache CDN
> avec ETag/If-None-Match.

### Stock
```
PATCH /api/beads/:id                  body: { stock: number }
PATCH /api/charms/:id                 body: { stock: number }
```
Idéalement, le décrément est **atomique** lors de la commande (transaction
sur la commande + stock).

### Commandes
```
POST /api/orders                     body: { lines: CartLine[], shippingAddress, ... }
                                     → { orderNumber, paymentIntentClientSecret }
GET  /api/orders/:orderNumber        → Order (avec status, tracking, etc.)
```

> Pricing : **recalculer le total côté serveur**, ne jamais faire confiance à
> `config.price` envoyé par le client.

### Cartes cadeaux
```
POST /api/gift-cards                 body: { kind, design?, atelierId?, sender, recipient, message }
                                     → { code: 'MNB-XXXX-XXXX' }
GET  /api/gift-cards/:code           → GiftCard (avec status)
POST /api/gift-cards/:code/redeem    → { ok: true } (mark as redeemed)
```

### Partage (déjà OK côté front)
Les liens `?design=<encoded>` encodent le design **dans l'URL** (base64+JSON).
Pas besoin d'endpoint serveur pour ça. Voir `src/lib/utils/share-design.ts`.

---

## 14. Commandes utiles + arborescence

### Commandes npm

```bash
npm run dev              # serveur Next dev sur localhost:3000
npm run build            # build production
npm run start            # serveur production
npm run lint             # ESLint
npm run typecheck        # TypeScript strict (tsc --noEmit)
npm run test             # vitest
npm run sync:beads       # regénère bead-photos.generated.ts
npm run sync:charms      # regénère charm-photos.generated.ts
npm run sync:all         # les deux
npm run detour:bead -- "in.jpg" "out.png"   # détoure une photo brute
```

### Arborescence des dossiers clés

```
mnb-ecommerce/
├── public/photos/                      ← 📸 PHOTOS PRODUITS (zone Aurélien)
│   ├── beads/                          ← perles (PNG transparents)
│   ├── charms/                         ← charms classique (vide pour l'instant)
│   ├── figurines/                      ← figurines kawaii
│   └── atelier-*.jpg                   ← photos d'ateliers (cards)
│
├── scripts/                            ← scripts Python d'intégration photo
│   ├── sync_beads.py                   ← scan /beads et émet le manifest TS
│   ├── sync_charms.py                  ← scan /charms + /figurines
│   ├── detour_bead.py                  ← rembg pour retirer le fond
│   └── README.md                       ← guide rapide (à lire en complément)
│
├── src/
│   ├── types/index.ts                  ← 📚 TYPES CANONIQUES (source de vérité)
│   ├── lib/
│   │   ├── mocks/                      ← données catalogue
│   │   │   ├── beads.ts                ← LE CATALOGUE PERLES (à éditer)
│   │   │   ├── charms.ts               ← catalogue charms / figurines
│   │   │   ├── ateliers.ts             ← définition des 3 ateliers
│   │   │   ├── kits.ts                 ← catalogue kits prêt-à-emporter
│   │   │   ├── bead-photos.generated.ts    ← AUTO-GÉNÉRÉ, ne pas éditer
│   │   │   └── charm-photos.generated.ts   ← AUTO-GÉNÉRÉ, ne pas éditer
│   │   ├── store/                      ← Zustand stores
│   │   │   ├── cart.ts
│   │   │   ├── configurator.ts         ← gros fichier, logique du configurator
│   │   │   └── gift-cards.ts
│   │   ├── i18n/                       ← FR/EN
│   │   │   ├── store.ts
│   │   │   ├── messages.ts
│   │   │   └── use-t.ts
│   │   ├── utils/
│   │   │   ├── format.ts               ← formatPrice, formatCmFromMm, …
│   │   │   ├── gift-code.ts
│   │   │   └── share-design.ts
│   │   └── harmony/
│   │       ├── rules.ts                ← logique "Inspire-moi"
│   │       └── coach.ts
│   ├── components/
│   │   ├── configurator/               ← le gros morceau
│   │   ├── commerce/                   ← cart drawer + cart line
│   │   ├── gifts/                      ← gift modals
│   │   ├── ui/                         ← primitives (Button, Input, BraceletGlyph…)
│   │   ├── editorial/                  ← homepage components
│   │   └── layout/                     ← Header, Footer
│   └── app/                            ← Next App Router
│       ├── (marketing)/
│       │   ├── page.tsx                ← homepage
│       │   ├── creer/                  ← /creer (configurator)
│       │   └── kits/                   ← /kits
│       └── (checkout)/
│           └── commande/               ← /commande (checkout)
│
├── BACKEND_GUIDE.md                    ← ce fichier
└── package.json
```

---

## 15. FAQ rapide

### Q1 — Une perle existe dans `beads.ts` mais elle n'apparaît pas dans le configurator ?
**R :** Soit (a) le PNG est manquant dans `public/photos/beads/` (le mock filtre
les perles sans photo via `images.length > 0`), soit (b) la famille n'est pas
dans `allowedBeadFamilies` de l'atelier choisi. Vérifie dans cet ordre.

### Q2 — Comment je teste que ma nouvelle perle fonctionne ?
1. `npm run sync:beads` (génère le manifest)
2. `npm run typecheck` (zéro erreur attendue)
3. `npm run dev` puis va sur `/creer`, choisis Classique, onglet "Pierres"
4. La perle doit apparaître dans la palette → clique → elle apparaît sur le bracelet

### Q3 — J'ai déposé un PNG mais le sync ne le voit pas
- Vérifie que le filename est en `.png` (pas `.PNG` ni `.jpeg`)
- Vérifie qu'il n'y a pas d'espace dans le nom
- Vérifie que l'`id` correspondant existe dans `beads.ts` (sinon le script
  affiche un warning et skip)

### Q4 — Je veux une perle qui apparaît dans le panier comme "rupture"
Le front ne lit pas encore `stock`. Tant que le back ne renvoie pas `stock: 0`
dans une route catalogue, il n'y a rien à faire ici. Le jour où on branche le
back, on pourra ajouter une logique `disabled={bead.stock === 0}` dans
`BeadPicker.tsx`.

### Q5 — Qu'est-ce que `slotId` dans `BraceletComponent` ?
Un id local généré côté front (`uid('s')`) servant de clé React stable + de
target pour les actions click-to-remove. **Pas un id catalogue.** Le back peut
l'ignorer / le re-générer en serializing.

### Q6 — Pourquoi `images: string[]` et pas `image: string` ?
Pour permettre plusieurs angles / variantes de la même perle plus tard. Pour
l'instant on n'utilise que `images[0]`. Le sync script remplit toujours
`images = [unique URL]`.

### Q7 — Comment ajouter Sanrio Hello Kitty ?
1. Ajouter une entrée dans `src/lib/mocks/charms.ts` :
   ```ts
   {
     id: 'charm_figurine_hello_kitty',
     name: 'Hello Kitty',
     category: 'kawaii',
     material: 'email',
     kind: 'figurine',                ← important !
     sizeMm: 14,
     price: 0,                        ← prix de base, surcharge gère le supplément
     stock: 30,
     description: 'Figurine Hello Kitty officielle Sanrio.',
     images: [],
     licensed: 'sanrio',
     surcharge: 6,                    ← +6 € au prix du bracelet
   }
   ```
2. Drop `charm_figurine_hello_kitty.png` dans `public/photos/figurines/`
3. `npm run sync:charms`

### Q8 — Y a-t-il des tests ?
Oui (`vitest`), partiels. `src/lib/store/configurator.test.ts` et
`src/lib/utils/share-design.test.ts`. Pas de coverage pour le catalogue.
À enrichir si on touche au pricing.

---

## Conclusion

**Pour récapituler le plus actionnable côté Aurélien** :

🔄 Workflow standard pour ajouter une perle photographiée :
```bash
# 1. Ajoute l'entrée dans src/lib/mocks/beads.ts (avec un id unique)
# 2. Drop le PNG nommé <id>.png dans public/photos/beads/
npm run sync:beads
npm run typecheck   # vérification
npm run dev         # vérification visuelle
```

📦 Pour ouvrir un nouveau dossier de stock (ex. nouvelle famille de pierres) :
```bash
# 1. Ajouter la famille à src/types/index.ts (StoneFamily union)
# 2. L'ajouter à STONE_FAMILIES dans src/lib/mocks/ateliers.ts
# 3. L'ajouter à STANDARD_BEAD_FAMILIES (et éventuellement ENTRY_BEAD_FAMILIES)
# 4. Ajouter les perles individuelles via le workflow ci-dessus
```

📞 Si quelque chose te semble bizarre, regarde dans cet ordre :
1. Console browser (F12) — erreurs runtime
2. `npm run typecheck` — erreurs TypeScript
3. Terminal du serveur dev — logs de build
4. Demande à Thibe ou Dany.

Bonne chance Aurélien ! 🚀
