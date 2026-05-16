/**
 * Thin Shopify Storefront API client.
 *
 * Server-side only — DO NOT import this from a Client Component.
 * The Storefront token is technically public-safe, but keeping it
 * server-side means future scope/token changes don't require a redeploy
 * of the bundled JS.
 *
 * Used by :
 *   - `src/app/api/shopify/cart/route.ts`        (cartCreate mutation)
 *   - `src/lib/shopify/variants.ts`              (SKU → variant GID resolution)
 *
 * All catalog data (beads, charms, ateliers, kits) STAYS in `src/lib/mocks/`
 * because Shopify products don't carry the front-side metadata (hex, shape,
 * sizeMm, etc.) needed by the 2D configurator. Shopify is used purely for
 * checkout + (eventually) stock decrement.
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? '';
const SHOPIFY_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ?? '';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-01';

/** True if both required env vars are present. Used by `/api/shopify/cart`
 *  to fail fast with a 503 instead of a cryptic GraphQL error. */
export function shopifyEnabled(): boolean {
  return Boolean(SHOPIFY_DOMAIN && SHOPIFY_TOKEN);
}

export class ShopifyError extends Error {
  status: number;
  constructor(message: string, status = 500) {
    super(message);
    this.name = 'ShopifyError';
    this.status = status;
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[] }>;
}

/**
 * Execute a Storefront API GraphQL request.
 *
 * @param query    GraphQL query/mutation string
 * @param variables Variables hash (optional)
 * @param cacheSec If > 0, lets Next cache the response for that many seconds.
 *                 Use 0 for mutations (cartCreate) — never cache.
 */
export async function shopifyFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
  cacheSec = 0,
): Promise<T> {
  if (!shopifyEnabled()) {
    throw new ShopifyError(
      'Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local',
      503,
    );
  }

  const url = `https://${SHOPIFY_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': SHOPIFY_TOKEN,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    // Mutations : no cache. Catalog queries (variants resolution) :
    // 60 seconds is fine — variant IDs almost never change post-import.
    next: cacheSec > 0 ? { revalidate: cacheSec } : { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new ShopifyError(`Shopify HTTP ${res.status}: ${text.slice(0, 500)}`, res.status);
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new ShopifyError(
      `Shopify GraphQL error: ${json.errors.map((e) => e.message).join('; ')}`,
      400,
    );
  }
  if (!json.data) {
    throw new ShopifyError('Shopify response missing data', 500);
  }
  return json.data;
}
