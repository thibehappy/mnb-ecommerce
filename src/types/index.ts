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
  /**
   * Optional override for the BeadPicker tile zoom. When the source PNG
   * occupies more of the frame than the shape's default crop ratio assumes
   * (e.g. tightly-cropped animal silhouettes, 2-bead "paire" photos), the
   * picker tile renders the bead too large. Setting `pickerZoom: 1.5` (vs
   * the default 3.0 for nugget/round) brings the visual size back in line
   * with neighbouring tiles.
   *
   * Affects ONLY the BeadPicker (right panel). The bracelet preview, drag
   * ghost, and CompositionTray keep the shape-based default — `sizeMm` is
   * the source of truth for bracelet length calculations.
   */
  pickerZoom?: number;
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
  /** Per-piece surcharge added to the bracelet total **always**, regardless
   *  of how many other charms are placed (typically 6 € for licensed
   *  Sanrio / Disney figurines). */
  surcharge?: Euros;
  /**
   * Per-piece fee that applies **only** when this charm is placed
   * BEYOND the atelier's included `maxCharms` (e.g. 4th, 5th… charm on
   * Classique). The first `maxCharms` charms ride free with the bracelet
   * price ; any extra charm bumps the total by its own `extraFee`.
   *
   * Different charms have different extra fees (Tour Eiffel +1 €, médaille
   * gravée +3 €, …). When omitted, falls back to
   * `DEFAULT_EXTRA_CHARM_FEE` (1 €) — see `extraCharmsFee()` in
   * `src/lib/store/configurator.ts`.
   *
   * Independent from `surcharge`. A charm may have both (rare).
   */
  extraFee?: Euros;
}

/* ─────────────────────────────────────────────────────────────
   Attachment system (Kawaii)

   A Kawaii bracelet's figurine doesn't sit on the cord — it dangles
   from the bracelet wire via a small ball-chain (the AttachmentChain)
   ending in a snap-ring (the AttachmentClasp). Both are user-customised
   in the picker and rendered next to the figurine in the previews.

   Two distinct catalogues so the user can mix-and-match (e.g. red chain
   + blue heart clasp). Both are PNG-based, photographed individually
   then composited in the SVG. Photos live in /public/photos/attachments/
   and the manifest is generated by `npm run sync:attachments`.
───────────────────────────────────────────────────────────── */

export type ChainColor =
  | 'black'
  | 'orange'
  | 'red'
  | 'brown'
  | 'olive'
  | 'green'
  | 'purple'
  | 'lime'
  | 'magenta'
  | 'navy'
  | 'gray';

export interface AttachmentChain {
  id: UUID;
  name: string;
  color: ChainColor;
  /** Hex of the metallic balls — used for the small swatch in the
   *  picker. The actual bracelet preview always uses the photo. */
  hex: string;
  images: string[];
}

export type ClaspShape = 'round' | 'heart';

export interface AttachmentClasp {
  id: UUID;
  name: string;
  shape: ClaspShape;
  /** Body color (visible on swatches). */
  hex: string;
  /** Optional dot color for polka-dot variants — purely informational
   *  for swatch rendering, the photo carries the actual decoration. */
  dotsHex?: string;
  images: string[];
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
   Bracelet custom configuration
───────────────────────────────────────────────────────────── */
export interface BraceletComponent {
  /** Random id for key + reorder */
  slotId: string;
  kind: 'bead' | 'charm';
  refId: UUID;
  /**
   * Visual orientation flip — adds an extra +180° rotation to the photo
   * on the cord. Only meaningful for asymmetric beads (heart / star /
   * bow / flower) where the catalogue PNG points in a fixed direction
   * but the user wants to mirror it (e.g. heart pointing down → up).
   *
   * Round/faceted/rondelle beads are rotation-invariant so the flag has
   * no visible effect there. Charms aren't flipped (they hang from the
   * anneau by gravity ; flipping would point the body upward).
   *
   * Defaults to undefined (= not flipped). Persisted in the store /
   * shared URLs / cart snapshots so the orientation survives reloads.
   */
  flipped?: boolean;
}

export type FulfillmentMode = 'assembled-paris' | 'diy-kit';

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
  /** Id of the small ball-chain that links the figurine to the bracelet
   *  wire (Kawaii only). Refers to `AttachmentChain.id` in the catalogue.
   *  `null` / `undefined` means no chain choice — the renderer will fall
   *  back to the default. Only meaningful when `figurine` is non-null. */
  figurineChainId?: string | null;
  /** Id of the snap-ring/heart that hooks the chain onto the bracelet
   *  wire (Kawaii only). Refers to `AttachmentClasp.id`. Same fallback
   *  semantics as `figurineChainId`. */
  figurineClaspId?: string | null;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** Non-null once saved server-side */
  ownerId?: UUID;
  /** Human-given title, for saved designs */
  title?: string;
  /** Short intention printed/attached to the handmade order when available. */
  intention?: string;
  /** Chosen at the final step: handmade assembly in Paris or home DIY kit. */
  fulfillmentMode?: FulfillmentMode;
  /** Fixed price from atelier.sizes — single source of truth */
  price: Euros;
}

/* ─────────────────────────────────────────────────────────────
   Cart / Order
───────────────────────────────────────────────────────────── */
export type CartLineKind = 'custom';

export interface CartLine {
  lineId: string;
  kind: 'custom';
  config: BraceletConfig;
  quantity: number;
}

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
