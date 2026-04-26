import type { Metadata } from 'next';
import { listKits } from '@/lib/api';
import { KitCard } from '@/components/commerce/KitCard';
import { KitsFilters } from './KitsFilters';
import type { KitCategory } from '@/types';

export const metadata: Metadata = {
  title: 'Kits de création',
  description:
    'Nos kits complets pour composer votre bracelet chez vous. Pierres, charms, fil et notice — tout y est.',
};

const ALLOWED_CATEGORIES: KitCategory[] = ['classique', 'kawaii-premium', 'kawaii'];

export default async function KitsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; format?: string }>;
}) {
  const params = await searchParams;
  const allKits = await listKits();

  const activeCategory = (
    ALLOWED_CATEGORIES.includes(params.category as KitCategory) ? params.category : undefined
  ) as KitCategory | undefined;
  const activeFormat =
    params.format === 'solo' || params.format === 'duo' ? params.format : undefined;

  let kits = allKits;
  if (activeCategory) kits = kits.filter((k) => k.category === activeCategory);
  if (activeFormat === 'duo') kits = kits.filter((k) => k.numberOfBracelets > 1);
  if (activeFormat === 'solo') kits = kits.filter((k) => k.numberOfBracelets === 1);

  return (
    <>
      <section className="py-12 md:py-20 bg-[#F5F0E8]">
        <div className="container mx-auto px-4 md:px-6 text-center max-w-3xl">
          <span className="text-[9px] md:text-[10px] font-black uppercase text-[#3D5A73] tracking-[0.4em] mb-4 block">
            Kits à composer chez soi
          </span>
          <h1 className="text-3xl md:text-5xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-none mb-6">
            Prolongez l&rsquo;atelier, dans votre salon
          </h1>
          <p className="text-base md:text-lg text-[#718096] italic leading-relaxed">
            Tout le matériel arrive dans un coffret — pierres, charms, fil, notice illustrée.
            Trois gammes : Classique, Kawaii Premium (figurines Sanrio + Disney), Kawaii.
          </p>
        </div>
      </section>

      <section className="py-10 md:py-16 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <KitsFilters
            activeCategory={activeCategory}
            activeFormat={activeFormat}
            totalCount={kits.length}
          />
          {kits.length === 0 ? (
            <p className="mt-12 text-center text-[14px] text-[#718096] italic">
              Aucun kit ne correspond à ce filtre.
            </p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 md:gap-8 mt-10">
              {kits.map((kit, i) => (
                <KitCard key={kit.id} kit={kit} priority={i < 3} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
