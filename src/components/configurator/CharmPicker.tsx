'use client';

import { useMemo, useState } from 'react';
import { CHARMS } from '@/lib/mocks/charms';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useConfigurator, canFit, countCharms } from '@/lib/store/configurator';
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
  noeud: 'Nœuds',
};

interface CharmPickerProps {
  onTilePointerDown?: (refId: string, e: React.PointerEvent) => void;
}

export function CharmPicker({ onTilePointerDown }: CharmPickerProps = {}) {
  const addCharm = useConfigurator((s) => s.addCharm);
  const setFigurine = useConfigurator((s) => s.setFigurine);
  const atelierId = useConfigurator((s) => s.atelierId);
  const sizeCm = useConfigurator((s) => s.sizeCm);
  const components = useConfigurator((s) => s.components);
  const figurine = useConfigurator((s) => s.figurine);
  const atelier = ATELIER_BY_ID[atelierId];

  const [category, setCategory] = useState<CharmCategory | null>(null);

  // Only items with a real product photo (SVG fallback removed). Filtered by both
  // the atelier's allowed CATEGORIES *and* the kind/atelier mapping :
  //   - Kawaii   → kind: 'figurine'  (Sanrio / Disney / signature MNB)
  //   - Classique → kind: 'charm'    (lettres, médailles, lunes — petits éléments)
  // Bracelet Bar n'arrive jamais ici (allowCharms = false).
  const atelierCharms = useMemo(() => {
    const withPhoto = CHARMS.filter((c) => c.images.length > 0);
    if (!atelier) return withPhoto;
    const wantedKind: 'charm' | 'figurine' = atelier.id === 'atelier_kawaii' ? 'figurine' : 'charm';
    return withPhoto.filter(
      (c) => c.kind === wantedKind && atelier.allowedCharmCategories.includes(c.category),
    );
  }, [atelier]);

  const categories = useMemo(
    () => Array.from(new Set(atelierCharms.map((c) => c.category))) as CharmCategory[],
    [atelierCharms],
  );

  const filtered = atelierCharms.filter((c) => !category || c.category === category);

  const isKawaii = atelier?.id === 'atelier_kawaii';
  const charmsCount = isKawaii ? (figurine ? 1 : 0) : countCharms(components);
  const max = atelier?.maxCharms ?? 0;
  // For Kawaii, picking a figurine REPLACES the current one — so no count limit.
  // For Classique, charms are appended on the cord and capped by maxCharms.
  const atCountLimit = !isKawaii && charmsCount >= max;

  if (!atelier?.allowCharms) {
    return (
      <div className="text-center py-8">
        <p className="text-[14px] text-[#718096] italic">Cet atelier ne comprend pas de charms.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-xl md:text-2xl font-serif font-black text-[#2D3748] uppercase tracking-tighter mb-1">
            {isKawaii ? 'Ajoutez une figurine' : 'Ajoutez des charms'}
          </h3>
          <p className="text-[13px] text-[#718096] italic">
            {isKawaii
              ? 'Optionnel. Une figurine vient se fixer à côté du bracelet.'
              : `Optionnel. Jusqu’à ${max} charm${max > 1 ? 's' : ''}.`}
          </p>
        </div>
        <div
          className={cn(
            'shrink-0 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest tabular-nums',
            atCountLimit
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
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#EEE9E0] bg-[#F5F0E8]/60 px-4 py-8 text-center">
            <p className="text-[12px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">
              Section vide
            </p>
            <p className="text-[13px] text-[#718096] italic">
              {isKawaii
                ? 'Aucune figurine disponible pour le moment.'
                : 'Aucun charm disponible pour le moment.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2 md:gap-3">
            {filtered.map((charm) => {
              // For Kawaii figurines : no length budget (figurine is off-cord),
              // no count limit either (clicking just replaces the current one).
              const fits = isKawaii ? true : canFit(atelierId, sizeCm, components, charm.sizeMm);
              const disabled = atCountLimit || !fits;
              const isSelected = isKawaii && figurine?.refId === charm.id;
              return (
                <button
                  key={charm.id}
                  type="button"
                  disabled={disabled}
                  onPointerDown={(e) => {
                    // Drag-from-palette only makes sense for cord items (Classique).
                    // The Kawaii figurine doesn't sit on the cord, so we fall back
                    // to click-to-attach.
                    if (disabled || isKawaii) return;
                    onTilePointerDown?.(charm.id, e);
                  }}
                  onClick={() => {
                    if (disabled) return;
                    if (isKawaii) {
                      // Click-to-toggle : same figurine clicked again removes it.
                      setFigurine(isSelected ? null : charm.id);
                    } else {
                      addCharm(charm.id);
                    }
                    haptic(8);
                  }}
                  className={cn(
                    'group relative aspect-square flex flex-col items-center justify-center gap-1.5 p-2 md:p-3 rounded-xl md:rounded-2xl border active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-transparent disabled:hover:bg-[#F5F0E8] disabled:hover:shadow-none touch-none select-none',
                    isSelected
                      ? 'bg-white border-[#3D5A73] shadow-md cursor-pointer'
                      : 'bg-[#F5F0E8] border-transparent hover:border-[#3D5A73] hover:bg-white hover:shadow-md',
                    isKawaii ? 'cursor-pointer' : 'cursor-grab active:cursor-grabbing',
                  )}
                  aria-label={isSelected ? `Retirer ${charm.name}` : `Choisir ${charm.name}`}
                >
                  <div className="transition-transform duration-300 group-hover:scale-110 h-14 w-14 flex items-center justify-center">
                    <CharmGlyph
                      category={charm.category}
                      material={charm.material}
                      size={48}
                      image={charm.images[0]}
                    />
                  </div>
                  <div className="text-center min-w-0 w-full">
                    <p className="text-[10px] md:text-[11px] font-black uppercase tracking-tight text-[#2D3748] truncate leading-tight">
                      {charm.name}
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
