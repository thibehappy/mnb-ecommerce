/**
 * Build a Shopify cart from the front-side CartLine[] state and call the
 * Storefront `cartCreate` mutation.
 *
 * The composition of each custom bracelet (beads, charms, figurine, size,
 * fulfillment mode) is encoded as **line item properties** so :
 *   - The customer sees ONE line in their Shopify cart ("Bracelet Kawaii")
 *     and not 30 separate bead lines.
 *   - The atelier (Paris) sees the full composition in the order detail.
 *   - Stock decrement at the bead-level can be implemented later via a
 *     `orders/paid` webhook that reads the `_composition_detail` JSON.
 *
 * V1 limitations (documented for V2 follow-up) :
 *   - Surcharges (Sanrio/Disney figurines +6 €, extra charms +1/+3 €)
 *     are NOT yet applied — the cart bills the atelier base price only.
 *     Will be fixed by adding "Supplement" Shopify variants and emitting
 *     extra cart lines when surcharge > 0.
 *   - Bead-level stock is NOT decremented — Shopify only decrements the
 *     synthetic "Bracelet personnalise" variant (which has 10k stock).
 */

import type { BraceletConfig, CartLine } from '@/types';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { shopifyFetch, ShopifyError } from './client';
import { resolveVariantGid } from './variants';

/* ─────────────────────────────────────────────────────────────
   GraphQL
───────────────────────────────────────────────────────────── */

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation CartCreate($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        id
        checkoutUrl
        totalQuantity
      }
      userErrors {
        field
        message
        code
      }
    }
  }
