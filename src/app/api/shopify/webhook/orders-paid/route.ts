/**
 * POST /api/shopify/webhook/orders-paid
 *
 * Receives the Shopify `orders/paid` webhook. For each line item whose
 * `_composition_detail` line item property is present, decrements the
 * stock of every bead/charm in the composition via the Admin API.
 *
 * Subscribe in Shopify Admin :
 *   Parametres > Notifications > Webhooks > Ajouter
 *     - Topic        : "Order payment"  (= orders/paid)
 *     - URL          : https://<your-deploy>/api/shopify/webhook/orders-paid
 *     - Format       : JSON
 *     - API version  : matches SHOPIFY_API_VERSION
 *   Then paste the displayed secret into SHOPIFY_WEBHOOK_SECRET in .env.local.
 *
 * Local testing (no public URL) : use `/api/shopify/admin/decrement-test`
 * with a curl payload — same logic, no HMAC check.
 *
 * Security : verifies X-Shopify-Hmac-Sha256 against the raw body using
 * SHOPIFY_WEBHOOK_SECRET. Rejects with 401 on mismatch.
 *
 * Idempotency : NOT idempotent — Shopify retries on 5xx will double-
 * decrement. V2.1 will add an order_id deduplication table.
 */

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  decrementStockForComposition,
  type StockComponent,
  type StockDecrementInput,
} from '@/lib/shopify/stock';
import { adminEnabled, ShopifyAdminError } from '@/lib/shopify/admin-client';

export const runtime = 'nodejs';
// We MUST disable response caching — every webhook delivery is unique.
export const dynamic = 'force-dynamic';

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET ?? '';

/* ─────────────────────────────────────────────────────────────
   Shopify webhook payload — minimal shape (we only read what we need).
   Reference : https://shopify.dev/docs/api/admin-rest/2025-01/resources/order
───────────────────────────────────────────────────────────── */

interface WebhookLineItemProperty {
  name: string;
  value: string;
}

interface WebhookLineItem {
  id: number;
  quantity: number;
  sku: string | null;
  title: string;
  /** Line item properties (a.k.a. attributes in the Storefront cart). */
  properties?: WebhookLineItemProperty[];
}

interface WebhookOrder {
  id: number;
  name: string; // e.g. "#1042"
  line_items: WebhookLineItem[];
}

/* ─────────────────────────────────────────────────────────────
   HMAC verification
───────────────────────────────────────────────────────────── */

function verifyHmac(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader || !WEBHOOK_SECRET) return false;
  const computed = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(rawBody, 'utf8')
    .digest('base64');
  // Constant-time compare to avoid timing-attack leaks on the secret.
  const a = Buffer.from(computed);
  const b = Buffer.from(signatureHeader);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/* ─────────────────────────────────────────────────────────────
   Line item property parsing
───────────────────────────────────────────────────────────── */

interface ParsedComposition {
  components: StockComponent[];
  figurine?: { kind: 'charm'; refId: string } | null;
}

/**
 * Extract the `_composition_detail` JSON from a webhook line item's
 * properties. Returns null if the line is not a MNB custom bracelet
 * (e.g. it's a kit, or a New-Site-MNB-2 perle lot).
 */
function parseLineItemComposition(line: WebhookLineItem): ParsedComposition | null {
  const props = line.properties ?? [];
  const detail = props.find((p) => p.name === '_composition_detail');
  if (!detail) return null;
  try {
    const parsed = JSON.parse(detail.value) as {
      components?: Array<{ kind: 'bead' | 'charm'; refId: string }>;
      figurine?: { kind: 'charm'; refId: string } | null;
    };
    return {
      components: parsed.components ?? [],
      figurine: parsed.figurine ?? null,
    };
  } catch (err) {
    console.warn(`[webhook] Failed to parse _composition_detail for line ${line.id}:`, err);
    return null;
  }
}

/* ─────────────────────────────────────────────────────────────
   Handler
───────────────────────────────────────────────────────────── */

export async function POST(req: Request) {
  if (!adminEnabled() || !WEBHOOK_SECRET) {
    // 503 makes Shopify retry — that's actually correct behaviour : we WANT
    // it to retry once the deployment is properly configured.
    console.error('[webhook] orders-paid received but admin/secret not configured');
    return NextResponse.json(
      { error: 'Admin API or webhook secret not configured on this deployment' },
      { status: 503 },
    );
  }

  const rawBody = await req.text();
  const signature = req.headers.get('x-shopify-hmac-sha256');

  if (!verifyHmac(rawBody, signature)) {
    console.warn('[webhook] HMAC mismatch — rejecting');
    // 401 makes Shopify mark the delivery as failed (no retry storm).
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let order: WebhookOrder;
  try {
    order = JSON.parse(rawBody) as WebhookOrder;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Aggregate ALL custom-bracelet line items into a single decrement call.
  // Each bracelet's quantity multiplies its composition's stock impact.
  const aggregated: StockDecrementInput = {
    components: [],
    figurine: null,
    quantity: 1,
  };

  let processedLines = 0;
  for (const line of order.line_items) {
    const composition = parseLineItemComposition(line);
    if (!composition) continue;
    processedLines++;
    // Replicate the components by quantity. (Aggregating across lines means
    // we can't model a "1 figurine" cap — but for stock decrement we want
    // the total count anyway.)
    for (let i = 0; i < line.quantity; i++) {
      aggregated.components.push(...composition.components);
      if (composition.figurine) {
        // Figurines are part of the bracelet too — flatten into components
        // so countComponents() picks them up.
        aggregated.components.push(composition.figurine);
      }
    }
  }

  if (processedLines === 0) {
    // No MNB custom bracelets in this order — nothing to decrement. Could
    // be a New-Site-MNB-2 perle lot order, or a kit-only order.
    console.log(`[webhook] order ${order.name} (#${order.id}): no custom bracelets, skip`);
    return NextResponse.json({ ok: true, processedLines: 0 });
  }

  try {
    const result = await decrementStockForComposition(aggregated);
    const applied = result.adjustments.filter((a) => a.applied).length;
    const skipped = result.adjustments.filter((a) => !a.applied);
    console.log(
      `[webhook] order ${order.name} (#${order.id}): ${applied} SKUs decremented` +
        (skipped.length ? `, ${skipped.length} skipped` : ''),
    );
    if (skipped.length) {
      console.warn('[webhook] skipped adjustments:', skipped);
    }
    return NextResponse.json({
      ok: true,
      orderId: order.id,
      orderName: order.name,
      processedLines,
      adjustments: result.adjustments,
    });
  } catch (err) {
    if (err instanceof ShopifyAdminError) {
      console.error(`[webhook] Admin error for order ${order.name}:`, err.message, err.details);
      // 500 → Shopify will retry. Acceptable for transient errors.
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error('[webhook] Unexpected error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal error' },
      { status: 500 },
    );
  }
}
