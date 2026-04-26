import Link from 'next/link';
import { ArrowRight, Zap } from 'lucide-react';

export function Hero() {
  return (
    // Full-bleed hero. Compensates the pt-20 md:pt-24 set on <main>.
    <section className="relative -mt-20 md:-mt-24 h-[90vh] md:h-[95vh] flex items-center justify-center overflow-hidden">
      {/* Background — stylized while waiting for real hero photo */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(135deg, #2D3748 0%, #3D5A73 55%, #5A7088 100%)',
          }}
        />
        {/* Pierres flottantes discrètes — placeholder visuel */}
        <svg
          viewBox="0 0 1600 900"
          className="absolute inset-0 w-full h-full opacity-40"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <radialGradient id="hero-orb-1" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#D4A8A0" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#D4A8A0" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-orb-2" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#A8BED4" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#A8BED4" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-orb-3" cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#EDE4D3" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#EDE4D3" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="220" cy="180" r="240" fill="url(#hero-orb-1)" />
          <circle cx="1320" cy="260" r="320" fill="url(#hero-orb-2)" />
          <circle cx="760" cy="680" r="360" fill="url(#hero-orb-3)" />
        </svg>
        <div className="absolute inset-0 bg-black/40" />
        {/* Gradient vers cream en bas pour transition douce avec la section suivante */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F5F0E8]" />
      </div>

      <div className="relative z-10 text-center text-white px-6 max-w-5xl pt-20">
        <Link
          href="/kits"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 rounded-full text-[10px] font-black uppercase mb-8 backdrop-blur-md tracking-widest leading-none shadow-xl animate-fade-up hover:bg-white/20 hover:scale-105 transition-all duration-200"
        >
          <Zap size={14} className="text-amber-400" /> Livraison offerte dès 60 €
        </Link>
        <h1 className="text-white text-4xl md:text-8xl font-serif font-black mb-6 leading-[1.1] tracking-tighter uppercase drop-shadow-2xl animate-fade-up stagger-1">
          Composez votre
          <br />
          bracelet
        </h1>
        <p className="text-base md:text-xl mb-12 text-white max-w-2xl mx-auto italic font-semibold leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] px-4 animate-fade-up stagger-2">
          Pierres, charms et fils tressés. À faire chez vous avec un kit ou à configurer en ligne.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up stagger-3">
          <Link
            href="/creer"
            className="px-8 md:px-14 py-4 md:py-5 text-[11px] md:text-xs font-black uppercase tracking-widest bg-white text-[#2D3748] rounded-xl shadow-xl border border-[#EEE9E0] hover:shadow-2xl transition-all active:scale-95 inline-flex items-center gap-2"
          >
            Créer mon bracelet <ArrowRight size={14} strokeWidth={2} />
          </Link>
          <Link
            href="/kits"
            className="px-8 md:px-14 py-4 md:py-5 text-[11px] md:text-xs font-black uppercase tracking-widest bg-transparent border-2 border-white/40 text-white rounded-xl hover:bg-white/10 transition-all active:scale-95 inline-flex items-center gap-2"
          >
            Voir les kits
          </Link>
        </div>
      </div>
    </section>
  );
}
