/**
 * POST /api/shopify/cart
 *
 * Body :
 *   {
 *     lines: CartLine[]   // exact shape from src/lib/store/cart.ts
 *   }
 *
 * Response (200) :
 *   {
 *     checkoutUrl: string,
 *     cartId: string,
 *     totalQuantity: number
 *   }
 *
 * Response (4xx/5xx) :
 *   {
 *     error: string,
 *     code?: string
 *   }
 *
 * Called from :
 *   - src/components/commerce/CartDrawer.tsx (cart drawer "Passer au paiement" button)
 *   - src/app/(checkout)/panier/CartPageClient.tsx ("Passer commande" button)
 *
 * The endpoint is intentionally STATELESS — every call creates a fresh
 * Shopify cart. The Zustand cart (localStorage) is the source of truth on
 * the front ; Shopify only holds the cart for the duration of the checkout
 * funnel. After successful checkout, Shopify creates an Order ; the front
 * clears its local cart via the `cart_completed` page (V2) or simply
 * loses the data on next mount (V1, acceptable).
 */

import { NextResponse } from 'next/server';
import type { CartLine } from '@/types';
import { createShopifyCart } from '@/lib/shopify/cart';
import { ShopifyError, shopifyEnabled } from '@/lib/shopify/client';

// Force this route to run on Node (not edge) — the Shopify GraphQL client
// uses Node-style fetch behavior + we want server-only env access.
export const runtime = 'nodejs';

interface RequestBody {
  lines?: CartLine[];
}

export async function POST(req: Request) {
  if (!shopifyEnabled()) {
    return NextResponse.json(
      {
        error:
          'Shopify is not configured on this deployment. ' +
          'Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local',
      },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const lines = body.lines;
  if (!Array.isArray(lines) || lines.length === 0) {
    return NextResponse.json({ error: 'lines[] is empty' }, { status: 400 });
  }

  try {
    const cart = await createShopifyCart(lines);
    return NextResponse.json({
      checkoutUrl: cart.checkoutUrl,
      cartId: cart.id,
      totalQuantity: cart.totalQuantity,
    });
  } catch (err) {
    if (err instanceof ShopifyError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('Unexpected Shopify cart error:', err);
    const message = err instanceof Error ? err.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
