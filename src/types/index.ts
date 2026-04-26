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
  | 'moonstone';

export type BeadShape = 'round' | 'faceted' | 'rondelle' | 'nugget' | 'tube';

export type BeadSize = 4 | 6 | 8 | 10;

export interface Bead {
  id: UUID;
  name: string;
  family: StoneFamily;
  hex: string;
  /** Optional secondary color for natural veining on the 2D preview */
  veinHex?: string;
  shape: BeadShape;
  size: BeadSize;
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
  | 'lune';

export type CharmMaterial = 'dore' | 'argente' | 'email' | 'pierre';

export interface Charm {
  id: UUID;
  name: string;
  category: CharmCategory;
  material: CharmMaterial;
  price: Euros;
  stock: number;
  description: string;
  images: string[];
  /** Pixel width on the 2D canvas (relative unit) */
  renderSize?: number;
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
export type SizeLabel = 'S' | 'M' | 'L';

export interface AtelierSize {
  label: SizeLabel;
  cm: number;
}

export interface Atelier {
  id: UUID;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
  /** Fabric: "Fil élastique", "Fil de fer mémoire", etc. */
  wireType: string;
  /** Fixed bead count for this atelier — user must pick exactly this many */
  beadCount: number;
  /** Which stone families are compatible with this atelier (wire + style) */
  allowedBeadFamilies: StoneFamily[];
  /** Which charm categories are on the table */
  allowedCharmCategories: CharmCategory[];
  /** Allow adding charms at all */
  allowCharms: boolean;
  /** Max charms the user can add */
  maxCharms: number;
  /** Fixed price for this atelier — the same regardless of size */
  price: Euros;
  /** Sizes available (label + cm only, prices are at the atelier level) */
  sizes: AtelierSize[];
  /** For filtering beads, preferred bead sizes (e.g. Premium uses 8mm) */
  preferredBeadSizes?: BeadSize[];
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
  /** Size chosen for that atelier */
  sizeLabel: SizeLabel;
  sizeCm: number;
  components: BraceletComponent[];
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Non-null once saved server-side */
  ownerId?: UUID;
  /** Human-given title, for saved designs */
  title?: string;
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
