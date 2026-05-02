'use client';

import Link from 'next/link';
import { Sparkles, TrendingUp, Clock } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useGallery, sortByScore, sortByRecent } from '@/lib/store/gallery';
import { GalleryCard } from '@/components/gallery/GalleryCard';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';

type SortKey = 'top' | 'recent';

export function GalerieClient() {
  const items = useGallery((s) => s.items);
  const [sort, setSort] = useState<SortKey>('top');

  // useMemo so the sort doesn't run on every vote-induced re-render of an
  // unrelated card (useGallery returns a new items array reference each
  // time, but useMemo + sort key keeps things tidy).
  const sortedItems = useMemo(
    () => (sort === 'top' ? sortByScore(items) : sortByRecent(items)),
    [items, sort],
  );

  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <div className="container mx-auto px-4 md:px-6 pt-10 md:pt-16 pb-14 md:pb-20">
        {/* Header */}
        <div className="mb-8 md:mb-12 max-w-3xl">
          <span className="inline-flex items-center gap-2 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-[#A8BED4]">
            <Sparkles size={14} strokeWidth={2.2} />
            Communauté
          </span>
          <h1 className="mt-3 font-serif text-[36px] md:text-[56px] font-black uppercase leading-[0.95] tracking-tighter text-[#2D3748]">
            Galerie des
            <br />
            <span className="italic font-normal text-[#3D5A73]">créations partagées</span>
          </h1>
          <p className="mt-5 text-[14px] md:text-[15px] leading-relaxed text-[#718096]">
            Les derniers bracelets composés par la communauté. Votez pour ceux
            qui vous inspirent — votre choix remonte les meilleures créations en
            haut de la galerie.
          </p>
        </div>

        {/* Toolbar : sort + create CTA */}
        <div className="mb-6 md:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex items-center gap-1 rounded-full border border-[#EEE9E0] bg-white p-1 shadow-sm">
            <SortTab
              active={sort === 'top'}
              onClick={() => {
                haptic(4);
                setSort('top');
              }}
              icon={<TrendingUp size={13} strokeWidth={2.2} />}
              label="Top"
            />
            <SortTab
              active={sort === 'recent'}
              onClick={() => {
                haptic(4);
                setSort('recent');
              }}
              icon={<Clock size={13} strokeWidth={2.2} />}
              label="Récents"
            />
          </div>

          <Link
            href="/creer"
            className="inline-flex items-center gap-2 rounded-full bg-[#2D3748] px-5 py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-colors hover:bg-[#3D5A73]"
          >
            <Sparkles size={13} strokeWidth={2.2} />
            Composer le mien
          </Link>
        </div>

        {/* Grid */}
        {sortedItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#A8BED4] bg-white p-10 text-center">
            <p className="font-serif text-[20px] font-black uppercase tracking-tight text-[#2D3748]">
              Aucun bracelet pour le moment.
            </p>
            <p className="mt-2 text-[13px] font-semibold text-[#718096]">
              Soyez le premier à composer et partager une création.
            </p>
            <Link
              href="/creer"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#2D3748] px-5 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
            >
              <Sparkles size={13} strokeWidth={2.2} />
              Commencer
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedItems.map((entry) => (
              <GalleryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SortTab({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-2 rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
        active
          ? 'bg-[#3D5A73] text-white shadow-sm'
          : 'text-[#718096] hover:text-[#2D3748]',
      )}
    >
      {icon}
      {label}
    </button>
  );
}
