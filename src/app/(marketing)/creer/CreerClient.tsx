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
 */
export function CreerClient() {
  const step = useConfigurator((s) => s.step);
  const loadSharedDesign = useConfigurator((s) => s.loadSharedDesign);
  const loadedSharedDesignRef = useRef(false);
  const isPhaseOne = step === 'atelier';

  useEffect(() => {
    if (loadedSharedDesignRef.current) return;
    loadedSharedDesignRef.current = true;
    const raw = new URLSearchParams(window.location.search).get('design');
    if (!raw) return;
    const design = decodeBraceletDesign(raw);
    if (!design) return;
    loadSharedDesign(design);
    window.history.replaceState(null, '', window.location.pathname);
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
