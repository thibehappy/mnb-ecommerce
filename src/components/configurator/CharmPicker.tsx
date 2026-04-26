'use client';

import { useMemo, useState } from 'react';
import { CHARMS } from '@/lib/mocks/charms';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useConfigurator } from '@/lib/store/configurator';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import type { CharmCategory } from '@/types';
import { haptic } from '@/lib/utils/feedback';
import { cn } from '@/lib/utils/cn';

const CATEGORY_LABELS: Record<CharmCategory, string> = {
  lettre: 'Lettres',
  coeur: 'Cœurs',
  etoile: 'Étoiles',
  animal: 'Animaux',
  kawaii: 'Kawaii',
  symbole: 'Symboles',
  fleur: 'Fleurs',
  lune: 'Lunes',
};

interface CharmPickerProps {
  onTilePointerDown?: (refId: string, e: React.PointerEvent) => void;
}

export function CharmPicker({ onTilePointerDown }: CharmPickerProps = {}) {
  const addCharm = useConfigurator((s) => s.addCharm);
  const atelierId = useConfigurator((s) => s.atelierId);
  const components = useConfigurator((s) => s.components);
  const atelier = ATELIER_BY_ID[atelierId];

  const [category, setCategory] = useState<CharmCategory | null>(null);

  const atelierCharms = useMemo(() => {
    if (!atelier) return CHARMS;
    return CHARMS.filter((c) => atelier.allowedCharmCategories.includes(c.category));
  }, [atelier]);

  const categories = useMemo(
    () => Array.from(new Set(atelierCharms.map((c) => c.category))) as CharmCategory[],
    [atelierCharms],
  );

  const filtered = atelierCharms.filter((c) => !category || c.category === category);

  const charmsCount = components.filter((c) => c.kind === 'charm').length;
  const max = atelier?.maxCharms ?? 0;
  const atLimit = charmsCount >= max;

  if (!atelier?.allowCharms) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-[#718096] italic">
          Cet atelier ne comprend pas de charms.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-black text-[#2D3748] uppercase tracking-tighter mb-1">
            Ajoutez des charms
          </h3>
          <p className="text-[13px] text-[#718096] italic">
            Optionnel. Jusqu&rsquo;à {max} charm{max > 1 ? 's' : ''}.
          </p>
        </div>
        <div
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest tabular-nums',
            atLimit
              ? 'bg-[#3D5A73] text-white'
              : 'bg-[#F5F0E8] text-[#2D3748] border border-[#EEE9E0]',
          )}
        >
          {charmsCount}/{max}
        </div>
      </div>

      {categories.length > 1 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4] mb-2">
            Catégorie
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Chip active={!category} onClick={() => setCategory(null)}>
              Tous
            </Chip>
            {categories.map((cat) => (
              <Chip key={cat} active={category === cat} onClick={() => setCategory(cat)}>
                {CATEGORY_LABELS[cat]}
              </Chip>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {filtered.map((charm) => (
            <button
              key={charm.id}
              type="button"
              disabled={atLimit}
              onPointerDown={(e) => {
                if (atLimit) return;
                onTilePointerDown?.(charm.id, e);
              }}
              onClick={() => {
                addCharm(charm.id);
                haptic(8);
              }}
              className="group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 bg-[#F5F0E8] rounded-xl md:rounded-2xl border border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:bg-[#F5F0E8] disabled:hover:shadow-none cursor-grab active:cursor-grabbing touch-none select-none"
              aria-label={`Ajouter ${charm.name}`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110 h-14 w-14 flex items-center justify-center">
                <CharmGlyph category={charm.category} material={charm.material} size={48} />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-[#2D3748] truncate leading-tight">
                  {charm.name}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors',
        active
          ? 'bg-[#3D5A73] text-white'
          : 'border border-[#EEE9E0] text-[#718096] bg-white hover:text-[#2D3748] hover:border-[#3D5A73]',
      )}
    >
      {children}
    </button>
  );
}