`;

interface CartCreateResponse {
  cartCreate: {
    cart: { id: string; checkoutUrl: string; totalQuantity: number } | null;
    userErrors: Array<{ field: string[] | null; message: string; code: string | null }>;
  };
}

/* ─────────────────────────────────────────────────────────────
   Type aliases for the Shopify input
───────────────────────────────────────────────────────────── */

interface ShopifyAttribute {
  key: string;
  value: string;
}

interface ShopifyCartLineInput {
  merchandiseId: string;
  quantity: number;
  attributes: ShopifyAttribute[];
}

/* ─────────────────────────────────────────────────────────────
   SKU mapping (front → Shopify)
───────────────────────────────────────────────────────────── */

function skuForCustom(config: BraceletConfig): string {
  const atelier = ATELIER_BY_ID[config.atelierId];
  switch (atelier?.slug) {
    case 'bracelet-bar':
      return 'MNB-CUSTOM-BAR';
    case 'kawaii':
      return 'MNB-CUSTOM-KAWAII';
    case 'classique':
      return 'MNB-CUSTOM-CLASSIQUE';
    default:
      throw new ShopifyError(`Unknown atelier "${config.atelierId}" — no Shopify SKU mapping`, 400);
  }
}

/* ─────────────────────────────────────────────────────────────
   Line item properties — build the human-readable + atelier-usable
   metadata that travels with the order.
───────────────────────────────────────────────────────────── */

/** Human summary like "Turquoise brute ×4 · Perle nacrée ×6 · Lune dorée ×1".
 *  Truncated to 480 chars to stay under Shopify's per-attribute limit. */
function compositionSummary(config: BraceletConfig): string {
  const counts = new Map<string, number>();
  for (const c of config.components) {
    counts.set(c.refId, (counts.get(c.refId) ?? 0) + 1);
  }
  if (config.figurine) {
    counts.set(config.figurine.refId, (counts.get(config.figurine.refId) ?? 0) + 1);
  }
  const parts: string[] = [];
  for (const [refId, count] of counts.entries()) {
    const bead = BEAD_BY_ID[refId];
    const charm = CHARM_BY_ID[refId];
    const name = bead?.name ?? charm?.name ?? refId;
    parts.push(`${name} ×${count}`);
  }
  const joined = parts.join(' · ');
  return joined.length > 480 ? `${joined.slice(0, 477)}...` : joined;
}

function attributesForCustom(config: BraceletConfig): ShopifyAttribute[] {
  const atelier = ATELIER_BY_ID[config.atelierId];
  const attrs: ShopifyAttribute[] = [];

  // Visible to the customer (no underscore prefix).
  attrs.push({ key: 'Atelier', value: atelier?.name ?? config.atelierId });

  if (config.title) {
    attrs.push({ key: 'Titre', value: config.title.slice(0, 100) });
  }

  if (atelier?.sizing.mode === 'user-pick') {
    attrs.push({ key: 'Taille', value: `${config.sizeLabel} (${config.sizeCm} cm)` });
  } else if (atelier?.sizing.mode === 'fixed-range') {
    const totalMm = config.components.reduce((sum, c) => {
      const bead = BEAD_BY_ID[c.refId];
      const charm = CHARM_BY_ID[c.refId];
      return sum + (bead?.sizeMm ?? charm?.sizeMm ?? 0);
    }, 0);
    attrs.push({ key: 'Circonference', value: `${totalMm} mm` });
  }

  if (config.fulfillmentMode) {
    attrs.push({
      key: 'Finition',
      value:
        config.fulfillmentMode === 'diy-kit'
          ? 'Kit DIY (a monter chez vous)'
          : 'Assemble a Paris',
    });
  }

  if (config.figurine) {
    const figurine = CHARM_BY_ID[config.figurine.refId];
    if (figurine) {
      attrs.push({ key: 'Figurine', value: figurine.name });
      if (figurine.licensed) {
        attrs.push({ key: 'Licence', value: figurine.licensed });
      }
    }
  }

  if (config.intention) {
    attrs.push({ key: 'Intention', value: config.intention.slice(0, 200) });
  }

  attrs.push({ key: 'Composition', value: compositionSummary(config) });

  // Hidden from the customer (underscore prefix) but visible to the atelier
  // in the Shopify Order detail. This is the source-of-truth used by the
  // workshop to assemble the bracelet.
  attrs.push({ key: '_design_id', value: config.id });
  const detail = JSON.stringify({
    atelierId: config.atelierId,
    sizeLabel: config.sizeLabel,
    sizeCm: config.sizeCm,
    components: config.components,
    figurine: config.figurine,
    figurineChainId: config.figurineChainId ?? null,
    figurineClaspId: config.figurineClaspId ?? null,
    fulfillmentMode: config.fulfillmentMode ?? null,
    price: config.price,
  });
  // Shopify allows up to 64 KB per attribute value, plenty of headroom for a
  // typical bracelet config (~2 KB), but we cap defensively.
  attrs.push({ key: '_composition_detail', value: detail.slice(0, 8000) });

  return attrs;
}

/* ─────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────── */

/** Internal — exported for tests. */
export async function buildShopifyLines(
  lines: CartLine[],
): Promise<ShopifyCartLineInput[]> {
  const out: ShopifyCartLineInput[] = [];
  for (const line of lines) {
    const sku = skuForCustom(line.config);
    const merchandiseId = await resolveVariantGid(sku);
    out.push({
      merchandiseId,
      quantity: line.quantity,
      attributes: attributesForCustom(line.config),
    });
  }
  return out;
}

export interface CreatedCart {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
}

/**
 * Create a Shopify cart from front-side CartLine[] and return the
 * checkoutUrl the user should be redirected to.
 */
export async function createShopifyCart(lines: CartLine[]): Promise<CreatedCart> {
  if (!lines.length) {
    throw new ShopifyError('Cannot create an empty Shopify cart', 400);
  }
  const shopifyLines = await buildShopifyLines(lines);
  const data = await shopifyFetch<CartCreateResponse>(CART_CREATE_MUTATION, {
    input: { lines: shopifyLines },
  });
  const { cart, userErrors } = data.cartCreate;
  if (userErrors.length) {
    throw new ShopifyError(
      `Shopify cart userErrors: ${userErrors.map((e) => e.message).join('; ')}`,
      400,
    );
  }
  if (!cart) {
    throw new ShopifyError('Shopify returned no cart object', 500);
  }
  return cart;
}
