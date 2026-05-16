/**
 * Decrement bead/charm stock via the Shopify Admin API after a successful
 * bracelet purchase.
 *
 * Called by :
 *   - `src/app/api/shopify/webhook/orders-paid/route.ts`     (production)
 *   - `src/app/api/shopify/admin/decrement-test/route.ts`    (manual test)
 *
 * Input shape — the `_composition_detail` JSON we attach to every cart line
 * in `src/lib/shopify/cart.ts`. We re-import the schema here loosely (just
 * the fields we read) to keep stock independent of cart.ts.
 *
 * Idempotency : decrement is NOT idempotent at the Admin API level. If the
 * webhook fires twice for the same order (Shopify retry on 5xx), stock
 * would be decremented twice. To prevent this in production we'd track
 * processed order_ids in a DB ; for V2 MVP we log a warning and accept the
 * occasional double-decrement (Shopify retries are rare).
 */

import { adminFetch, ShopifyAdminError } from './admin-client';

/* ─────────────────────────────────────────────────────────────
   Input — minimal shape, matches `_composition_detail` from cart.ts
───────────────────────────────────────────────────────────── */

export interface StockComponent {
  /** kind=bead or charm — used only to disambiguate SKU prefix if needed */
  kind: 'bead' | 'charm';
  /** mock id, e.g. "bead_turquoise_8" or "charm_tour_eiffel" */
  refId: string;
}

export interface StockDecrementInput {
  /** Bracelet/figurine composition. Both fields contribute to the decrement. */
  components: StockComponent[];
  /** Kawaii figurine — also counts as a stock unit. */
  figurine?: { kind: 'charm'; refId: string } | null;
  /** Multiplier — if the same bracelet design was bought in quantity 3, pass 3. */
  quantity?: number;
}

export interface StockDecrementResult {
  /** Per-SKU adjustments that were applied (or attempted in dry-run). */
  adjustments: Array<{
    sku: string;
    refId: string;
    delta: number;
    applied: boolean;
    /** Set when the SKU was skipped (e.g. missing on Shopify). */
    skippedReason?: string;
  }>;
}

/* ─────────────────────────────────────────────────────────────
   Internal cache — primary location + variant lookups
───────────────────────────────────────────────────────────── */

let primaryLocationIdCache: string | null = null;

const SKU_TO_INVENTORY_ITEM_CACHE = new Map<string, string>();

async function getPrimaryLocationId(): Promise<string> {
  if (primaryLocationIdCache) return primaryLocationIdCache;
  const data = await adminFetch<{
    locations: { nodes: Array<{ id: string; name: string; isActive: boolean }> };
  }>(/* GraphQL */ `
    query PrimaryLocation {
      locations(first: 5) {
        nodes { id name isActive }
      }
    }
  `);
  const active = data.locations.nodes.find((l) => l.isActive) ?? data.locations.nodes[0];
  if (!active) {
    throw new ShopifyAdminError('No location available in this Shopify store', 500);
  }
  primaryLocationIdCache = active.id;
  return active.id;
}

interface VariantBySkuResponse {
  productVariants: {
    nodes: Array<{
      id: string;
      sku: string | null;
      inventoryItem: { id: string };
    }>;
  };
}

async function getInventoryItemBySku(sku: string): Promise<string | null> {
  if (SKU_TO_INVENTORY_ITEM_CACHE.has(sku)) {
    return SKU_TO_INVENTORY_ITEM_CACHE.get(sku)!;
  }
  // Admin search syntax : sku:"<value>" — exact match.
  const data = await adminFetch<VariantBySkuResponse>(
    /* GraphQL */ `
      query VariantBySku($query: String!) {
        productVariants(first: 1, query: $query) {
          nodes {
            id
            sku
            inventoryItem { id }
          }
        }
      }
    `,
    { query: `sku:${sku}` },
  );
  const variant = data.productVariants.nodes[0];
  if (!variant) return null;
  SKU_TO_INVENTORY_ITEM_CACHE.set(sku, variant.inventoryItem.id);
  return variant.inventoryItem.id;
}

/* ─────────────────────────────────────────────────────────────
   Aggregation — count occurrences of each refId
───────────────────────────────────────────────────────────── */

/** Build a map refId → count (× quantity) from the composition. Exported for tests. */
export function countComponents(input: StockDecrementInput): Map<string, number> {
  const counts = new Map<string, number>();
  const qty = Math.max(1, input.quantity ?? 1);
  for (const c of input.components) {
    counts.set(c.refId, (counts.get(c.refId) ?? 0) + qty);
  }
  if (input.figurine) {
    counts.set(input.figurine.refId, (counts.get(input.figurine.refId) ?? 0) + qty);
  }
  return counts;
}

