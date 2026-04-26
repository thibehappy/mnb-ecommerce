'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useState } from 'react';

interface Item {
  title: string;
  content: React.ReactNode;
}

export function Accordion({ items, defaultOpen = -1 }: { items: Item[]; defaultOpen?: number }) {
  const [openIdx, setOpenIdx] = useState(defaultOpen);
  return (
    <div className="divide-y divide-[var(--color-line)] border-y border-[var(--color-line)]">
      {items.map((item, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i}>
            <button
              type="button"
              onClick={() => setOpenIdx(isOpen ? -1 : i)}
              className="flex w-full items-center justify-between py-5 text-left text-[15px] transition-colors hover:text-[var(--color-gold-deep)]"
              aria-expanded={isOpen}
            >
              <span className="font-medium">{item.title}</span>
              <motion.span
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              >
                <Plus size={18} strokeWidth={1.3} />
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="pb-6 pr-8 text-[15px] text-[var(--color-graphite)] leading-relaxed">
                    {item.content}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
