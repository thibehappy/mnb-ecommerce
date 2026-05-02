'use client';

import { ArrowLeft, ArrowRight, GripHorizontal, Sparkles, Trash2 } from 'lucide-react';
import type { ReactNode } from 'react';
import type { BraceletComponent } from '@/types';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import { beadPhotoZoom } from '@/lib/utils/bead-display';
import { cn } from '@/lib/utils/cn';
import { resolveBead, resolveCharm, sizeMmOf } from '@/lib/store/configurator';

interface CompositionTrayProps {
  components: BraceletComponent[];
  figurine: BraceletComponent | null;
  selectedSlotId: string | null;
  onSelect: (slotId: string | null) => void;
  onMove: (from: number, to: number) => void;
  onRemove: (slotId: string) => void;
}

export function CompositionTray({
  components,
  figurine,
  selectedSlotId,
  onSelect,
  onMove,
  onRemove,
}: CompositionTrayProps) {
  const totalPieces = components.length + (figurine ? 1 : 0);

  return (
    <section className="mt-4 rounded-2xl border border-[#EEE9E0] bg-white p-4 shadow-sm md:p-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
          <GripHorizontal size={14} strokeWidth={2.2} />
          Ordre du fil
        </div>
        <span className="rounded-full bg-[#F5F0E8] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#718096]">
          {totalPieces} pièce{totalPieces > 1 ? 's' : ''}
        </span>
      </div>

      {totalPieces === 0 ? (
        <div className="flex min-h-[92px] items-center justify-center rounded-xl border border-dashed border-[#EEE9E0] bg-[#FBF8F2] px-4 text-center">
          <div>
            <Sparkles className="mx-auto mb-2 text-[#A8BED4]" size={18} strokeWidth={2} />
            <p className="text-[12px] font-semibold italic text-[#718096]">
              Le fil attend sa première perle.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {components.map((component, index) => {
            const item = componentInfo(component);
            if (!item) return null;
            const active = selectedSlotId === component.slotId;

            return (
              <div
                key={component.slotId}
                className={cn(
                  'grid w-[154px] shrink-0 grid-rows-[auto_1fr_auto] rounded-xl border bg-[#FBF8F2] p-2.5 transition-all',
                  active
                    ? 'border-[#3D5A73] bg-white shadow-md'
                    : 'border-[#EEE9E0] hover:border-[#A8BED4]',
                )}
              >
                <button
                  type="button"
                  onClick={() => onSelect(active ? null : component.slotId)}
                  className="min-w-0 text-left"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-2 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm">
                      {index + 1}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                      {item.meta}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.preview}
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-black uppercase tracking-tight text-[#2D3748]">
                        {item.name}
                      </p>
                      <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                        {item.kindLabel}
                      </p>
                    </div>
                  </div>
                </button>

                <div />

                <div className="mt-3 grid grid-cols-3 gap-1.5">
                  <IconButton
                    label="Déplacer vers la gauche"
                    disabled={index === 0}
                    onClick={() => onMove(index, index - 1)}
                  >
                    <ArrowLeft size={12} strokeWidth={2.3} />
                  </IconButton>
                  <IconButton
                    label="Retirer"
                    danger
                    onClick={() => onRemove(component.slotId)}
                  >
                    <Trash2 size={12} strokeWidth={2.2} />
                  </IconButton>
                  <IconButton
                    label="Déplacer vers la droite"
                    disabled={index === components.length - 1}
                    onClick={() => onMove(index, index + 1)}
                  >
                    <ArrowRight size={12} strokeWidth={2.3} />
                  </IconButton>
                </div>
              </div>
            );
          })}

          {figurine ? (
            <FigurineCard
              figurine={figurine}
              selectedSlotId={selectedSlotId}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          ) : null}
        </div>
      )}
    </section>
  );
}

function FigurineCard({
  figurine,
  selectedSlotId,
  onSelect,
  onRemove,
}: {
  figurine: BraceletComponent;
  selectedSlotId: string | null;
  onSelect: (slotId: string | null) => void;
  onRemove: (slotId: string) => void;
}) {
  const charm = resolveCharm(figurine.refId);
  if (!charm) return null;
  const active = selectedSlotId === figurine.slotId;

  return (
    <div
      className={cn(
        'grid w-[154px] shrink-0 grid-rows-[auto_1fr_auto] rounded-xl border bg-[#F4F8FB] p-2.5 transition-all',
        active ? 'border-[#3D5A73] bg-white shadow-md' : 'border-[#D9E4F0] hover:border-[#A8BED4]',
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(active ? null : figurine.slotId)}
        className="min-w-0 text-left"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <span className="inline-flex h-6 items-center rounded-full bg-white px-2 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm">
            Side
          </span>
          <span className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
            Hors fil
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CharmGlyph
            category={charm.category}
            material={charm.material}
            size={34}
            image={charm.images[0]}
          />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-black uppercase tracking-tight text-[#2D3748]">
              {charm.name}
            </p>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
              Figurine
            </p>
          </div>
        </div>
      </button>

      <div />

      <div className="mt-3">
        <button
          type="button"
          onClick={() => onRemove(figurine.slotId)}
          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-[#FFF1EE] text-[9px] font-black uppercase tracking-widest text-[#A4473E] transition-colors hover:bg-[#F8DCD5]"
        >
          <Trash2 size={12} strokeWidth={2.2} />
          Retirer
        </button>
      </div>
    </div>
  );
}

function componentInfo(component: BraceletComponent) {
  if (component.kind === 'bead') {
    const bead = resolveBead(component.refId);
    if (!bead) return null;
    return {
      name: bead.name,
      meta: formatMm(sizeMmOf(component)),
      kindLabel: bead.shape === 'bow' ? 'Nœud' : bead.shape === 'star' ? 'Étoile' : bead.shape === 'heart' ? 'Cœur' : 'Perle',
      preview: (
        <StoneSwatch
          hex={bead.hex}
          veinHex={bead.veinHex}
          size={34}
          image={bead.images[0]}
          zoom={beadPhotoZoom(bead.shape)}
        />
      ),
    };
  }

  const charm = resolveCharm(component.refId);
  if (!charm) return null;
  return {
    name: charm.name,
    meta: formatMm(sizeMmOf(component)),
    kindLabel: 'Charm',
    preview: (
      <CharmGlyph
        category={charm.category}
        material={charm.material}
        size={34}
        image={charm.images[0]}
      />
    ),
  };
}

function formatMm(mm: number): string {
  return `${mm.toString().replace('.', ',')} mm`;
}

function IconButton({
  label,
  disabled,
  danger,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-8 items-center justify-center rounded-lg border text-[#3D5A73] transition-colors disabled:cursor-not-allowed disabled:opacity-30',
        danger
          ? 'border-[#F3D0C8] bg-[#FFF1EE] text-[#A4473E] hover:bg-[#F8DCD5]'
          : 'border-[#EEE9E0] bg-white hover:border-[#3D5A73]',
      )}
    >
      {children}
    </button>
  );
}
