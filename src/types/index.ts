/**
 * Shared domain types. These must match the back-end contract in API_CONTRACT.md.
 * The back-end developer is free to use these as DTO references.
 */

export type UUID = string;
export type ISODate = string;
export type Euros = number;

/* ─────────────────────────────────────────────────────────────
   Matières / catalogue
───────────────────────────────────────────────────────────── */
export type StoneFamily =
  | 'amethyst'
  | 'turquoise'
  | 'rose-quartz'
  | 'lapis'
  | 'onyx'
  | 'jade'
  | 'amber'
  | 'pearl'
  | 'citrine'
  | 'obsidian'
  | 'carnelian'
  | 'moonstone'
  | 'garnet'
  /** Enamel beads — émaillés colorés, formes (cœur, étoile, fleur, nœud)
   *  qui se passent sur le fil comme une perle classique. Non semi-précieux. */
  | 'enamel';

export type BeadShape =
  | 'round'
  | 'faceted'
  | 'rondelle'
  | 'nugget'
  | 'tube'
  | 'cube'
  /** Shaped enamel beads */
  | 'heart'
  | 'star'
  | 'flower'
  | 'bow';

export interface Bead {
  id: UUID;
  name: string;
  family: StoneFamily;
  hex: string;
  /** Optional secondary color for natural veining on the 2D preview */
  veinHex?: string;
  shape: BeadShape;
  /**
   * Diamètre mesuré de la perle, en mm. Contribue à la circonférence du
   * bracelet exactement (la somme des sizeMm des composants = circonférence).
   * Pour les formes non-rondes (cœur, étoile, …), c'est la longueur dans le
   * sens du fil — c'est-à-dire la projection horizontale quand le trou est
   * orienté nord-sud sur la photo source.
   */
  sizeMm: number;
  price: Euros;
  stock: number;
  /** Short editorial description (1–2 sentences) */
  description: string;
  /** Optional symbolism/meaning for filter + storytelling */
  meaning?: string[];
  images: string[];
}

export type CharmCategory =
  | 'lettre'
  | 'coeur'
  | 'etoile'
  | 'animal'
  | 'kawaii'
  | 'symbole'
  | 'fleur'
  | 'lune'
  | 'noeud';

export type CharmMaterial = 'dore' | 'argente' | 'email' | 'pierre';

/**
 * Sémantique d'usage :
 *   - 'charm'     → petit élément métallique/symbolique destiné au Classique,
 *                   inséré entre les perles (lettres, médailles, lunes…).
 *   - 'figurine'  → forme émaillée 3D pour le Kawaii (cœur, étoile, nœud…),
 *                   incluant les figurines licenciées Sanrio / Disney.
 *
 * Stockage des fichiers : `public/photos/charms/<id>.png` pour kind 'charm',
 * `public/photos/figurines/<id>.png` pour kind 'figurine'.
 */
export type CharmKind = 'charm' | 'figurine';

/** Marques licenciées sous-traitantes — déclenche la surcharge tarifaire. */
export type CharmLicense = 'sanrio' | 'disney';

export interface Charm {
  id: UUID;
  name: string;
  category: CharmCategory;
  material: CharmMaterial;
  /** Discriminator entre vrai charm (Classique) et figurine (Kawaii). */
  kind: CharmKind;
  price: Euros;
  stock: number;
  description: string;
  images: string[];
  /**
   * Largeur dans le sens du fil, en mm — contribue à la circonférence
   * exactement comme une perle. Mesure de la projection horizontale quand
   * le trou (axe nord-sud sur la photo source) est vertical.
   */
  sizeMm: number;
  /** Pixel width on the 2D canvas (relative unit) */
  renderSize?: number;
  /** Optional licensed brand (Sanrio / Disney) — only applies to figurines. */
  licensed?: CharmLicense;
  /** Per-piece surcharge added to the bracelet total
   *  (typically 6 € for licensed Sanrio / Disney figurines). */
  surcharge?: Euros;
}

export type BraceletBaseType = 'elastique' | 'cordon' | 'chaine-dore' | 'chaine-argent';

export interface BraceletBase {
  id: UUID;
  type: BraceletBaseType;
  name: string;
  description: string;
  price: Euros;
  /** Approximate number of beads that fit (for small wrist) */
  beadSlots: { small: number; medium: number; large: number };
  /** Wrist sizes in cm */
  sizes: { label: string; cm: number }[];
  images: string[];
}

/* ─────────────────────────────────────────────────────────────
   Atelier — workshop-style bracelet recipe (what you'd do in-store)
───────────────────────────────────────────────────────────── */
export type SizeLabel = 'S' | 'M' | 'L' | 'custom';

export interface AtelierSize {
  label: SizeLabel;
  cm: number;
}

/**
 * Sizing rules for the bracelet :
 *
 *   - 'user-pick' : the user explicitly chooses a target circumference via the
 *                   S/M/L/Perso selector. The total bead length must equal
 *                   the chosen sizeCm * 10 mm.
 *
 *   - 'fixed-range' : the bracelet has an inherent circumference range (e.g. a
 *                     memory wire). The user doesn't pick a size — the
 *                     circumference adapts to the beads placed, but must stay
 *                     within [minMm, maxMm]. Used for the Kawaii atelier.
 */
