'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';
import { IconButton } from './IconButton';

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  side?: 'right' | 'left';
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Drawer({ open, onClose, title, side = 'right', width = 'max-w-md', children, footer }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] bg-[rgba(26,26,26,0.35)] backdrop-blur-[2px]"
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: side === 'right' ? '100%' : '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: side === 'right' ? '100%' : '-100%' }}
            transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute top-0 ${side === 'right' ? 'right-0' : 'left-0'} h-full w-full ${width} bg-[var(--color-paper)] shadow-[0_20px_60px_-20px_rgba(26,26,26,0.25)] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={title}
          >
            <header className="flex items-center justify-between border-b border-[var(--color-line)] px-6 py-5">
              <h2 className="text-display-s">{title}</h2>
              <IconButton onClick={onClose} aria-label="Fermer" variant="ghost">
                <X size={18} strokeWidth={1.5} />
              </IconButton>
            </header>
            <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
            {footer ? (
              <footer className="border-t border-[var(--color-line)] px-6 py-5 bg-[var(--color-canvas)]">
                {footer}
              </footer>
            ) : null}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
