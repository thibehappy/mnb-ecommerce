'use client';

import { useMemo, useState } from 'react';
import { BEADS } from '@/lib/mocks/beads';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import {
  useConfigurator,
  totalLengthMm,
  targetMm as targetMmOf,
  canFit,
  getSizeFit,
} from '@/lib/store/configurator';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import type { BeadShape } from '@/types';
import { haptic } from '@/lib/utils/feedback';
import { beadPhotoZoom } from '@/lib/utils/bead-display';
import { formatCmFromMm } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';

const SHAPE_LABELS: Record<BeadShape, string> = {
  round: 'Ronde',
  faceted: 'Facettée',
  rondelle: 'Rondelle',
  nugget: 'Brute',
  tube: 'Tube',
  cube: 'Cube',
  heart: 'Cœur',
  star: 'Étoile',
  flower: 'Fleur',
  bow: 'Nœud',
};

interface BeadPickerProps {
  /** Called on pointerdown over a tile so the parent can begin a drag-to-bracelet */
  onTilePointerDown?: (refId: string, e: React.PointerEvent) => void;
}

export function BeadPicker({ onTilePointerDown }: BeadPickerProps = {}) {
  const addBead = useConfigurator((s) => s.addBead);
  const atelierId = useConfigurator((s) => s.atelierId);
  const sizeCm = useConfigurator((s) => s.sizeCm);
  const components = useConfigurator((s) => s.components);
  const atelier = ATELIER_BY_ID[atelierId];

  const [shapeFilter, setShapeFilter] = useState<BeadShape | null>(null);

  // Only beads compatible with the chosen atelier — and only those that have a real
  // product photo (we removed the SVG-fallback display: we surface the actual catalog only).
  const atelierBeads = useMemo(() => {
    const withPhoto = BEADS.filter((b) => b.images.length > 0);
    if (!atelier) return withPhoto;
    return withPhoto.filter((b) => atelier.allowedBeadFamilies.includes(b.family));
  }, [atelier]);

  const shapes = useMemo(
    () => Array.from(new Set(atelierBeads.map((b) => b.shape))) as BeadShape[],
    [atelierBeads],
  );

  const filtered = atelierBeads.filter((b) => !shapeFilter || b.shape === shapeFilter);

  const lengthMm = totalLengthMm(components);
  const targetMm = targetMmOf(atelierId, sizeCm);
  const fit = getSizeFit(atelierId, sizeCm, components);
  const canAddAny = atelierBeads.some((bead) => canFit(atelierId, sizeCm, components, bead.sizeMm));
  const atLimit = !canAddAny && components.length > 0;
  const helperText =
    fit.status === 'empty'
      ? `Encore ${formatCmFromMm(targetMm)} pour une taille parfaite`
      : fit.status === 'ready'
        ? 'Ajustement parfait. Vous pouvez commander ou retirer une perle pour changer.'
        : fit.status === 'too-long'
          ? `Trop long de ${formatCmFromMm(fit.overflowMm)}. Retirez une perle.`
          : atLimit
            ? 'Plus de place disponible. Retirez une perle pour changer.'
            : `Encore ${formatCmFromMm(fit.remainingMm)} pour une taille parfaite`;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-black text-[#2D3748] uppercase tracking-tighter mb-1">
            Choisissez vos perles
          </h3>
          <p className="text-[13px] text-[#718096] italic">{helperText}</p>
        </div>
        <div
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest tabular-nums',
            atLimit
              ? 'bg-[#3D5A73] text-white'
              : 'bg-[#F5F0E8] text-[#2D3748] border border-[#EEE9E0]',
          )}
        >
          {formatCmFromMm(lengthMm)} / {formatCmFromMm(targetMm)}
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
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#EEE9E0] bg-[#F5F0E8]/60 px-4 py-8 text-center">
            <p className="text-[12px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">
              Section vide
            </p>
            <p className="text-[13px] text-[#718096] italic">
              Aucune perle disponible pour le moment.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {filtered.map((bead) => {
              const fits = canFit(atelierId, sizeCm, components, bead.sizeMm);
              const disabled = !fits;
              const variant = beadVariant(bead.name);
              return (
                <button
                  key={bead.id}
                  type="button"
                  disabled={disabled}
                  onPointerDown={(e) => {
                    if (disabled) return;
                    onTilePointerDown?.(bead.id, e);
                  }}
                  onClick={() => {
                    if (disabled) return;
                    addBead(bead.id);
                    haptic(4);
                  }}
                  className="group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 bg-[#F5F0E8] rounded-xl md:rounded-2xl border border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:bg-[#F5F0E8] disabled:hover:shadow-none cursor-grab active:cursor-grabbing touch-none select-none"
                  aria-label={`Ajouter ${bead.name}`}
                >
                  {variant ? (
                    <span className="absolute right-2 top-2 rounded-full bg-[#2D3748] px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                      {variant}
                    </span>
                  ) : null}
                  <div className="transition-transform duration-300 group-hover:scale-110">
                    <StoneSwatch
                      hex={bead.hex}
                      veinHex={bead.veinHex}
                      size={54}
                      faceted={bead.shape === 'faceted'}
                      image={bead.images[0]}
                      zoom={beadPhotoZoom(bead.shape)}
                    />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-[#2D3748] truncate leading-tight">
                      {tileName(bead.name)}
                    </p>
                    <p className="text-[9px] font-black text-[#A8BED4] uppercase tracking-widest tabular-nums">
                      {bead.sizeMm.toString().replace('.', ',')}mm
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function tileName(name: string): string {
  const variant = beadVariant(name);
  if (!variant) return name.split(' ')[0] ?? name;
  return `${name.split(' ')[0] ?? name} ${variant}`;
}

function beadVariant(name: string): string | null {
  return name.match(/\bV\d+\b/i)?.[0]?.toUpperCase() ?? null;
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
