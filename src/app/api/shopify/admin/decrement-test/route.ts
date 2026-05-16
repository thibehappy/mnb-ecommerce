/**
 * POST /api/shopify/admin/decrement-test
 *
 * Manual trigger for the stock decrement logic — bypass the Shopify
 * webhook so you can test locally without ngrok / Shopify CLI tunnel,
 * OR retroactively decrement an order whose webhook didn't fire.
 *
 * Body — two input modes :
 *
 *   A. Manual components (synthetic test) :
 *      {
 *        components: Array<{kind:'bead'|'charm', refId: string}>,
 *        figurine?:  {kind:'charm', refId: string} | null,
 *        quantity?:  number,                  // default 1
 *        dryRun?:    boolean                  // default true
 *      }
 *
 *   B. Existing Shopify order (fetch + parse + decrement) :
 *      {
 *        orderName: string,                   // e.g. "1042" or "#1042"
 *        dryRun?:   boolean                   // default true
 *      }
 *      The route fetches the order via Admin API, extracts the
 *      `_composition_detail` from each line item's properties, aggregates,
 *      and decrements. Requires the `read_orders` scope on the Admin app.
 *
 * Examples (bash curl) :
 *
 *   # A — dry-run from explicit components :
 *   curl -X POST http://localhost:3000/api/shopify/admin/decrement-test \
 *     -H "Content-Type: application/json" \
 *     -d '{"components":[{"kind":"bead","refId":"bead_turquoise_8"}],"dryRun":true}'
 *
 *   # B — REAL decrement of order #1042 (full composition from the order) :
 *   curl -X POST http://localhost:3000/api/shopify/admin/decrement-test \
 *     -H "Content-Type: application/json" \
 *     -d '{"orderName":"1042","dryRun":false}'
 *
 * SECURITY NOTE : NO authentication. Gated behind NODE_ENV !== 'production'
 * so it 404s on Vercel deploys.
 */

import { NextResponse } from 'next/server';
import {
  decrementStockForComposition,
  type StockComponent,
  type StockDecrementInput,
} from '@/lib/shopify/stock';
import { adminEnabled, adminFetch, ShopifyAdminError } from '@/lib/shopify/admin-client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface RequestBody {
  // Mode A — explicit composition
  components?: StockComponent[];
  figurine?: { kind: 'charm'; refId: string } | null;
  quantity?: number;
  // Mode B — order lookup
  orderName?: string;
  // Common
  dryRun?: boolean;
}

/* ─────────────────────────────────────────────────────────────
   Mode B — fetch the order from Shopify and pull composition
   straight from the `_composition_detail` line item properties.
───────────────────────────────────────────────────────────── */

interface AdminOrderResponse {
  orders: {
    nodes: Array<{
      id: string;
      name: string;
      lineItems: {
        nodes: Array<{
          id: string;
          quantity: number;
          customAttributes: Array<{ key: string; value: string }>;
        }>;
      };
    }>;
  };
}

const ORDER_BY_NAME_QUERY = /* GraphQL */ `
  query OrderByName($query: String!) {
    orders(first: 1, query: $query) {
      nodes {
        id
        name
        lineItems(first: 50) {
          nodes {
            id
            quantity
            customAttributes { key value }
          }
        }
      }
    }
  }
`;

async function compositionFromOrder(orderName: string): Promise<{
  input: StockDecrementInput;
  orderId: string;
  resolvedName: string;
  processedLines: number;
}> {
  // Shopify order names are "#1042" — accept "1042" too and prepend # for the query.
  const trimmed = orderName.trim().replace(/^#/, '');
  const data = await adminFetch<AdminOrderResponse>(ORDER_BY_NAME_QUERY, {
    query: `name:#${trimmed}`,
  });
  const order = data.orders.nodes[0];
  if (!order) {
    throw new ShopifyAdminError(`Order "#${trimmed}" not found via Admin API`, 404);
  }

  const components: StockComponent[] = [];
  let processedLines = 0;
  for (const line of order.lineItems.nodes) {
    const detailAttr = line.customAttributes.find((a) => a.key === '_composition_detail');
    if (!detailAttr) continue;
    processedLines++;
    let parsed: { components?: StockComponent[]; figurine?: StockComponent | null };
    try {
      parsed = JSON.parse(detailAttr.value);
    } catch {
      console.warn(`[decrement-test] line ${line.id}: invalid _composition_detail JSON`);
      continue;
    }
    // Same logic as the webhook : flatten figurine into components, multiply by line.quantity.
    for (let i = 0; i < line.quantity; i++) {
      if (parsed.components) components.push(...parsed.components);
      if (parsed.figurine) components.push(parsed.figurine);
    }
  }
  return {
    input: { components, figurine: null, quantity: 1 },
    orderId: order.id,
    resolvedName: order.name,
    processedLines,
  };
}

/* ─────────────────────────────────────────────────────────────
   Handler
───────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }
  if (!adminEnabled()) {
    return NextResponse.json(
      { error: 'Admin API not configured. Set SHOPIFY_ADMIN_ACCESS_TOKEN in .env.local' },
      { status: 503 },
    );
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const dryRun = body.dryRun !== false;

  try {
    let input: StockDecrementInput;
    let meta: { orderId?: string; orderName?: string; processedLines?: number } = {};

    if (body.orderName) {
      // Mode B — pull from Shopify order
      const fetched = await compositionFromOrder(body.orderName);
      input = fetched.input;
      meta = {
        orderId: fetched.orderId,
        orderName: fetched.resolvedName,
        processedLines: fetched.processedLines,
      };
      if (fetched.processedLines === 0) {
        return NextResponse.json(
          {
            ...meta,
            warning:
              'Order found but no line items have _composition_detail — was the order placed via /api/shopify/cart?',
            adjustments: [],
            dryRun,
          },
          { status: 200 },
        );
      }
    } else {
      // Mode A — explicit components
      const components = body.components ?? [];
      if (!Array.isArray(components) || components.length === 0) {
        return NextResponse.json(
          { error: 'Provide either orderName OR components[]' },
          { status: 400 },
        );
      }
      input = {
        components,
        figurine: body.figurine ?? null,
        quantity: body.quantity ?? 1,
      };
    }

    const result = await decrementStockForComposition(input, dryRun);
    return NextResponse.json({ dryRun, ...meta, ...result });
  } catch (err) {
    if (err instanceof ShopifyAdminError) {
      return NextResponse.json({ error: err.message, details: err.details }, { status: err.status });
    }
    console.error('[decrement-test] unexpected:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
