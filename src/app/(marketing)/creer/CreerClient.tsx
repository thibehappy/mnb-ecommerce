'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useConfigurator } from '@/lib/store/configurator';
import { AtelierSelectionScreen } from '@/components/configurator/AtelierSelectionScreen';
import { Configurator } from '@/components/configurator/Configurator';

/**
 * Two-phase /creer flow :
 *   Phase 1 (step='atelier')  : fullscreen atelier + size picker, no preview.
 *   Phase 2 (step='beads'..'review') : bracelet preview + beads/charms editor.
 */
export function CreerClient() {
  const step = useConfigurator((s) => s.step);
  const isPhaseOne = step === 'atelier';

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