function skuForRefId(refId: string): string {
  // Must match the convention used by scripts/generate_bead_csv.ts.
  return `MNB-${refId}`;
}

/* ─────────────────────────────────────────────────────────────
   Public API
───────────────────────────────────────────────────────────── */

interface InventoryAdjustResponse {
  inventoryAdjustQuantities: {
    inventoryAdjustmentGroup: { id: string; createdAt: string } | null;
    userErrors: Array<{ field: string[] | null; message: string; code: string | null }>;
  };
}

/**
 * Decrement stock for every bead/charm in the composition.
 *
 * @param dryRun  When true, no Shopify mutation runs — only the planned
 *                adjustments are returned. Useful for the test endpoint.
 */
export async function decrementStockForComposition(
  input: StockDecrementInput,
  dryRun = false,
): Promise<StockDecrementResult> {
  const counts = countComponents(input);

  // Resolve all SKUs → inventory item IDs in parallel.
  const refIds = [...counts.keys()];
  const lookups = await Promise.all(
    refIds.map(async (refId) => {
      const sku = skuForRefId(refId);
      const inventoryItemId = await getInventoryItemBySku(sku);
      return { refId, sku, inventoryItemId, delta: -(counts.get(refId) ?? 0) };
    }),
  );

  // Partition into adjustable (found on Shopify) vs missing (skip + log).
  const adjustable = lookups.filter((l) => l.inventoryItemId !== null) as Array<{
    refId: string;
    sku: string;
    inventoryItemId: string;
    delta: number;
  }>;
  const missing = lookups.filter((l) => l.inventoryItemId === null);

  if (adjustable.length === 0) {
    return {
      adjustments: missing.map((m) => ({
        sku: m.sku,
        refId: m.refId,
        delta: m.delta,
        applied: false,
        skippedReason: 'SKU not found on Shopify — was scripts/out/shopify_beads.csv imported?',
      })),
    };
  }

  if (dryRun) {
    return {
      adjustments: [
        ...adjustable.map((a) => ({
          sku: a.sku,
          refId: a.refId,
          delta: a.delta,
          applied: false,
          skippedReason: 'dry-run',
        })),
        ...missing.map((m) => ({
          sku: m.sku,
          refId: m.refId,
          delta: m.delta,
          applied: false,
          skippedReason: 'SKU not found on Shopify',
        })),
      ],
    };
  }

  const locationId = await getPrimaryLocationId();

  // Single GraphQL call decrements all SKUs atomically (or fails all together).
  const data = await adminFetch<InventoryAdjustResponse>(
    /* GraphQL */ `
      mutation InventoryAdjust($input: InventoryAdjustQuantitiesInput!) {
        inventoryAdjustQuantities(input: $input) {
          inventoryAdjustmentGroup { id createdAt }
          userErrors { field message code }
        }
      }
    `,
    {
      input: {
        reason: 'other',
        name: 'available',
        // Free-form note that appears in the inventory history — helpful
        // for debugging when stock looks wrong.
        referenceDocumentUri: 'logical://mnb-bracelet-order',
        changes: adjustable.map((a) => ({
          delta: a.delta,
          inventoryItemId: a.inventoryItemId,
          locationId,
        })),
      },
    },
  );

  const { userErrors, inventoryAdjustmentGroup } = data.inventoryAdjustQuantities;
  if (userErrors.length) {
    throw new ShopifyAdminError(
      `inventoryAdjustQuantities errors: ${userErrors.map((e) => e.message).join('; ')}`,
      400,
      userErrors,
    );
  }
  if (!inventoryAdjustmentGroup) {
    throw new ShopifyAdminError('inventoryAdjustQuantities returned no adjustment group', 500);
  }

  return {
    adjustments: [
      ...adjustable.map((a) => ({
        sku: a.sku,
        refId: a.refId,
        delta: a.delta,
        applied: true,
      })),
      ...missing.map((m) => ({
        sku: m.sku,
        refId: m.refId,
        delta: m.delta,
        applied: false,
        skippedReason: 'SKU not found on Shopify',
      })),
    ],
  };
}

/** Test-only reset of internal caches. */
export function _resetStockCaches(): void {
  primaryLocationIdCache = null;
  SKU_TO_INVENTORY_ITEM_CACHE.clear();
}
