'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useConfigurator } from '@/lib/store/configurator';
import { AtelierSelectionScreen } from '@/components/configurator/AtelierSelectionScreen';
import { Configurator } from '@/components/configurator/Configurator';
import { decodeBraceletDesign } from '@/lib/utils/share-design';

/**
 * Two-phase /creer flow :
 *   Phase 1 (step='atelier')  : fullscreen atelier + size picker, no preview.
 *   Phase 2 (step='beads'..'review') : bracelet preview + beads/charms editor.
 *
 * The page also handles the share-link URL hand-off :
 *   ?design=<encoded> : view-only share link (someone showed off their
 *                       bracelet). Loads the design into the configurator.
 */
export function CreerClient() {
  const step = useConfigurator((s) => s.step);
  const loadSharedDesign = useConfigurator((s) => s.loadSharedDesign);
  // Run-once guard: React 19 Strict Mode runs effects twice in dev, and we
  // don't want to double-load the shared design.
  const handledRef = useRef(false);
  const isPhaseOne = step === 'atelier';

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;
    const params = new URLSearchParams(window.location.search);

    const designRaw = params.get('design');
    if (designRaw) {
      const design = decodeBraceletDesign(designRaw);
      if (design) loadSharedDesign(design);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [loadSharedDesign]);

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
