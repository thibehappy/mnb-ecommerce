'use client';

import { useRef, useState } from 'react';
import { Check, ShoppingBag } from 'lucide-react';
import type { Kit } from '@/types';
import { Button } from '@/components/ui/Button';
import { QuantityStepper } from '@/components/ui/QuantityStepper';
import { useCart } from '@/lib/store/cart';
import { successMoment } from '@/lib/utils/feedback';

export function AddKitCta({ kit }: { kit: Kit }) {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);
  const addKit = useCart((s) => s.addKit);

  function handleAdd() {
    addKit(kit, quantity);
    // Origin point for confetti = button center
    const rect = btnRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : undefined;
    successMoment(origin);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div className="flex flex-col gap-4" ref={btnRef}>
      <div className="flex items-center gap-4">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button
          onClick={handleAdd}
          size="lg"
          fullWidth
          disabled={kit.stock <= 0}
          className="flex-1"
        >
          {justAdded ? (
            <>
              <Check size={14} strokeWidth={2.2} />
              Ajouté au panier
            </>
          ) : (
            <>
              <ShoppingBag size={14} strokeWidth={1.5} />
              {kit.stock > 0 ? 'Ajouter au panier' : 'Rupture'}
            </>
          )}
        </Button>
      </div>
      <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
        {kit.stock > 10
          ? 'En stock · Prêt en 48h'
          : kit.stock > 0
            ? `Plus que ${kit.stock} en stock`
            : 'Momentanément indisponible'}
      </p>
    </div>
  );
}
