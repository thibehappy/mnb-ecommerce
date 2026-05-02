'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useConfigurator } from '@/lib/store/configurator';
import { Configurator } from '@/components/configurator/Configurator';
import { decodeBraceletDesign } from '@/lib/utils/share-design';

/**
 * /creer opens directly in the Studio.
 * The atelier recipe can still be changed inside the tool, but it is no longer
 * a blocking pre-step before the bracelet appears.
 */
export function CreerClient() {
  const setStep = useConfigurator((s) => s.setStep);
  const loadSharedDesign = useConfigurator((s) => s.loadSharedDesign);
  const loadedSharedDesignRef = useRef(false);

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

  useEffect(() => {
    setStep('beads');
  }, [setStep]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="studio"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        className="bg-[#F5F0E8]"
      >
        <Configurator />
      </motion.div>
    </AnimatePresence>
  );
}
