'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import type { KitCategory } from '@/types';

interface Props {
  activeCategory?: KitCategory;
  activeFormat?: 'solo' | 'duo';
  totalCount: number;
}

const CATEGORIES: { id: KitCategory; label: string; price: string }[] = [
  { id: 'classique', label: 'Classique', price: '36 €' },
  { id: 'kawaii-premium', label: 'Kawaii Premium', price: '30 €' },
  { id: 'kawaii', label: 'Kawaii', price: '24 €' },
];

export function KitsFilters({ activeCategory, activeFormat, totalCount }: Props) {
  const pathname = usePathname();

  function buildUrl(opts: { category?: KitCategory | 'all'; format?: 'solo' | 'duo' | 'all' }) {
    const params = new URLSearchParams();
    const cat = opts.category ?? activeCategory ?? 'all';
    const fmt = opts.format ?? activeFormat ?? 'all';
    if (cat && cat !== 'all') params.set('category', cat);
    if (fmt && fmt !== 'all') params.set('format', fmt);
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-y border-[#EEE9E0] py-5">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        {/* Category */}
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4] mb-2 sm:hidden">
            Catégorie
          </p>
          <div className="flex flex-wrap gap-1.5">
            <Pill href={buildUrl({ category: 'all' })} active={!activeCategory}>
              Tous
            </Pill>
            {CATEGORIES.map((c) => (
              <Pill key={c.id} href={buildUrl({ category: c.id })} active={activeCategory === c.id}>
                {c.label}
                <span className="ml-1 opacity-60 tabular-nums">· {c.price}</span>
              </Pill>
            ))}
          </div>
        </div>

        {/* Format */}
        <div className="sm:border-l sm:border-[#EEE9E0] sm:pl-4">
          <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4] mb-2 sm:hidden">
            Format
          </p>
          <div className="flex gap-1.5">
            <Pill href={buildUrl({ format: 'all' })} active={!activeFormat}>
              Tous
            </Pill>
            <Pill href={buildUrl({ format: 'solo' })} active={activeFormat === 'solo'}>
              Solo
            </Pill>
            <Pill href={buildUrl({ format: 'duo' })} active={activeFormat === 'duo'}>
              Duo
            </Pill>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4] tabular-nums">
        {totalCount} kit{totalCount > 1 ? 's' : ''}
      </p>
    </div>
  );
}

function Pill({
  href,
  active,
  children,
}: {
  href: string;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'inline-flex items-center rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-colors',
        active
          ? 'bg-[#3D5A73] text-white'
          : 'border border-[#EEE9E0] text-[#718096] bg-white hover:text-[#2D3748] hover:border-[#3D5A73]',
      )}
    >
      {children}
    </Link>
  );
}
