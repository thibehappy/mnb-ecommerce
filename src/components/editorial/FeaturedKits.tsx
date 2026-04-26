import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { KitCard } from '@/components/commerce/KitCard';
import { listKits } from '@/lib/api';

export async function FeaturedKits() {
  const kits = await listKits({ featured: true });
  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[9px] md:text-[10px] font-black uppercase text-[#3D5A73] tracking-[0.4em] mb-4 block">
            Les best-sellers
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-none mb-4">
            Nos kits de création
          </h2>
          <p className="text-base md:text-lg text-[#718096] italic max-w-2xl mx-auto">
            Prolongez l&rsquo;expérience de l&rsquo;atelier à la maison. Tout le matériel nécessaire dans un coffret.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8">
          {kits.map((kit, i) => (
            <KitCard key={kit.id} kit={kit} priority={i < 2} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/kits"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#2D3748] text-[#F5F0E8] rounded-xl shadow-lg hover:bg-[#1A202C] active:scale-95 transition-all text-[11px] md:text-xs font-black uppercase tracking-widest"
          >
            Voir tous les kits <ArrowRight size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
