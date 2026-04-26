import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Kit } from '@/types';
import { KitVisual } from '@/components/ui/KitVisual';
import { formatPrice } from '@/lib/utils/format';

const CATEGORY_LABELS: Record<Kit['category'], string> = {
  classique: 'Classique',
  kawaii: 'Kawaii',
  'kawaii-premium': 'Kawaii Premium',
};

export function KitCard({ kit, priority = false }: { kit: Kit; priority?: boolean }) {
  const isDuo = kit.numberOfBracelets > 1;
  return (
    <Link
      href={`/kits/${kit.slug}`}
      prefetch={priority}
      className="group relative block bg-white rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-[#EEE9E0] shadow-sm hover:shadow-xl transition-all"
    >
      <div className="relative overflow-hidden">
        <KitVisual palette={kit.palette} name={kit.name} aspect="landscape" />
        {/* Top-left : category pill */}
        <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-white/95 backdrop-blur-md text-[#2D3748] text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-sm">
          {CATEGORY_LABELS[kit.category]}
        </span>
        {/* Top-right : duo badge if duo */}
        {isDuo && (
          <span className="absolute top-4 right-4 bg-[#3D5A73] text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-full shadow-md">
            Duo · 2 bracelets
          </span>
        )}
      </div>
      <div className="p-5 sm:p-6 md:p-7">
        <div className="flex items-center gap-2 mb-3">
          {kit.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#A8BED4]"
            >
              {tag}
            </span>
          ))}
        </div>
        <h3 className="text-lg sm:text-xl md:text-2xl font-serif font-black text-[#2D3748] uppercase tracking-tight leading-tight mb-2">
          {kit.name}
        </h3>
        <p className="text-[12px] sm:text-[13px] text-[#718096] italic leading-relaxed mb-5 line-clamp-2">
          {kit.tagline}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-xl md:text-2xl font-black text-[#2D3748] tabular-nums">
            {formatPrice(kit.price)}
          </span>
          <div className="w-8 h-8 md:w-9 md:h-9 bg-[#F5F0E8] rounded-full flex items-center justify-center group-hover:bg-[#3D5A73] group-hover:text-white transition-all">
            <ArrowRight size={14} strokeWidth={2} />
          </div>
        </div>
      </div>
    </Link>
  );
}
