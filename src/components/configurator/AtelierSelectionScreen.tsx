'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Gift } from 'lucide-react';
import { useState } from 'react';
import { ATELIERS, ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useConfigurator } from '@/lib/store/configurator';
import { useGiftCards } from '@/lib/store/gift-cards';
import { useT } from '@/lib/i18n/use-t';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';
import { GiftRedemptionModal } from '@/components/gifts/GiftRedemptionModal';

/**
 * Fullscreen phase 1 of the configurator: user picks an atelier.
 * Click on an atelier card = directly goes to the conception step.
 * Size is chosen later in the configurator view.
 */
export function AtelierSelectionScreen() {
  const setAtelier = useConfigurator((s) => s.setAtelier);
  const setStep = useConfigurator((s) => s.setStep);
  const { t } = useT();
  const loadSharedDesign = useConfigurator((s) => s.loadSharedDesign);
  const getByCode = useGiftCards((s) => s.getByCode);
  const markViewed = useGiftCards((s) => s.markViewed);
  const beginRedemption = useGiftCards((s) => s.beginRedemption);
  const [redeemOpen, setRedeemOpen] = useState(false);

  function pickAtelier(id: string) {
    haptic(10);
    setAtelier(id);
    setStep('beads');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleRedeem(code: string) {
    const card = getByCode(code);
    if (!card) return;
    markViewed(card.code);
    beginRedemption(card.code);
    if (card.kind === 'designed' && card.design) {
      loadSharedDesign({
        atelierId: card.design.atelierId,
        sizeCm: card.design.sizeCm,
        sizeLabel: card.design.sizeLabel,
        components: card.design.components,
        figurine: card.design.figurine,
        title: card.design.title,
        intention: card.design.intention,
      });
    } else if (card.kind === 'open' && card.atelierId && ATELIER_BY_ID[card.atelierId]) {
      pickAtelier(card.atelierId);
    }
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

      <div className="relative container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-14 md:pb-20">
        {/* Heading — large, breathable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-4xl mx-auto mb-10 md:mb-16"
        >
          <span className="text-[10px] md:text-[11px] font-black uppercase text-[#A8BED4] tracking-[0.4em] mb-5 md:mb-6 inline-flex items-center gap-2">
            <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-[#3D5A73] text-white text-[9px] font-black tabular-nums">
              1
            </span>
            {t('atelierSelect.eyebrow')}
          </span>
          <h1 className="text-white text-[34px] md:text-[64px] font-serif font-black tracking-tighter uppercase leading-[0.95]">
            {t('atelierSelect.title.line1')}
            <br />
            <span className="italic font-normal text-[#A8BED4]">{t('atelierSelect.title.line2')}</span>
          </h1>
        </motion.div>

        {/* Atelier cards — click directly to advance */}
        <div className="grid md:grid-cols-3 gap-4 md:gap-5 max-w-6xl mx-auto">
          {ATELIERS.map((a, i) => (
            <motion.button
              key={a.id}
              type="button"
              onClick={() => pickAtelier(a.id)}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.7,
                delay: 0.15 + i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              whileHover={{ y: -8 }}
              className={cn(
                'group relative block rounded-[1.5rem] md:rounded-[2rem] overflow-hidden text-left shadow-2xl transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A8BED4] focus-visible:ring-offset-4 focus-visible:ring-offset-[#1A202C]',
              )}
            >
              <div className="relative h-[380px] md:h-[480px]">
                <Image
                  src={a.image}
                  alt={a.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
                />
                {/* Legibility gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A202C]/95 via-[#1A202C]/40 to-transparent" />

                {/* Fixed price badge */}
                <span className="absolute top-4 left-4 z-10 inline-flex items-center gap-1.5 bg-white/95 backdrop-blur-md text-[#2D3748] px-3 py-1.5 rounded-full text-[11px] md:text-[12px] font-black uppercase tracking-widest tabular-nums shadow-md">
                  {formatPrice(a.price)}
                </span>

                {/* Hover hint reveal */}
                <span className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 bg-white/95 text-[#2D3748] px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 shadow-md">
                  {t('atelierSelect.choose')}
                </span>

                {/* Bottom content */}
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-7 z-10">
                  <h3 className="text-white text-[28px] md:text-[36px] font-serif font-black uppercase tracking-tighter leading-[1] mb-3 drop-shadow-lg">
                    {a.name}
                  </h3>
                  <p className="text-white/80 italic text-[13px] md:text-[14px] leading-snug mb-4 line-clamp-3">
                    {a.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    <Spec
                      label={
                        a.sizing.mode === 'fixed-range'
                          ? `${(a.sizing.minMm / 10).toFixed(0)}–${(a.sizing.maxMm / 10).toFixed(0)} cm`
                          : a.sizes.length > 0
                            ? `${a.sizes[0]!.cm}–${a.sizes[a.sizes.length - 1]!.cm} cm`
                            : 'Taille libre'
                      }
                    />
                    {a.maxCharms > 0 && (
                      <Spec
                        label={
                          a.id === 'atelier_kawaii'
                            ? `+ ${a.maxCharms} figurine`
                            : `+ ${a.maxCharms} charm${a.maxCharms > 1 ? 's' : ''}`
                        }
                      />
                    )}
                    <Spec label={a.wireType} />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Gift code redemption — discreet entry point for recipients of a
            gift card. Sits below the atelier cards, not competing for the
            primary CTA. */}
        <div className="mt-10 md:mt-14 text-center">
          <button
            type="button"
            onClick={() => {
              haptic(6);
              setRedeemOpen(true);
            }}
            className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-3 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-white/90 backdrop-blur-md transition-colors hover:border-white/60 hover:bg-white/10"
          >
            <Gift size={14} strokeWidth={2.2} />
            {t('atelierSelect.haveGiftCode')}
          </button>
        </div>
      </div>

      <GiftRedemptionModal
        open={redeemOpen}
        onClose={() => setRedeemOpen(false)}
        onRedeem={handleRedeem}
      />
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
