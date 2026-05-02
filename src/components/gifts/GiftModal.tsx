'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Gift, Share2, Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import type { BraceletConfig, GiftCard } from '@/types';
import { ATELIERS, ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useGiftCards } from '@/lib/store/gift-cards';
import { useT } from '@/lib/i18n/use-t';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';

type GiftMode = 'designed' | 'open';

interface GiftModalProps {
  open: boolean;
  /** Initial mode the modal opens in. The user can still flip between modes
   *  if they entered the modal from the configurator (designed mode allows
   *  switching back to "let them design themselves"). */
  initialMode: GiftMode;
  /** Required when initialMode === 'designed'. The current bracelet config
   *  is snapshotted as the gift's designed bracelet. */
  design?: BraceletConfig;
  /** Optional preselected atelier for open mode (e.g. recipient lands on a
   *  /offrir/<atelier> page later). Defaults to the first atelier. */
  initialAtelierId?: string;
  onClose: () => void;
}

export function GiftModal({
  open,
  initialMode,
  design,
  initialAtelierId,
  onClose,
}: GiftModalProps) {
  // The modal pivots between two screens : the form to compose the gift and
  // the confirmation showing the freshly-minted code. We reset both each
  // time the modal opens to avoid stale state from a previous open.
  const [mode, setMode] = useState<GiftMode>(initialMode);
  const [atelierId, setAtelierId] = useState<string>(
    initialAtelierId ?? ATELIERS[0]?.id ?? '',
  );
  const [senderName, setSenderName] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [card, setCard] = useState<GiftCard | null>(null);

  const createDesignedGift = useGiftCards((s) => s.createDesignedGift);
  const createOpenGift = useGiftCards((s) => s.createOpenGift);
  const { t } = useT();

  // When a designed bracelet is provided we lock the mode UI to "designed"
  // by default, but the sender can still flip to "open" if they prefer the
  // recipient to compose their own — useful when they're not sure what the
  // recipient would like.
  const designedAvailable = Boolean(design);
  const effectiveAtelier = ATELIER_BY_ID[atelierId];

  function handleClose() {
    onClose();
    // Defer reset slightly so the close animation isn't disrupted by content
    // jumping back to the form view mid-fade.
    window.setTimeout(() => {
      setMode(initialMode);
      setAtelierId(initialAtelierId ?? ATELIERS[0]?.id ?? '');
      setSenderName('');
      setRecipientName('');
      setMessage('');
      setCard(null);
    }, 220);
  }

  function handleCreate() {
    if (mode === 'designed') {
      if (!design) return;
      const created = createDesignedGift({
        design,
        senderName,
        recipientName,
        message,
      });
      setCard(created);
      haptic([6, 18, 6]);
    } else {
      if (!atelierId) return;
      const created = createOpenGift({
        atelierId,
        senderName,
        recipientName,
        message,
      });
      setCard(created);
      haptic([6, 18, 6]);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="gift-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[2300] flex items-center justify-center bg-[rgba(26,32,44,0.62)] p-4 backdrop-blur-[3px]"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 14, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 8, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-lg overflow-hidden rounded-[1.5rem] border border-[#EEE9E0] bg-white shadow-2xl"
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

            {card ? (
              <GiftConfirmation card={card} onClose={handleClose} />
            ) : (
              <div className="p-6 md:p-7">
                <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                  <Gift size={14} strokeWidth={2.2} />
                  {t('giftModal.eyebrow')}
                </div>
                <h3 className="font-serif text-[22px] md:text-[24px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                  {t('giftModal.title')}
                </h3>
                <p className="mt-2 text-[12px] font-semibold text-[#718096]">
                  {mode === 'designed'
                    ? t('giftModal.designedHelp')
                    : t('giftModal.openHelp')}
                </p>

                {/* Mode toggle — only meaningful when a designed bracelet is
                    available. The "open" radio is always visible so the
                    sender can convert a design-in-progress into a free
                    creation gift. */}
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!designedAvailable) return;
                      haptic(4);
                      setMode('designed');
                    }}
                    disabled={!designedAvailable}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                      mode === 'designed' && designedAvailable
                        ? 'border-[#3D5A73] bg-[#3D5A73] text-white shadow-md'
                        : 'border-[#EEE9E0] bg-white text-[#2D3748] hover:border-[#A8BED4]',
                      !designedAvailable && 'cursor-not-allowed opacity-40',
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t('giftModal.modeDesigned')}
                    </span>
                    <span className="text-[11px] font-semibold opacity-90">
                      {t('giftModal.modeDesigned.detail')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      haptic(4);
                      setMode('open');
                    }}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all',
                      mode === 'open'
                        ? 'border-[#3D5A73] bg-[#3D5A73] text-white shadow-md'
                        : 'border-[#EEE9E0] bg-white text-[#2D3748] hover:border-[#A8BED4]',
                    )}
                  >
                    <span className="text-[10px] font-black uppercase tracking-widest">
                      {t('giftModal.modeOpen')}
                    </span>
                    <span className="text-[11px] font-semibold opacity-90">
                      {t('giftModal.modeOpen.detail')}
                    </span>
                  </button>
                </div>

                {/* Atelier picker — only relevant for open gifts. For designed
                    gifts the atelier is locked to the snapshotted design. */}
                {mode === 'open' ? (
                  <div className="mt-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                      {t('giftModal.atelierLocked')}
                    </label>
                    <div className="mt-2 grid gap-2">
                      {ATELIERS.map((a) => {
                        const active = atelierId === a.id;
                        return (
                          <button
                            key={a.id}
                            type="button"
                            onClick={() => {
                              haptic(4);
                              setAtelierId(a.id);
                            }}
                            className={cn(
                              'flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-all',
                              active
                                ? 'border-[#3D5A73] bg-[#F5F0E8] shadow-sm'
                                : 'border-[#EEE9E0] bg-white hover:border-[#A8BED4]',
                            )}
                          >
                            <div>
                              <p className="text-[12px] font-black uppercase tracking-tight text-[#2D3748]">
                                {a.name}
                              </p>
                              <p className="text-[10px] font-semibold text-[#718096]">
                                {a.tagline}
                              </p>
                            </div>
                            <span className="font-serif text-[18px] font-black tracking-tighter text-[#2D3748] tabular-nums">
                              {formatPrice(a.price)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : design ? (
                  <div className="mt-4 rounded-xl border border-[#EEE9E0] bg-[#F5F0E8] p-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                      {t('giftModal.bracelet')}
                    </p>
                    <div className="mt-1 flex items-center justify-between gap-3">
                      <p className="text-[13px] font-black uppercase tracking-tight text-[#2D3748]">
                        {design.title || t('share.defaultName')} ·{' '}
                        {ATELIER_BY_ID[design.atelierId]?.name ?? '—'}
                      </p>
                      <span className="font-serif text-[18px] font-black tracking-tighter text-[#2D3748] tabular-nums">
                        {formatPrice(design.price)}
                      </span>
                    </div>
                  </div>
                ) : null}

                {/* Sender / recipient names */}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="gift-sender"
                      className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]"
                    >
                      {t('giftModal.from')}
                    </label>
                    <input
                      id="gift-sender"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder={t('giftModal.fromPlaceholder')}
                      maxLength={32}
                      className="mt-1 h-11 w-full rounded-lg border border-[#EEE9E0] bg-[#F5F0E8] px-3 text-[13px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="gift-recipient"
                      className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]"
                    >
                      {t('giftModal.to')}
                    </label>
                    <input
                      id="gift-recipient"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder={t('giftModal.toPlaceholder')}
                      maxLength={32}
                      className="mt-1 h-11 w-full rounded-lg border border-[#EEE9E0] bg-[#F5F0E8] px-3 text-[13px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73] focus:bg-white"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label
                    htmlFor="gift-message"
                    className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]"
                  >
                    {t('giftModal.message')}
                  </label>
                  <textarea
                    id="gift-message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('giftModal.messagePlaceholder')}
                    maxLength={180}
                    rows={3}
                    className="mt-1 w-full resize-none rounded-lg border border-[#EEE9E0] bg-white px-3 py-2 text-[13px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73]"
                  />
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                    {t('giftModal.total')}{' '}
                    <span className="text-[14px] tracking-tighter text-[#2D3748]">
                      {mode === 'designed' && design
                        ? formatPrice(design.price)
                        : effectiveAtelier
                          ? formatPrice(effectiveAtelier.price)
                          : '—'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={mode === 'designed' ? !design : !atelierId}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-5 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Sparkles size={13} strokeWidth={2.2} />
                    {t('giftModal.generate')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function GiftConfirmation({ card, onClose }: { card: GiftCard; onClose: () => void }) {
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [shareState, setShareState] = useState<string | null>(null);
  const { t } = useT();

  const giftUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/creer?gift=${encodeURIComponent(card.code)}`
      : `/creer?gift=${encodeURIComponent(card.code)}`;

  async function handleCopy() {
    if (typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(card.code);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 1800);
    } catch {
      // Silent — user will see the code on screen anyway.
    }
  }

  async function handleShare() {
    if (typeof navigator === 'undefined') return;
    // Note: outgoing share text stays in the recipient's locale (we don't
    // know what language they read in). For our toast feedback we use the
    // sender's language via t().
    const shareText = card.recipientName
      ? `${card.recipientName}, votre bracelet vous attend chez My Nice Bracelet.`
      : 'Votre bracelet vous attend chez My Nice Bracelet.';
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Carte cadeau My Nice Bracelet',
          text: `${shareText} Code : ${card.code}`,
          url: giftUrl,
        });
        setShareState(t('action.shareOpen'));
      } else {
        await navigator.clipboard.writeText(`${shareText}\nCode : ${card.code}\n${giftUrl}`);
        setShareState(t('action.linkCopied'));
      }
    } catch {
      setShareState(t('action.shareCancelled'));
    }
    window.setTimeout(() => setShareState(null), 2400);
  }

  const atelierName =
    card.atelierId && ATELIER_BY_ID[card.atelierId]
      ? ATELIER_BY_ID[card.atelierId]!.name
      : null;

  return (
    <div className="p-6 md:p-7">
      <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#244A35]">
        <Check size={14} strokeWidth={2.4} />
        {t('giftConfirm.eyebrow')}
      </div>
      <h3 className="font-serif text-[22px] md:text-[24px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
        {t('giftConfirm.title')}
      </h3>
      <p className="mt-2 text-[12px] font-semibold text-[#718096]">
        {card.kind === 'designed'
          ? t('giftConfirm.helpDesigned')
          : `${t('giftConfirm.helpOpen')} ${atelierName ?? ''}.`}
      </p>

      {/* Big code block — easy to read, easy to copy */}
      <div className="mt-5 rounded-2xl border border-dashed border-[#3D5A73] bg-[#F5F0E8] p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
          {t('giftConfirm.codeLabel')}
        </p>
        <p className="mt-2 font-serif text-[26px] md:text-[30px] font-black tracking-[0.18em] text-[#2D3748] tabular-nums">
          {card.code}
        </p>
        {card.recipientName && (
          <p className="mt-2 text-[11px] font-semibold text-[#718096]">
            {t('giftConfirm.recipient')} {card.recipientName}
            {card.senderName ? ` · ${t('giftConfirm.fromShort')} ${card.senderName}` : ''}
          </p>
        )}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#EEE9E0] bg-white text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73]"
        >
          {copyState === 'copied' ? (
            <Check size={13} strokeWidth={2.4} />
          ) : (
            <Copy size={13} strokeWidth={2.2} />
          )}
          {copyState === 'copied' ? t('giftConfirm.copied') : t('giftConfirm.copyCode')}
        </button>
        <button
          type="button"
          onClick={handleShare}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
        >
          <Share2 size={13} strokeWidth={2.2} />
          {shareState ?? t('giftConfirm.sendLink')}
        </button>
      </div>

      <p className="mt-3 break-all rounded-lg bg-[#F8F4ED] px-3 py-2 text-[11px] font-semibold text-[#718096]">
        {giftUrl}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="mt-4 h-10 w-full rounded-lg border border-[#EEE9E0] bg-white text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73]"
      >
        {t('giftConfirm.done')}
      </button>
    </div>
  );
}
