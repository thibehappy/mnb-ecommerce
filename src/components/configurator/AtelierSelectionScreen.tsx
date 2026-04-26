'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import { ATELIERS } from '@/lib/mocks/ateliers';
import { useConfigurator } from '@/lib/store/configurator';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';
import type { SizeLabel } from '@/types';

/**
 * Fullscreen phase 1 of the configurator: user picks an atelier + a size.
 * No bracelet preview, no bead/charm picker. Immersive by design.
 * Once the user clicks "Continuer", the step advances to 'beads' and the
 * main Configurator view takes over.
 */
export function AtelierSelectionScreen() {
  const { atelierId, sizeLabel, setAtelier, setSize, setStep } = useConfigurator();
  const atelier = ATELIERS.find((a) => a.id === atelierId) ?? ATELIERS[0]!;

  function handleContinue() {
    haptic(10);
    setStep('beads');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="relative min-h-screen bg-[#1A202C] overflow-hidden -mt-20 md:-mt-24">
      {/* Background ambient */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(61,90,115,0.55) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(168,190,212,0.18) 0%, transparent 60%), linear-gradient(180deg, #1A202C 0%, #2D3748 100%)',
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.07] mix-blend-overlay pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative container mx-auto px-4 md:px-6 pt-28 md:pt-36 pb-16 md:pb-20">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-10 md:mb-14"
        >
          <span className="text-[10px] md:text-[11px] font-black uppercase text-[#A8BED4] tracking-[0.4em] mb-4 inline-flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#3D5A73] text-white text-[9px] font-black tabular-nums">
              1
            </span>
            Étape 1 sur 4
          </span>
          <h1 className="text-white text-[36px] md:text-[68px] font-serif font-black tracking-tighter uppercase leading-[0.95]">
            Quel atelier
            <br />
            <span className="italic font-normal text-[#A8BED4]">choisissez-vous ?</span>
          </h1>
        </motion.div>

        {/* Atelier cards — 3 big cards */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-6 max-w-6xl mx-auto mb-10 md:mb-14">
          {ATELIERS.map((a, i) => {
            const active = atelierId === a.id;
            return (
              <motion.button
                key={a.id}
                type="button"
                onClick={() => {
                  haptic(6);
                  setAtelier(a.id);
                }}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.15 + i * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                className={cn(
                  'group relative block rounded-[1.5rem] md:rounded-[2rem] overflow-hidden text-left shadow-2xl transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8BED4] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1A202C]',
                  active && 'ring-2 ring-[#A8BED4] ring-offset-4 ring-offset-[#1A202C]',
                )}
              >
                <div className="relative h-[360px] md:h-[460px]">
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className={cn(
                      'object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]',
                      'group-hover:scale-[1.06]',
                      active && 'scale-[1.04]',
                    )}
                  />
                  {/* Legibility gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C]/90 via-[#1A202C]/30 to-transparent" />

                  {/* Fixed price badge */}
                  <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-[#2D3748] px-3 py-1.5 rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-widest tabular-nums shadow-md">
                    {formatPrice(a.price)}
                  </span>
                  {active && (
                    <span className="absolute top-4 right-4 z-10 inline-flex items-center justify-center h-10 w-10 rounded-full bg-[#3D5A73] text-white shadow-xl">
                      <Check size={18} strokeWidth={3} />
                    </span>
                  )}

                  {/* Bottom content */}
                  <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 z-10">
                    <h3 className="text-white text-[28px] md:text-[36px] font-serif font-black uppercase tracking-tighter leading-[1] mb-3 drop-shadow-lg">
                      {a.name}
                    </h3>
                    <p className="text-white/80 italic text-[13px] md:text-[14px] leading-relaxed mb-4 line-clamp-3">
                      {a.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <Spec label={`${a.beadCount} perles`} />
                      <Spec label={a.wireType} />
                      {a.allowCharms && <Spec label={`${a.maxCharms} charms max`} />}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Size selector + CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-4xl mx-auto"
        >
          <p className="text-center text-[10px] md:text-[11px] font-black uppercase text-[#A8BED4] tracking-[0.4em] mb-4 md:mb-6">
            Choisissez votre taille
          </p>
          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8 md:mb-10">
            {atelier.sizes.map((size) => {
              const active = sizeLabel === size.label;
              return (
                <button
                  key={size.label}
                  type="button"
                  onClick={() => {
                    haptic(6);
                    setSize(size.label as SizeLabel);
                  }}
                  className={cn(
                    'relative flex flex-col items-center gap-1 py-5 md:py-7 rounded-2xl md:rounded-[1.5rem] border-2 transition-all active:scale-95 backdrop-blur-sm',
                    active
                      ? 'border-[#A8BED4] bg-white text-[#2D3748] shadow-xl'
                      : 'border-white/20 bg-white/5 text-white hover:border-white/50 hover:bg-white/10',
                  )}
                >
                  <span className="font-serif font-black text-[30px] md:text-[40px] uppercase tracking-tight leading-none">
                    {size.label}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-black uppercase tracking-widest tabular-nums',
                      active ? 'text-[#718096]' : 'text-white/60',
                    )}
                  >
                    {size.cm} cm
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleContinue}
              className="group inline-flex items-center gap-3 px-10 md:px-14 py-5 md:py-6 rounded-xl bg-[#3D5A73] hover:bg-[#2A3F50] text-white text-[12px] md:text-[13px] font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
            >
              Commencer la personnalisation
              <ArrowRight
                size={18}
                strokeWidth={2.2}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
              {atelier.name} · {sizeLabel} · {formatPrice(atelier.price)}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Spec({ label }: { label: string }) {
  return (
    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-white/90 border border-white/30 bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-full">
      {label}
    </span>
  );
}
