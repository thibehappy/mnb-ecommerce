/**
 * Resolve front-side SKUs (e.g. "MNB-CUSTOM-KAWAII") to Shopify variant
 * GIDs (e.g. "gid://shopify/ProductVariant/45678901234").
 *
 * Strategy : on first request, query the bracelet product by handle,
 * collect all variants, and cache the SKU → GID map in memory for the
 * lifetime of the server process (Next will recycle the cache on a
 * cold start). Re-queries happen only on cache miss.
 *
 * Why SKU-based mapping rather than env vars ?
 *   - SKUs are stable & meaningful in the front code.
 *   - Variant GIDs are opaque and change if you delete/re-create a variant.
 *   - Adding a new SKU on the front needs zero env-var ops.
 */

import { shopifyFetch, ShopifyError } from './client';

interface VariantsQueryResponse {
  product: {
    handle: string;
    variants: {
      nodes: Array<{ id: string; sku: string | null; availableForSale: boolean }>;
    };
  } | null;
}

const PRODUCT_VARIANTS_QUERY = /* GraphQL */ `
  query ProductVariants($handle: String!) {
    product(handle: $handle) {
      handle
      variants(first: 50) {
        nodes {
          id
          sku
          availableForSale
        }
      }
    }
  }
`;

/** SKU → variant GID. Populated lazily, never invalidated within a process. */
const skuCache = new Map<string, string>();

/** Track handles we've already loaded to avoid redundant lookups. */
const loadedHandles = new Set<string>();

function getHandles(): string[] {
  return [process.env.SHOPIFY_HANDLE_BRACELET ?? 'bracelet-personnalise-mnb'];
}

/**
 * Load variants for one product handle into the cache. Safe to call
 * repeatedly — short-circuits if the handle was already loaded.
 */
async function loadProductVariants(handle: string): Promise<void> {
  if (loadedHandles.has(handle)) return;
  const data = await shopifyFetch<VariantsQueryResponse>(
    PRODUCT_VARIANTS_QUERY,
    { handle },
    60, // cache for 60s on the Next side
  );
  if (!data.product) {
    // Mark as loaded anyway — no point retrying if the handle doesn't exist.
    // The caller will hit "variant not found" next, with a clear message.
    loadedHandles.add(handle);
    return;
  }
  for (const variant of data.product.variants.nodes) {
    if (variant.sku) {
      skuCache.set(variant.sku, variant.id);
    }
  }
  loadedHandles.add(handle);
}

/**
 * Resolve a SKU to a Shopify variant GID. Throws ShopifyError(404) if
 * not found after consulting both registered handles.
 */
export async function resolveVariantGid(sku: string): Promise<string> {
  if (skuCache.has(sku)) {
    return skuCache.get(sku)!;
  }
  for (const handle of getHandles()) {
    await loadProductVariants(handle);
    if (skuCache.has(sku)) {
      return skuCache.get(sku)!;
    }
  }
  throw new ShopifyError(
    `Shopify variant not found for SKU "${sku}". Did you import scripts/out/shopify_products.csv?`,
    404,
  );
}

/** Test-only — clear the in-memory cache. */
export function _resetVariantCache(): void {
  skuCache.clear();
  loadedHandles.clear();
}
