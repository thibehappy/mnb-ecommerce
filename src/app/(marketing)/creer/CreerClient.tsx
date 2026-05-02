'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useConfigurator } from '@/lib/store/configurator';
import { useGiftCards } from '@/lib/store/gift-cards';
import { AtelierSelectionScreen } from '@/components/configurator/AtelierSelectionScreen';
import { Configurator } from '@/components/configurator/Configurator';
import { decodeBraceletDesign } from '@/lib/utils/share-design';
import { normalizeGiftCode } from '@/lib/utils/gift-code';

/**
 * Two-phase /creer flow :
 *   Phase 1 (step='atelier')  : fullscreen atelier + size picker, no preview.
 *   Phase 2 (step='beads'..'review') : bracelet preview + beads/charms editor.
 *
 * The page also handles two URL hand-off mechanisms :
 *   ?design=<encoded> : view-only share link (someone showed off their
 *                       bracelet). Loads the design into the configurator,
 *                       does NOT touch gift state.
 *   ?gift=<code>      : recipient redeeming a gift card. Loads the design
 *                       (designed gift) or pre-selects the atelier (open
 *                       gift), and marks the card as `viewed` + active.
 */
export function CreerClient() {
  const step = useConfigurator((s) => s.step);
  const setAtelier = useConfigurator((s) => s.setAtelier);
  const setStep = useConfigurator((s) => s.setStep);
  const loadSharedDesign = useConfigurator((s) => s.loadSharedDesign);
  const getByCode = useGiftCards((s) => s.getByCode);
  const markViewed = useGiftCards((s) => s.markViewed);
  const beginRedemption = useGiftCards((s) => s.beginRedemption);
  // Run-once guard: React 19 Strict Mode runs effects twice in dev, and we
  // don't want to double-load the shared design / re-mark a card as viewed.
  const handledRef = useRef(false);
  const isPhaseOne = step === 'atelier';

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const params = new URLSearchParams(window.location.search);

    const giftRaw = params.get('gift');
    if (giftRaw) {
      const code = normalizeGiftCode(giftRaw);
      const card = code ? getByCode(code) : undefined;
      if (card) {
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
        } else if (card.kind === 'open' && card.atelierId) {
          setAtelier(card.atelierId);
          setStep('beads');
        }
        window.history.replaceState(null, '', window.location.pathname);
        return;
      }
      // Card not found — fall through. We could surface an error toast; for
      // the demo we just clean the URL silently and land on phase 1.
      window.history.replaceState(null, '', window.location.pathname);
    }

    const designRaw = params.get('design');
    if (designRaw) {
      const design = decodeBraceletDesign(designRaw);
      if (design) loadSharedDesign(design);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [
    loadSharedDesign,
    setAtelier,
    setStep,
    getByCode,
    markViewed,
    beginRedemption,
  ]);

  return (
    <AnimatePresence mode="wait">
      {isPhaseOne ? (
        <motion.div
          key="phase-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          <AtelierSelectionScreen />
        </motion.div>
      ) : (
        <motion.div
          key="phase-2"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          className="bg-[#F5F0E8]"
        >
          <Configurator />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
