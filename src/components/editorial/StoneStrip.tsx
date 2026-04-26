import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { BEADS } from '@/lib/mocks/beads';

export function StoneStrip() {
  const featured = BEADS.filter((b) => b.shape === 'round' && b.size === 6).slice(0, 8);
  return (
    <section className="py-16 md:py-28 bg-[#F5F0E8]">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <span className="text-[9px] md:text-[10px] font-black uppercase text-[#3D5A73] tracking-[0.4em] mb-4 block">
            La matière
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-none mb-4">
            Des pierres choisies
          </h2>
          <p className="text-base md:text-lg text-[#718096] italic max-w-2xl mx-auto">
            Améthyste, jade, onyx, quartz rose — chaque perle raconte quelque chose.
          </p>
        </div>
        <ul className="grid grid-cols-4 md:grid-cols-8 gap-4 md:gap-6 max-w-5xl mx-auto">
          {featured.map((bead) => (
            <li key={bead.id} className="group text-center">
              <div className="aspect-square flex items-center justify-center p-3 md:p-4 bg-white rounded-[1.5rem] md:rounded-[2rem] border border-[#EEE9E0] shadow-sm hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                <StoneSwatch hex={bead.hex} veinHex={bead.veinHex} size={72} title={bead.name} />
              </div>
              <p className="mt-3 font-serif font-black text-[12px] md:text-[13px] uppercase tracking-tight text-[#2D3748]">
                {bead.name.split(' ')[0]}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
