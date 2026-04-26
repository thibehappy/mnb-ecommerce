import { Quote, Star } from 'lucide-react';

export function Testimonial() {
  return (
    <section className="py-16 md:py-28 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center mb-10 md:mb-14">
          <span className="text-[9px] md:text-[10px] font-black uppercase text-[#3D5A73] tracking-[0.4em] mb-4 block">
            Ce qu&rsquo;on dit de nous
          </span>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="flex text-amber-400 gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} fill="currentColor" size={18} />
              ))}
            </div>
            <span className="text-[11px] font-black text-[#2D3748] uppercase tracking-widest">
              Google · 4,9 / 5
            </span>
          </div>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="bg-[#F5F0E8] rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-8 sm:p-10 md:p-16 relative overflow-hidden">
            <Quote size={80} className="absolute top-6 left-6 text-[#3D5A73]/5" />
            <div className="text-center relative z-10">
              <p className="text-base sm:text-lg md:text-2xl text-[#2D3748] italic leading-relaxed font-medium mb-6 md:mb-8">
                &laquo; Une boutique où l&rsquo;on prend le temps. On choisit ses pierres, on
                discute, on repart avec un bijou qu&rsquo;on a vraiment fait. &raquo;
              </p>
              <div className="flex flex-col items-center gap-2">
                <span className="font-black text-[#2D3748] uppercase text-sm tracking-widest">
                  Sortir à Paris
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#A8BED4] uppercase tracking-widest">
                    Mars 2025
                  </span>
                  <span className="text-[#EEE9E0]">•</span>
                  <span className="text-[10px] font-black text-[#3D5A73] uppercase tracking-widest">
                    Presse
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
