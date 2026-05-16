/**
 * Shopify Admin API client — distinct from the Storefront client.
 *
 * Admin API is required for :
 *   - Mutating inventory (`inventoryAdjustQuantities`) on the bead/charm
 *     stock SKUs after a bracelet purchase.
 *   - Looking up the primary location (needed for inventory mutations).
 *
 * Token form : `shpat_...` (NOT the 32-char hex Storefront token). Created
 * in Shopify Admin > Parametres > Apps et canaux > Develop apps.
 *
 * Scopes required (set at app-creation time) :
 *   - read_products       (find variants by SKU)
 *   - read_inventory      (read current stock levels)
 *   - write_inventory     (decrement on order)
 *   - read_locations      (find primary location ID)
 *
 * Server-side only — DO NOT import from a Client Component.
 */

const SHOPIFY_DOMAIN = process.env.SHOPIFY_STORE_DOMAIN ?? '';
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ?? '';
const SHOPIFY_API_VERSION = process.env.SHOPIFY_API_VERSION ?? '2025-01';

export function adminEnabled(): boolean {
  return Boolean(SHOPIFY_DOMAIN && ADMIN_TOKEN);
}

export class ShopifyAdminError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status = 500, details?: unknown) {
    super(message);
    this.name = 'ShopifyAdminError';
    this.status = status;
    this.details = details;
  }
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; path?: string[]; extensions?: unknown }>;
}

/**
 * Execute an Admin API GraphQL request. Admin API never caches — every call
 * goes through. The Admin API has a leaky-bucket rate limit (1000 cost
 * points per minute by default); a single inventory mutation costs ~10
 * points, so we're nowhere near the limit for typical order volumes.
 */
export async function adminFetch<T = unknown>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  if (!adminEnabled()) {
    throw new ShopifyAdminError(
      'Shopify Admin API not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local',
      503,
    );
  }

  const url = `https://${SHOPIFY_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
    // Admin API responses are always live — never cache.
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '<no body>');
    throw new ShopifyAdminError(
      `Shopify Admin HTTP ${res.status}: ${text.slice(0, 500)}`,
      res.status,
    );
  }

  const json = (await res.json()) as GraphQLResponse<T>;
  if (json.errors?.length) {
    throw new ShopifyAdminError(
      `Shopify Admin GraphQL: ${json.errors.map((e) => e.message).join('; ')}`,
      400,
      json.errors,
    );
  }
  if (!json.data) {
    throw new ShopifyAdminError('Shopify Admin response missing data', 500);
  }
  return json.data;
}
