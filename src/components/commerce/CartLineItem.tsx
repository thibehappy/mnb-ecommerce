'use client';

import { Trash2 } from 'lucide-react';
import type { CartLine } from '@/types';
import { useCart, subtotalForLine } from '@/lib/store/cart';
import { targetMm as targetMmOf } from '@/lib/store/configurator';
import { useT } from '@/lib/i18n/use-t';
import { formatCm, formatPrice } from '@/lib/utils/format';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { BraceletPreview } from '@/components/configurator/BraceletPreview';

export function CartLineItem({ line }: { line: CartLine }) {
  const { updateQuantity, remove } = useCart();
  const lineTotal = subtotalForLine(line);
  const { t, lang } = useT();

  // Reuse the configurator's fulfillment labels so the wording stays in
  // sync with the picker. Strip the " · recommandé" / " · recommended"
  // suffix for the cart line — that's a recommendation hint, not part of
  // the actual product label.
  const fulfillment =
    line.config.fulfillmentMode === 'diy-kit'
      ? t('fulfillment.diy.label').replace(' · recommandé', '').replace(' · recommended', '')
      : t('fulfillment.assembled.label');

  return (
    <div className="flex gap-4 p-4">
      <div className="w-28 shrink-0 bg-[var(--color-canvas)] rounded-sm flex items-center">
        <BraceletPreview
          components={line.config.components}
          targetMm={targetMmOf(line.config.atelierId, line.config.sizeCm)}
          variant="flat"
        />
      </div>
      <div className="flex flex-col flex-1 gap-2 min-w-0">
        <p className="text-eyebrow text-[var(--color-muted)]">{t('cartLine.creation')}</p>
        <p className="font-serif text-[17px] truncate">{line.config.title ?? t('cartLine.titleFallback')}</p>
        <p className="text-[12px] text-[var(--color-graphite)]">
          {line.config.components.length} {t('cartLine.elements')} · {t('cartLine.size')} {formatCm(line.config.sizeCm, lang)} · {fulfillment}
        </p>
        <div className="flex items-center justify-between mt-auto">
          <QuantityStepper
            size="sm"
            value={line.quantity}
            onChange={(v) => updateQuantity(line.lineId, v)}
          />
          <span className="tabular-nums text-[15px]">{formatPrice(lineTotal)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => remove(line.lineId)}
        aria-label={t('configurator.remove')}
        className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors self-start"
      >
        <Trash2 size={15} strokeWidth={1.4} />
      </button>
    </div>
  );
}
