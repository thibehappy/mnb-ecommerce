'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Gift, KeyRound, X } from 'lucide-react';
import { useState } from 'react';
import { useGiftCards } from '@/lib/store/gift-cards';
import { formatGiftCodeInput, normalizeGiftCode } from '@/lib/utils/gift-code';
import { useT } from '@/lib/i18n/use-t';
import { haptic } from '@/lib/utils/feedback';

interface GiftRedemptionModalProps {
  open: boolean;
  onClose: () => void;
  /** Called with the canonical code when a valid card is found. The parent
   *  is responsible for navigating / loading state from the card. */
  onRedeem: (code: string) => void;
}

/**
 * Modal asking the recipient to type the gift code they received. We do a
 * local lookup against the gift-cards store: if found, we hand the
 * canonical code up to the parent, which decides what to do (navigate to
 * /creer with the gift loaded, etc).
 */
export function GiftRedemptionModal({ open, onClose, onRedeem }: GiftRedemptionModalProps) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState<string | null>(null);
  const getByCode = useGiftCards((s) => s.getByCode);
  const { t } = useT();

  function handleClose() {
    onClose();
    window.setTimeout(() => {
      setRaw('');
      setError(null);
    }, 220);
  }

  function handleSubmit() {
    const code = normalizeGiftCode(raw);
    if (!code) {
      setError(t('giftRedeem.invalidFormat'));
      return;
    }
    const card = getByCode(code);
    if (!card) {
      setError(t('giftRedeem.notFound'));
      return;
    }
    haptic([6, 18, 6]);
    onRedeem(card.code);
    handleClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gift-redeem"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[2400] flex items-center justify-center bg-[rgba(26,32,44,0.62)] p-4 backdrop-blur-[3px]"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.5rem] border border-[#EEE9E0] bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleClose}
              aria-label={t('unboxing.close')}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#718096] transition-colors hover:bg-[#F5F0E8] hover:text-[#2D3748]"
            >
              <X size={17} strokeWidth={2} />
            </button>

            <div className="p-6 md:p-7">
              <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <Gift size={14} strokeWidth={2.2} />
                {t('giftRedeem.eyebrow')}
              </div>
              <h3 className="font-serif text-[22px] md:text-[24px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                {t('giftRedeem.title')}
              </h3>
              <p className="mt-2 text-[12px] font-semibold text-[#718096]">
                {t('giftRedeem.subtitle')}
              </p>

              <label htmlFor="gift-code" className="sr-only">
                {t('giftConfirm.codeLabel')}
              </label>
              <div className="mt-5 flex h-14 items-center gap-2 rounded-xl border border-[#EEE9E0] bg-[#F5F0E8] px-3 transition-colors focus-within:border-[#3D5A73] focus-within:bg-white">
                <KeyRound size={16} strokeWidth={2} className="text-[#A8BED4]" />
                <input
                  id="gift-code"
                  autoFocus
                  inputMode="text"
                  autoCapitalize="characters"
                  spellCheck={false}
                  value={raw}
                  onChange={(e) => {
                    setError(null);
                    setRaw(formatGiftCodeInput(e.target.value));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSubmit();
                    }
                  }}
                  placeholder={t('giftRedeem.placeholder')}
                  className="h-full flex-1 bg-transparent font-serif text-[18px] font-black tracking-[0.18em] text-[#2D3748] tabular-nums outline-none placeholder:text-[#A8BED4] placeholder:tracking-widest"
                />
              </div>
              {error && (
                <p className="mt-2 text-[11px] font-semibold text-[#A4473E]">{error}</p>
              )}

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="h-11 rounded-lg border border-[#EEE9E0] bg-white text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73]"
                >
                  {t('giftRedeem.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                >
                  <Gift size={13} strokeWidth={2.2} />
                  {t('giftRedeem.open')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
