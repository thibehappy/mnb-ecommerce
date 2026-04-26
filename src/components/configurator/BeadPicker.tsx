'use client';

import { useMemo, useState } from 'react';
import { BEADS } from '@/lib/mocks/beads';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useConfigurator } from '@/lib/store/configurator';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import type { BeadShape } from '@/types';
import { haptic } from '@/lib/utils/feedback';
import { cn } from '@/lib/utils/cn';

const SHAPE_LABELS: Record<BeadShape, string> = {
  round: 'Ronde',
  faceted: 'Facettée',
  rondelle: 'Rondelle',
  nugget: 'Brute',
  tube: 'Tube',
};

interface BeadPickerProps {
  /** Called on pointerdown over a tile so the parent can begin a drag-to-bracelet */
  onTilePointerDown?: (refId: string, e: React.PointerEvent) => void;
}

export function BeadPicker({ onTilePointerDown }: BeadPickerProps = {}) {
  const addBead = useConfigurator((s) => s.addBead);
  const atelierId = useConfigurator((s) => s.atelierId);
  const components = useConfigurator((s) => s.components);
  const atelier = ATELIER_BY_ID[atelierId];

  const [shapeFilter, setShapeFilter] = useState<BeadShape | null>(null);

  // Only beads compatible with the chosen atelier
  const atelierBeads = useMemo(() => {
    if (!atelier) return BEADS;
    return BEADS.filter((b) => {
      if (!atelier.allowedBeadFamilies.includes(b.family)) return false;
      if (atelier.preferredBeadSizes && !atelier.preferredBeadSizes.includes(b.size)) return false;
      return true;
    });
  }, [atelier]);

  const shapes = useMemo(
    () => Array.from(new Set(atelierBeads.map((b) => b.shape))) as BeadShape[],
    [atelierBeads],
  );

  const filtered = atelierBeads.filter((b) => !shapeFilter || b.shape === shapeFilter);

  const beadsCount = components.filter((c) => c.kind === 'bead').length;
  const max = atelier?.beadCount ?? 0;
  const atLimit = beadsCount >= max;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-black text-[#2D3748] uppercase tracking-tighter mb-1">
            Choisissez vos perles
          </h3>
          <p className="text-[13px] text-[#718096] italic">
            {atLimit
              ? 'Toutes vos perles sont placées. Retirez-en une pour changer.'
              : `Cliquez pour ajouter (${max - beadsCount} à placer)`}
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
          {beadsCount}/{max}
        </div>
      </div>

      {shapes.length > 1 && (
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4] mb-2">
            Forme
          </p>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={!shapeFilter} onClick={() => setShapeFilter(null)}>
              Toutes
            </FilterChip>
            {shapes.map((shape) => (
              <FilterChip
                key={shape}
                active={shapeFilter === shape}
                onClick={() => setShapeFilter(shape)}
              >
                {SHAPE_LABELS[shape]}
              </FilterChip>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="grid grid-cols-3 gap-2 md:gap-3">
          {filtered.map((bead) => (
            <button
              key={bead.id}
              type="button"
              disabled={atLimit}
              onPointerDown={(e) => {
                if (atLimit) return;
                onTilePointerDown?.(bead.id, e);
              }}
              onClick={() => {
                addBead(bead.id);
                haptic(4);
              }}
              className="group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 bg-[#F5F0E8] rounded-xl md:rounded-2xl border border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:bg-[#F5F0E8] disabled:hover:shadow-none cursor-grab active:cursor-grabbing touch-none select-none"
              aria-label={`Ajouter ${bead.name}`}
            >
              <div className="transition-transform duration-300 group-hover:scale-110">
                <StoneSwatch
                  hex={bead.hex}
                  veinHex={bead.veinHex}
                  size={54}
                  faceted={bead.shape === 'faceted'}
                />
              </div>
              <div className="text-center min-w-0 w-full">
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-[#2D3748] truncate leading-tight">
                  {bead.name.split(' ')[0]}
                </p>
                <p className="text-[9px] font-black text-[#A8BED4] uppercase tracking-widest tabular-nums">
                  {bead.size}mm
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  swatchHex,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  swatchHex?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors',
        active
          ? 'bg-[#3D5A73] text-white'
          : 'border border-[#EEE9E0] text-[#718096] bg-white hover:text-[#2D3748] hover:border-[#3D5A73]',
      )}
    >
      {swatchHex ? (
        <span
          className="inline-block h-3 w-3 rounded-full border border-black/10"
          style={{ backgroundColor: swatchHex }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
