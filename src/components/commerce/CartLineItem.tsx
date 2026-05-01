'use client';

import { Trash2 } from 'lucide-react';
import type { CartLine } from '@/types';
import { KIT_BY_ID } from '@/lib/mocks/kits';
import { useCart, subtotalForLine } from '@/lib/store/cart';
import { targetMm as targetMmOf } from '@/lib/store/configurator';
import { formatPrice } from '@/lib/utils/format';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { KitVisual } from '@/components/ui/KitVisual';
import { BraceletPreview } from '@/components/configurator/BraceletPreview';

export function CartLineItem({ line }: { line: CartLine }) {
  const { updateQuantity, remove } = useCart();
  const lineTotal = subtotalForLine(line);

  if (line.kind === 'kit') {
    const kit = KIT_BY_ID[line.kitId];
    if (!kit) return null;
    return (
      <div className="flex gap-4 p-4">
        <div className="w-20 shrink-0">
          <KitVisual palette={kit.palette} name={kit.name} />
        </div>
        <div className="flex flex-col flex-1 gap-2 min-w-0">
          <p className="text-eyebrow text-[var(--color-muted)]">Kit</p>
          <p className="font-serif text-[17px] truncate">{kit.name}</p>
          <p className="text-[12px] text-[var(--color-graphite)] truncate">{kit.tagline}</p>
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
          aria-label="Retirer"
          className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors self-start"
        >
          <Trash2 size={15} strokeWidth={1.4} />
        </button>
      </div>
    );
  }

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
        <p className="text-eyebrow text-[var(--color-muted)]">Création</p>
        <p className="font-serif text-[17px] truncate">{line.config.title ?? 'Bracelet personnalisé'}</p>
        <p className="text-[12px] text-[var(--color-graphite)]">
          {line.config.components.length} éléments · taille {line.config.sizeCm}cm
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
        aria-label="Retirer"
        className="text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors self-start"
      >
        <Trash2 size={15} strokeWidth={1.4} />
      </button>
    </div>
  );
}
