'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useConfigurator } from '@/lib/store/configurator';
import { AVAILABLE_MOODS, moodLabel, type Mood } from '@/lib/harmony/rules';
import { haptic } from '@/lib/utils/feedback';
import { cn } from '@/lib/utils/cn';

/**
 * Mood palettes — three colors that represent the mood's stone family.
 * Used as visual chips inside the picker modal.
 */
const MOOD_PALETTES: Record<Mood, string[]> = {
  jardin: ['#7A9B6E', '#D4A8A0', '#EDE4D3'],
  nuit: ['#1A1A1A', '#3B5A7A', '#DCD4CC'],
  solaire: ['#B8823C', '#D4A855', '#B85A3C'],
  romantique: ['#D4A8A0', '#EDE4D3', '#8B6F9B'],
  minimaliste: ['#1A1A1A', '#EDE4D3', '#FFFFFF'],
  kawaii: ['#D4A8A0', '#EDE4D3', '#7CADA6'],
  mystique: ['#8B6F9B', '#1E1A1A', '#DCD4CC'],
};

const MOOD_DESCRIPTIONS: Record<Mood, string> = {
  jardin: 'Jade, quartz rose, nacre',
  nuit: 'Onyx, lapis, pierre de lune',
  solaire: 'Ambre, citrine, cornaline',
  romantique: 'Quartz rose, nacre, améthyste',
  minimaliste: 'Onyx & nacre',
  kawaii: 'Pastels & ponctuations',
  mystique: 'Améthyste, obsidienne',
};

export function InspireButton() {
  const applyInspired = useConfigurator((s) => s.applyInspired);
  const [open, setOpen] = useState(false);
  const [lastMood, setLastMood] = useState<Mood | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  function handleMood(mood?: Mood) {
    haptic(8);
    const applied = applyInspired(mood);
    setLastMood(applied);
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          haptic(6);
          setOpen(true);
        }}
        className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-[#3D5A73] hover:bg-[#2A3F50] text-white text-[10px] uppercase tracking-widest font-black shadow-md hover:shadow-lg active:scale-95 transition-all"
      >
        <Sparkles size={14} strokeWidth={2.2} />
        {lastMood ? `Inspiré · ${moodLabel(lastMood)}` : 'Inspire-moi'}
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                key="inspire-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setOpen(false)}
                className="fixed inset-0 z-[2000] bg-[rgba(26,32,44,0.6)] backdrop-blur-[2px] flex items-center justify-center p-4 overflow-y-auto"
              >
            <motion.div
              initial={{ scale: 0.96, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.96, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-white rounded-[1.5rem] md:rounded-[2rem] max-w-lg w-full shadow-2xl border border-[#EEE9E0] my-auto"
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="absolute top-4 right-4 inline-flex items-center justify-center h-9 w-9 rounded-full text-[#718096] hover:bg-[#F5F0E8] hover:text-[#2D3748] transition-colors"
              >
                <X size={18} strokeWidth={1.8} />
              </button>

              <div className="p-6 md:p-8">
                <div className="mb-6">
                  <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.4em] text-[#3D5A73] inline-flex items-center gap-2">
                    <Sparkles size={12} /> Moteur d&rsquo;harmonie
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif font-black text-[#2D3748] tracking-tighter uppercase leading-tight mt-2">
                    Inspirez-moi
                  </h3>
                  <p className="text-[13px] text-[#718096] italic leading-relaxed mt-1">
                    Choisissez une ambiance ou laissez-nous vous surprendre.
                  </p>
                </div>

                {/* Random / surprise me */}
                <button
                  type="button"
                  onClick={() => handleMood()}
                  className="w-full mb-5 inline-flex items-center justify-between px-5 py-4 rounded-2xl bg-[#2D3748] hover:bg-[#1A202C] text-white text-[11px] font-black uppercase tracking-widest shadow-md active:scale-[0.99] transition-all"
                >
                  <span className="inline-flex items-center gap-2">
                    <Sparkles size={14} strokeWidth={2.2} />
                    Surprenez-moi
                  </span>
                  <span className="text-white/60 text-[10px]">aléatoire</span>
                </button>

                <div className="grid grid-cols-2 gap-2 md:gap-3">
                  {AVAILABLE_MOODS.map((mood) => (
                    <button
                      key={mood}
                      type="button"
                      onClick={() => handleMood(mood)}
                      className={cn(
                        'group relative flex items-center gap-3 p-3 md:p-3.5 rounded-2xl border-2 border-[#EEE9E0] bg-white hover:border-[#3D5A73] hover:shadow-md active:scale-[0.98] transition-all text-left',
                      )}
                    >
                      <div className="flex -space-x-1.5 shrink-0">
                        {MOOD_PALETTES[mood].map((hex, i) => (
                          <span
                            key={i}
                            className="inline-block h-7 w-7 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[12px] md:text-[13px] font-serif font-black text-[#2D3748] uppercase tracking-tight leading-none mb-1">
                          {moodLabel(mood)}
                        </p>
                        <p className="text-[10px] text-[#A8BED4] font-medium italic leading-tight truncate">
                          {MOOD_DESCRIPTIONS[mood]}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4] text-center mt-6">
                  Le moteur respecte les contraintes de votre atelier
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
