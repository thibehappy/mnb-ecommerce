'use client';

/**
 * Client-side hook that POSTs the current Zustand cart to /api/shopify/cart
 * and redirects the browser to the returned Shopify checkoutUrl.
 *
 * Usage :
 *   const { startCheckout, isStarting, error } = useShopifyCheckout();
 *   <Button onClick={startCheckout} loading={isStarting}>Passer au paiement</Button>
 *
 * Why not call cartCreate directly from the client ?
 *   - We don't want the Storefront token in the JS bundle.
 *   - We want a single server-side place to evolve the Shopify mapping
 *     (line item properties shape, future surcharges, etc.).
 */

import { useCallback, useState } from 'react';
import { useCart } from '@/lib/store/cart';

interface CheckoutResponse {
  checkoutUrl?: string;
  cartId?: string;
  error?: string;
}

export function useShopifyCheckout() {
  const lines = useCart((s) => s.lines);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCheckout = useCallback(async () => {
    if (lines.length === 0) {
      setError('Votre panier est vide');
      return;
    }
    setIsStarting(true);
    setError(null);
    try {
      const res = await fetch('/api/shopify/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lines }),
      });
      const data = (await res.json()) as CheckoutResponse;
      if (!res.ok || !data.checkoutUrl) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      // Full-page redirect — Shopify owns the checkout funnel from here.
      // Note: we intentionally do NOT clear the local cart yet — the user
      // could close the Shopify tab and come back. The cart is cleared by
      // the success-return webhook (V2) or simply ignored on next mount.
      window.location.href = data.checkoutUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(message);
      setIsStarting(false);
    }
    // Do NOT setIsStarting(false) on success — we're navigating away.
  }, [lines]);

  return { startCheckout, isStarting, error };
}
