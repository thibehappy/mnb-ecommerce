'use client';

import { ShoppingBag } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useCart, cartSubtotal, cartShipping, cartTotal } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/format';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const { lines, isOpen, close } = useCart();
  const subtotal = cartSubtotal(lines);
  const shipping = cartShipping(subtotal);
  const total = cartTotal(lines);

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title="Votre panier"
      footer={
        lines.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-[14px]">
              <span className="text-[var(--color-graphite)]">Sous-total</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[var(--color-graphite)]">Livraison</span>
              <span className="tabular-nums">
                {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-[var(--color-line)]">
              <span className="text-[13px] text-[var(--color-graphite)]">Total</span>
              <span className="font-serif text-[22px] tabular-nums">{formatPrice(total)}</span>
            </div>
            <Button href="/commande" onClick={close} fullWidth size="lg">
              Passer commande
            </Button>
            <button
              type="button"
              onClick={close}
              className="text-[12px] text-[var(--color-muted)] link-underline self-center"
            >
              Continuer mes achats
            </button>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-8 gap-4">
          <ShoppingBag size={32} strokeWidth={1} className="text-[var(--color-muted)]" />
          <p className="text-display-s">Votre panier est vide</p>
          <p className="text-[14px] text-[var(--color-graphite)]">
            Découvrez nos kits ou composez un bracelet unique.
          </p>
          <div className="mt-2 flex flex-col gap-2 w-full max-w-[220px]">
            <Button href="/kits" onClick={close} variant="primary" fullWidth>
              Voir les kits
            </Button>
            <Button href="/creer" onClick={close} variant="outline" fullWidth>
              Créer un bracelet
            </Button>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-[var(--color-line)]">
          {lines.map((line) => (
            <li key={line.lineId}>
              <CartLineItem line={line} />
            </li>
          ))}
        </ul>
      )}
    </Drawer>
  );
}
