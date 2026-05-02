'use client';

import { ShoppingBag } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { useCart, cartSubtotal, cartShipping, cartTotal } from '@/lib/store/cart';
import { useT } from '@/lib/i18n/use-t';
import { formatPrice } from '@/lib/utils/format';
import { CartLineItem } from './CartLineItem';

export function CartDrawer() {
  const { lines, isOpen, close } = useCart();
  const subtotal = cartSubtotal(lines);
  const shipping = cartShipping(subtotal);
  const total = cartTotal(lines);
  const { t } = useT();

  return (
    <Drawer
      open={isOpen}
      onClose={close}
      title={t('cart.title')}
      footer={
        lines.length > 0 ? (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between text-[14px]">
              <span className="text-[var(--color-graphite)]">{t('checkout.subtotal')}</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[14px]">
              <span className="text-[var(--color-graphite)]">{t('checkout.shipping')}</span>
              <span className="tabular-nums">
                {shipping === 0 ? t('checkout.shippingFree') : formatPrice(shipping)}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-[var(--color-line)]">
              <span className="text-[13px] text-[var(--color-graphite)]">{t('checkout.total')}</span>
              <span className="font-serif text-[22px] tabular-nums">{formatPrice(total)}</span>
            </div>
            <Button href="/commande" onClick={close} fullWidth size="lg">
              {t('cart.checkout')}
            </Button>
            <button
              type="button"
              onClick={close}
              className="text-[12px] text-[var(--color-muted)] link-underline self-center"
            >
              {t('cart.continueShopping')}
            </button>
          </div>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 px-8 gap-4">
          <ShoppingBag size={32} strokeWidth={1} className="text-[var(--color-muted)]" />
          <p className="text-display-s">{t('cart.empty.title')}</p>
          <p className="text-[14px] text-[var(--color-graphite)]">
            {t('cart.empty.subtitle')}
          </p>
          <div className="mt-2 flex flex-col gap-2 w-full max-w-[220px]">
            <Button href="/kits" onClick={close} variant="primary" fullWidth>
              {t('cart.empty.viewKits')}
            </Button>
            <Button href="/creer" onClick={close} variant="outline" fullWidth>
              {t('cart.empty.create')}
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