export type AtelierSizing =
  | { mode: 'user-pick' }
  | { mode: 'fixed-range'; minMm: number; maxMm: number };

export interface Atelier {
  id: UUID;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  /** Fabric: "Fil élastique", "Fil de fer mémoire", etc. */
  wireType: string;
  /** Sizing rules (see AtelierSizing) */
  sizing: AtelierSizing;
  /** Which stone families are compatible with this atelier (wire + style) */
  allowedBeadFamilies: StoneFamily[];
  /** Which charm categories are on the table */
  allowedCharmCategories: CharmCategory[];
  /** Allow adding charms at all */
  allowCharms: boolean;
  /** Max charms (or figurines) the user can place — discrete count cap on top
   *  of the length budget. Beads are not capped by count; the length budget
   *  alone limits how many fit. */
  maxCharms: number;
  /** Slack in mm allowed beyond the target circumference (for the clasp /
   *  comfort jeu). 0 means strict equality required. */
  slackMm: number;
  /** Fixed price for this atelier — the same regardless of size */
  price: Euros;
  /** Sizes available (label + cm only, prices are at the atelier level).
   *  Empty array for fixed-range ateliers that don't expose a size choice. */
  sizes: AtelierSize[];
}

/* ─────────────────────────────────────────────────────────────
   Kit (home creation box)
───────────────────────────────────────────────────────────── */
export type KitCategory = 'classique' | 'kawaii' | 'kawaii-premium';

/** Reference prices per category — single source of truth */
export const KIT_PRICES: Record<KitCategory, number> = {
  classique: 36,
  'kawaii-premium': 30,
  kawaii: 24,
};

/** Duo prices : a bit less than 2× single */
export const KIT_DUO_PRICES: Record<KitCategory, number> = {
  classique: 65,
  'kawaii-premium': 55,
  kawaii: 44,
};

export interface Kit {
  id: UUID;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  longDescription: string;
  /** Pricing tier — 24 / 30 / 36 € for solo, derived from KIT_PRICES + numberOfBracelets */
  category: KitCategory;
  price: Euros;
  /** Primary palette driving placeholder colors */
  palette: string[];
  /** Which stones appear in the kit */
  beads: { beadId: UUID; quantity: number }[];
  charms: { charmId: UUID; quantity: number }[];
  baseType: BraceletBaseType;
  /** Small editorial tags, e.g. "Fête des mères", "Estival", "Best-seller" */
  tags: string[];
  difficulty: 'debutant' | 'intermediaire' | 'expert';
  makeTime: string; // e.g. "30 min"
  /** 1 = solo, 2 = duo */
  numberOfBracelets: number;
  images: string[];
  /** Featured on home page */
  featured?: boolean;
  stock: number;
}

/* ─────────────────────────────────────────────────────────────
   Bracelet custom configuration
───────────────────────────────────────────────────────────── */
export interface BraceletComponent {
  /** Random id for key + reorder */
  slotId: string;
  kind: 'bead' | 'charm';
  refId: UUID;
}

export interface BraceletConfig {
  id: UUID;
  /** The chosen atelier (recipe) */
  atelierId: UUID;
  /** Size chosen for that atelier (only meaningful for user-pick sizing) */
  sizeLabel: SizeLabel;
  sizeCm: number;
  /** Dense ordered list of beads / charms strung on the cord. Position[0] is
   *  the first item on the bracelet, [N-1] the last. The total length
   *  (sum of sizeMm) ≤ targetMm of the atelier. */
  components: BraceletComponent[];
  /** Figurine attached to the bracelet (Kawaii only). Doesn't sit on the
   *  cord — rendered as a side decoration. Null when no figurine selected. */
  figurine: BraceletComponent | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Non-null once saved server-side */
  ownerId?: UUID;
  /** Human-given title, for saved designs */
  title?: string;
  /** Short intention printed/attached to the handmade order when available. */
  intention?: string;
  /** Fixed price from atelier.sizes — single source of truth */
  price: Euros;
}

/* ─────────────────────────────────────────────────────────────
   Cart / Order
───────────────────────────────────────────────────────────── */
export type CartLineKind = 'kit' | 'custom';

export interface CartLineKit {
  lineId: string;
  kind: 'kit';
  kitId: UUID;
  quantity: number;
}

export interface CartLineCustom {
  lineId: string;
  kind: 'custom';
  config: BraceletConfig;
  quantity: number;
}

export type CartLine = CartLineKit | CartLineCustom;

export interface Cart {
  lines: CartLine[];
  subtotal: Euros;
  shipping: Euros;
  total: Euros;
}

/* ─────────────────────────────────────────────────────────────
   Boutique (physical store)
───────────────────────────────────────────────────────────── */
export interface Boutique {
  id: UUID;
  name: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  hours: { day: string; open: string; close: string; closed?: boolean }[];
  mapsUrl: string;
  bookingUrl?: string;
  image: string;
}
