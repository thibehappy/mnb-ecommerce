'use client';

import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { CartLineItem } from '@/components/commerce/CartLineItem';
import { useCart, cartSubtotal, cartShipping, cartTotal } from '@/lib/store/cart';
import { formatPrice } from '@/lib/utils/format';

export function CartPageClient() {
  const lines = useCart((s) => s.lines);
  const subtotal = cartSubtotal(lines);
  const shipping = cartShipping(subtotal);
  const total = cartTotal(lines);

  return (
    <div className="container-editorial py-10 lg:py-16">
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Panier' }]} />
      <h1 className="text-display-l mt-8 mb-10">Votre panier</h1>

      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-6 bg-[var(--color-paper)] rounded-sm">
          <ShoppingBag size={40} strokeWidth={1} className="text-[var(--color-muted)]" />
          <div>
            <p className="font-serif text-[26px] mb-2">Votre panier est vide</p>
            <p className="text-[15px] text-[var(--color-graphite)] max-w-sm">
              Parcourez nos kits ou composez votre propre bracelet.
            </p>
          </div>
          <div className="flex gap-3 flex-wrap justify-center">
            <Button href="/kits">Voir les kits</Button>
            <Button href="/creer" variant="outline">
              Créer un bracelet
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          <ul className="lg:col-span-7 divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
            {lines.map((line) => (
              <li key={line.lineId}>
                <CartLineItem line={line} />
              </li>
            ))}
          </ul>

          <aside className="lg:col-span-5 lg:sticky lg:top-28 bg-[var(--color-paper)] p-6 lg:p-8 rounded-sm">
            <h2 className="text-display-s mb-6">Récapitulatif</h2>
            <dl className="space-y-3 mb-6 pb-6 border-b border-[var(--color-line)]">
              <div className="flex justify-between text-[14px]">
                <dt className="text-[var(--color-graphite)]">Sous-total</dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-[14px]">
                <dt className="text-[var(--color-graphite)]">Livraison</dt>
                <dd className="tabular-nums">
                  {shipping === 0 ? 'Offerte' : formatPrice(shipping)}
                </dd>
              </div>
            </dl>
            <div className="flex justify-between items-baseline mb-8">
              <span className="text-[13px] text-[var(--color-graphite)]">Total TTC</span>
              <span className="font-serif text-[28px] tabular-nums">{formatPrice(total)}</span>
            </div>
            <Button href="/commande" fullWidth size="lg">
              Passer commande
            </Button>
            <p className="text-caption mt-4 text-center">
              Paiement sécurisé · Livraison 2-4 jours
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
