'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Check,
  Copy,
  Gift,
  GripHorizontal,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Share2,
  ShoppingBag,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  useConfigurator,
  useConfiguratorPrice,
  snapshotConfig,
  resolveBead,
  resolveCharm,
  countBeads,
  countCharms,
  totalLengthMm,
  targetMm as targetMmOf,
  getSizeFit,
  type SharedBraceletDesign,
} from '@/lib/store/configurator';
import type { FulfillmentMode } from '@/types';
import { useCart } from '@/lib/store/cart';
import { ATELIER_BY_ID, ATELIERS, NON_STONE_FAMILIES, STONE_FAMILIES } from '@/lib/mocks/ateliers';
import { BraceletPreview, type BraceletPreviewHandle } from './BraceletPreview';
import { BeadPicker } from './BeadPicker';
import { CharmPicker } from './CharmPicker';
import { InspireButton } from './InspireButton';
import { DragGhost } from './DragGhost';
import { SharePreview } from './SharePreview';
import { CompositionTray } from './CompositionTray';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import { beadPhotoZoom } from '@/lib/utils/bead-display';
import {
  formatBeadSize,
  formatCm,
  formatCmFromMm,
  formatLengthRangeCompact,
  formatPrice,
} from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { atelierSound, haptic, successMoment } from '@/lib/utils/feedback';
import { encodeBraceletDesign } from '@/lib/utils/share-design';
import { useGiftCards } from '@/lib/store/gift-cards';
import { GiftModal } from '@/components/gifts/GiftModal';
import { useT } from '@/lib/i18n/use-t';

const TAB_IDS = ['beads', 'stones', 'charms'] as const;
type TabId = (typeof TAB_IDS)[number];

interface PaletteDrag {
  kind: 'bead' | 'charm';
  refId: string;
  x0: number;
  y0: number;
  x: number;
  y: number;
  active: boolean;
}

const DRAG_THRESHOLD = 5;

const DEFAULT_BRACELET_NAME = 'Ma création';

/**
 * The two ways the bracelet can be fulfilled. Labels resolved at render
 * time via the i18n hook so FR/EN both work. Order matters: DIY first
 * because it's the default + recommended.
 */
const FULFILLMENT_IDS: FulfillmentMode[] = ['diy-kit', 'assembled-paris'];

export function Configurator() {
  const {
    step,
    setStep,
    components,
    figurine,
    atelierId,
    sizeCm,
    sizeLabel,
    setSize,
    adjustSize,
    selectedComponent,
    select,
    removeComponent,
    moveComponent,
    insertBeadAt,
    insertCharmAt,
    clearComponents,
    reset,
    setAtelier,
  } = useConfigurator();
  // Pulled separately because they're not part of the broad destructure above
  // — the bracelet name is persisted in the store as `draftTitle` so that it
  // survives reloads and is hydrated when a shared `?design=...` URL loads.
  const draftTitle = useConfigurator((s) => s.draftTitle);
  const setDraftMeta = useConfigurator((s) => s.setDraftMeta);
  const addCustom = useCart((s) => s.addCustom);
  const price = useConfiguratorPrice();
  const atelier = ATELIER_BY_ID[atelierId];

  // Gift card state — `activeRedemptionCode` is set when the user lands here
  // via a `?gift=…` link or types a code on the atelier screen. While it's
  // non-null we shift the language of the primary CTA from "add to cart" to
  // "confirm gift", and surface a banner reminding the user they're acting
  // on someone else's gift.
  const activeRedemptionCode = useGiftCards((s) => s.activeRedemptionCode);
  const activeGiftCard = useGiftCards((s) =>
    s.activeRedemptionCode ? s.cards.find((c) => c.code === s.activeRedemptionCode) : undefined,
  );
  const updateDesignedGift = useGiftCards((s) => s.updateDesignedGift);
  const markGiftRedeemed = useGiftCards((s) => s.markRedeemed);
  const endRedemption = useGiftCards((s) => s.endRedemption);
  const { t, lang } = useT();

  // Fulfillment mode chosen at order time : DIY kit (default — pieces
  // packaged separately to assemble at home) or assembled in our Paris
  // atelier. The value rides on the snapshot persisted in the cart line
  // so the checkout page can display it on the receipt.
  const [fulfillmentMode, setFulfillmentMode] =
    useState<FulfillmentMode>('diy-kit');

  const [justAddedCart, setJustAddedCart] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareName, setShareName] = useState('');
  const [giftModalOpen, setGiftModalOpen] = useState(false);
  const [giftRedeemedConfirm, setGiftRedeemedConfirm] = useState(false);
  const [unboxingOpen, setUnboxingOpen] = useState(false);
  // CompositionTray ("Ma composition") is hidden by default — surfacing it
  // costs vertical real estate and confuses first-time users. The toggle
  // sits next to "Recommencer" so reordering / batch-removing pieces is one
  // click away when needed.
  const [compositionOpen, setCompositionOpen] = useState(false);
  const [customStepperOpen, setCustomStepperOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const addToCartRef = useRef<HTMLDivElement>(null);
  const braceletRef = useRef<BraceletPreviewHandle>(null);

  const ZOOM_STEP = 1.2;
  const ZOOM_MIN = 0.5;
  const ZOOM_MAX = 3;
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z * ZOOM_STEP).toFixed(2)));
  const zoomOut = () => {
    setZoom((z) => {
      const next = Math.max(ZOOM_MIN, +(z / ZOOM_STEP).toFixed(2));
      // Once we're back at or below 1, snap pan back to the origin so the
      // user doesn't end up with off-center content.
      if (next <= 1.001) setPan({ x: 0, y: 0 });
      return next;
    });
  };
  const zoomReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Reset zoom + pan whenever the atelier changes (fresh stage).
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [atelierId]);

  // Palette drag state — owned at this level so we can dispatch to bracelet
  const [paletteDrag, setPaletteDrag] = useState<PaletteDrag | null>(null);
  // Mirror in a ref so handlers read the freshest value without re-binding
  const paletteDragRef = useRef<PaletteDrag | null>(null);
  useEffect(() => {
    paletteDragRef.current = paletteDrag;
  }, [paletteDrag]);

  // Active tab : if user is on 'atelier' (shouldn't happen here), default to 'beads'.
  // Also force 'beads' when the atelier doesn't allow charms (Bracelet Bar).
  // Stones tab is Classique-only; Charms tab requires atelier.allowCharms.
  // Anything else collapses back to "beads" (the always-available tab).
  const isClassique = atelier?.id === 'atelier_classique';
  const tab: TabId =
    step === 'charms' && atelier?.allowCharms
      ? 'charms'
      : step === 'stones' && isClassique
        ? 'stones'
        : 'beads';

  const beadsCount = countBeads(components);
  const charmsCount = countCharms(components);
  const targetMm = targetMmOf(atelierId, sizeCm);
  const lengthMm = totalLengthMm(components);
  const fit = getSizeFit(atelierId, sizeCm, components);
  const canOrder = fit.status === 'ready';
  const fitMessage =
    fit.status === 'empty'
      ? t('fit.empty')
      : fit.status === 'ready'
        ? `${t('fit.ready')} · ${formatCmFromMm(lengthMm, lang)}`
        : fit.status === 'too-long'
          ? `${t('fit.tooLong')} ${formatCmFromMm(fit.overflowMm, lang)} · ${t('fit.tooLongSuffix')}`
          : `${t('fit.tooShort')} ${formatCmFromMm(fit.remainingMm, lang)} ${t('fit.tooShortSuffix')}`;

  // Listen to global pointer events while dragging from palette
  useEffect(() => {
    if (!paletteDrag) return;
    function onMove(e: PointerEvent) {
      const prev = paletteDragRef.current;
      if (!prev) return;
      const moved = Math.hypot(e.clientX - prev.x0, e.clientY - prev.y0) > DRAG_THRESHOLD;
      setPaletteDrag({ ...prev, x: e.clientX, y: e.clientY, active: prev.active || moved });
    }
    function onUp(e: PointerEvent) {
      const prev = paletteDragRef.current;
      // Reset state first to avoid setState-during-render warnings
      setPaletteDrag(null);
      if (!prev || !prev.active) return;
      const idx = braceletRef.current?.getInsertIdxAt(e.clientX, e.clientY);
      // null = cursor wasn't near the cord → drop ignored.
      // Anything else (including 0 / list length for "before all" / "after all") is valid.
      if (idx !== null && idx !== undefined) {
        if (prev.kind === 'bead') insertBeadAt(prev.refId, idx);
        else insertCharmAt(prev.refId, idx);
        atelierSound(prev.kind === 'bead' ? 'stone' : 'soft');
        haptic([6, 18, 6]);
      }
    }
    function onCancel() {
      setPaletteDrag(null);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onCancel);
    };
  }, [paletteDrag, insertBeadAt, insertCharmAt]);

  function startPaletteDrag(kind: 'bead' | 'charm', refId: string, e: React.PointerEvent) {
    setPaletteDrag({
      kind,
      refId,
      x0: e.clientX,
      y0: e.clientY,
      x: e.clientX,
      y: e.clientY,
      active: false,
    });
  }

  function openShareModal() {
    if (components.length === 0) return;
    haptic(6);
    // Pre-fill with the previously chosen name, if any.
    setShareName(draftTitle);
    setShareModalOpen(true);
  }

  async function performShare(rawName: string) {
    if (components.length === 0 || typeof window === 'undefined') return;
    const finalName = rawName.trim() || DEFAULT_BRACELET_NAME;
    setDraftMeta(finalName);
    const url = new URL(window.location.href);
    const design: SharedBraceletDesign = {
      atelierId,
      sizeCm,
      sizeLabel,
      components,
      figurine,
      title: finalName,
    };
    url.searchParams.set('design', encodeBraceletDesign(design));
    const shareText = `Regarde mon bracelet "${finalName}" créé chez My Nice Bracelet.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: finalName,
          text: shareText,
          url: url.toString(),
        });
        setShareStatus(t('action.shareOpen'));
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url.toString()}`);
        setShareStatus(t('action.linkCopied'));
      }
      haptic([6, 18, 6]);
    } catch {
      setShareStatus(t('action.shareCancelled'));
    }
    setTimeout(() => setShareStatus(null), 2400);
  }

  function handleAddToCart() {
    if (!canOrder) return;
    const name = draftTitle || DEFAULT_BRACELET_NAME;
    const design = snapshotConfig(
      useConfigurator.getState(),
      name,
      undefined,
      fulfillmentMode,
    );
    addCustom(design, 1);
    const rect = addToCartRef.current?.getBoundingClientRect();
    const origin = rect
      ? {
          x: (rect.left + rect.width / 2) / window.innerWidth,
          y: (rect.top + rect.height / 2) / window.innerHeight,
        }
      : undefined;
    successMoment(origin);
    setJustAddedCart(true);
    setUnboxingOpen(true);
    setTimeout(() => setJustAddedCart(false), 2000);
  }

  /**
   * Confirm a gift redemption. The recipient pressed "Confirmer ce cadeau"
   * after viewing (and optionally tweaking) the bracelet. We :
   *   1. Snapshot the (possibly tweaked) design back into the gift card so
   *      the artisan ships exactly what's been confirmed.
   *   2. Mark the card as redeemed — it becomes read-only afterwards.
   *   3. Show a brief confirmation moment and clear the active redemption.
   */
  function handleConfirmGift() {
    if (!canOrder || !activeGiftCard) return;
    const name = draftTitle || activeGiftCard.design?.title || DEFAULT_BRACELET_NAME;
    const design = snapshotConfig(
      useConfigurator.getState(),
      name,
      undefined,
      fulfillmentMode,
    );
    if (activeGiftCard.kind === 'designed' || activeGiftCard.kind === 'open') {
      updateDesignedGift(activeGiftCard.code, design);
    }
    markGiftRedeemed(activeGiftCard.code);
    successMoment();
    setGiftRedeemedConfirm(true);
    setTimeout(() => {
      setGiftRedeemedConfirm(false);
      endRedemption();
    }, 2400);
  }

  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-10">
        {/* Top bar : back to atelier + atelier name */}
        <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
          <button
            type="button"
            onClick={() => {
              haptic(6);
              setStep('atelier');
              if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#718096] hover:text-[#2D3748] transition-colors"
          >
            <ArrowLeft size={14} strokeWidth={2} />
            {t('configurator.changeAtelier')}
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
            {atelier?.name} · {atelier?.wireType}
          </p>
        </div>

        {/* Active gift redemption banner — surfaces when the recipient
            arrived via a `?gift=…` link or typed a code. Explains the mode,
            shows the sender + message, and gives an escape hatch. */}
        {activeGiftCard && (
          <div className="mb-5 rounded-2xl border border-[#3D5A73] bg-[#F5F0E8] p-3 md:p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#3D5A73] text-white">
                  <Gift size={16} strokeWidth={2.2} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                    {activeGiftCard.kind === 'designed'
                      ? t('gift.banner.toValidate')
                      : t('gift.banner.toCompose')}
                    {activeGiftCard.senderName
                      ? ` · ${t('gift.banner.from')} ${activeGiftCard.senderName}`
                      : ''}
                  </p>
                  <p className="mt-1 font-serif text-[16px] md:text-[18px] font-black uppercase tracking-tight text-[#2D3748]">
                    {activeGiftCard.kind === 'designed'
                      ? t('gift.banner.tweakDesigned')
                      : t('gift.banner.composeOpen')}
                  </p>
                  {activeGiftCard.message && (
                    <p className="mt-1 text-[12px] font-semibold italic text-[#718096]">
                      « {activeGiftCard.message} »
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  haptic(6);
                  endRedemption();
                }}
                className="inline-flex h-9 items-center gap-2 self-start rounded-full border border-[#EEE9E0] bg-white px-3 text-[10px] font-black uppercase tracking-widest text-[#718096] transition-colors hover:border-[#A4473E] hover:text-[#A4473E]"
              >
                <X size={12} strokeWidth={2.2} />
                {t('gift.banner.exit')}
              </button>
            </div>
          </div>
        )}

        {/* ─── MAIN CARD : warm canvas containing the bracelet AND a floating palette ─── */}
        <div className="relative rounded-[2rem] md:rounded-[3rem] overflow-hidden border border-[#EEE9E0] shadow-md">
          {/* Warm gradient covers the WHOLE card */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 80% 80% at 50% 40%, #FAF6F0 0%, #EEE4D2 55%, #D4C4A8 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] mix-blend-multiply pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
            }}
          />

          <div className="relative grid lg:grid-cols-[1fr_400px] gap-4 md:gap-6 p-4 md:p-6">
            {/* LEFT — bracelet directly on the warm canvas (no inner card).
                Vertically centered. Canvas height kept tight so the action
                buttons stay close to the bracelet. Heavy zoom uses pan to
                navigate beyond the visible bounds. */}
            <div
              className={cn(
                'relative min-h-[460px] md:min-h-[560px] flex items-center justify-center px-3 md:px-4 pb-2 md:pb-3',
                // Just enough top padding to clear the size selector pill
                // (non-Kawaii). Kawaii has no selector, so minimal padding.
                atelier?.id === 'atelier_kawaii' ? 'pt-2 md:pt-3' : 'pt-14 md:pt-16',
              )}
            >
              {/* Size selector — top center of the bracelet stage. Hidden for Kawaii (memory wire = one size). */}
              {atelier?.id !== 'atelier_kawaii' && (
                <div className="absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 w-[min(92%,420px)]">
                  <div className="flex items-center gap-1 bg-white/85 backdrop-blur-md rounded-full p-1 shadow-sm border border-[#EEE9E0] w-full">
                    {atelier?.sizes.map((sz) => {
                      const active = sizeLabel === sz.label;
                      return (
                        <button
                          key={sz.label}
                          type="button"
                          onClick={() => {
                            haptic(4);
                            setSize(sz.label);
                            setCustomStepperOpen(false);
                          }}
                          className={cn(
                            'flex-1 inline-flex flex-col items-center py-1.5 rounded-full transition-colors leading-none',
                            active
                              ? 'bg-[#3D5A73] text-white shadow-sm'
                              : 'text-[#718096] hover:text-[#2D3748]',
                          )}
                        >
                          <span className="font-serif font-black text-[12px] uppercase tracking-tight">
                            {sz.label}
                          </span>
                          <span
                            className={cn(
                              'text-[8px] font-black uppercase tracking-widest tabular-nums mt-0.5',
                              active ? 'opacity-80' : 'opacity-60',
                            )}
                          >
                            {formatCm(sz.cm, lang)}
                          </span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => {
                        haptic(4);
                        setSize('custom');
                        setCustomStepperOpen(true);
                      }}
                      className={cn(
                        'flex-1 inline-flex flex-col items-center py-1.5 rounded-full transition-colors leading-none',
                        sizeLabel === 'custom'
                          ? 'bg-[#3D5A73] text-white shadow-sm'
                          : 'text-[#718096] hover:text-[#2D3748]',
                      )}
                    >
                      <span className="text-[10px] font-black uppercase tracking-tight">
                        {t('size.perso')}
                      </span>
                      <span
                        className={cn(
                          'text-[8px] font-black uppercase tracking-widest tabular-nums mt-0.5',
                          sizeLabel === 'custom' ? 'opacity-80' : 'opacity-60',
                        )}
                      >
                        {sizeLabel === 'custom'
                          ? formatCm(sizeCm, lang)
                          : lang === 'EN' ? '±0.2' : '±0,5'}
                      </span>
                    </button>
                  </div>
                  {sizeLabel === 'custom' && customStepperOpen && (
                    <div className="flex items-center gap-2 bg-white/95 backdrop-blur-md rounded-full p-1.5 shadow-sm border border-[#EEE9E0]">
                      <button
                        type="button"
                        onClick={() => {
                          haptic(4);
                          adjustSize(-0.5);
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#F5F0E8] hover:bg-[#EEE9E0] text-[#3D5A73] transition-colors"
                        aria-label={t('size.decrease')}
                      >
                        <Minus size={14} strokeWidth={2.4} />
                      </button>
                      <span className="font-serif font-black text-[16px] tabular-nums text-[#2D3748] min-w-[64px] text-center">
                        {formatCm(sizeCm, lang)}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          haptic(4);
                          adjustSize(0.5);
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#F5F0E8] hover:bg-[#EEE9E0] text-[#3D5A73] transition-colors"
                        aria-label={t('size.increase')}
                      >
                        <Plus size={14} strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          haptic(8);
                          setCustomStepperOpen(false);
                        }}
                        className="inline-flex items-center gap-1.5 h-8 px-3 ml-1 rounded-full bg-[#3D5A73] hover:bg-[#2A3F50] text-white text-[10px] font-black uppercase tracking-widest transition-colors"
                      >
                        <Check size={12} strokeWidth={2.6} />
                        {t('size.confirm')}
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="w-full">
                <BraceletPreview
                  ref={braceletRef}
                  components={components}
                  targetMm={targetMm}
                  figurine={figurine}
                  variant={atelier?.id === 'atelier_kawaii' ? 'u' : 'loop'}
                  selectedSlotId={selectedComponent}
                  onSelect={(id) => select(id === selectedComponent ? null : id)}
                  onMove={moveComponent}
                  externalDrag={
                    paletteDrag?.active
                      ? {
                          x: paletteDrag.x,
                          y: paletteDrag.y,
                          kind: paletteDrag.kind,
                          refId: paletteDrag.refId,
                        }
                      : null
                  }
                  zoom={zoom}
                  pan={pan}
                  onPanChange={setPan}
                  emptyText={t('configurator.empty')}
                />
              </div>

              {/* Selected component tooltip — pushed below the size selector
                  pill on non-Kawaii ateliers to avoid the overlap at top-right.
                  Kawaii has no selector, so it can sit at the very top. */}
              <AnimatePresence>
                {selectedComponent && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      'absolute right-2 md:right-3 z-10 bg-white rounded-xl p-3 flex items-center gap-2 shadow-xl border border-[#EEE9E0]',
                      atelier?.id === 'atelier_kawaii' ? 'top-2 md:top-3' : 'top-16 md:top-20',
                    )}
                  >
                    <SelectedComponentInfo slotId={selectedComponent} />
                    <button
                      type="button"
                      onClick={() => removeComponent(selectedComponent)}
                      className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-[#A4473E] hover:bg-[#A4473E]/10 transition-colors ml-1"
                      aria-label={t('configurator.remove')}
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Zoom controls — floating bottom-right of bracelet stage */}
              <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 z-10 inline-flex items-center gap-1 bg-white/85 backdrop-blur-md rounded-full p-1 shadow-sm border border-[#EEE9E0]">
                <button
                  type="button"
                  onClick={() => {
                    haptic(4);
                    zoomOut();
                  }}
                  disabled={zoom <= ZOOM_MIN + 0.001}
                  aria-label={t('configurator.zoomOut')}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#3D5A73] hover:bg-[#F5F0E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ZoomOut size={14} strokeWidth={2.2} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic(4);
                    zoomReset();
                  }}
                  aria-label={t('configurator.zoomReset')}
                  className="inline-flex items-center justify-center min-w-[44px] h-8 px-2 rounded-full text-[10px] font-black uppercase tracking-widest tabular-nums text-[#3D5A73] hover:bg-[#F5F0E8] transition-colors"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic(4);
                    zoomIn();
                  }}
                  disabled={zoom >= ZOOM_MAX - 0.001}
                  aria-label={t('configurator.zoomIn')}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#3D5A73] hover:bg-[#F5F0E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ZoomIn size={14} strokeWidth={2.2} />
                </button>
              </div>

              {/* Inspire-moi + Recommencer + Réorganiser floating bottom of bracelet stage */}
              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 z-10 flex flex-wrap items-center gap-2">
                <InspireButton />
                <button
                  type="button"
                  onClick={() => {
                    haptic(10);
                    if (beadsCount + charmsCount === 0) reset();
                    else clearComponents();
                  }}
                  className="inline-flex items-center gap-2 h-10 px-4 rounded-full bg-white/85 backdrop-blur-md border border-[#EEE9E0] text-[10px] font-black uppercase tracking-widest text-[#718096] hover:text-[#2D3748] hover:border-[#3D5A73] transition-colors shadow-sm"
                >
                  <RotateCcw size={13} strokeWidth={2} />
                  {t('configurator.restart')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    haptic(6);
                    setCompositionOpen((v) => !v);
                  }}
                  disabled={beadsCount + charmsCount === 0 && !figurine}
                  className={cn(
                    'inline-flex items-center gap-2 h-10 px-4 rounded-full backdrop-blur-md border text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-50',
                    compositionOpen
                      ? 'bg-[#2D3748] border-[#2D3748] text-white hover:bg-[#3D5A73]'
                      : 'bg-white/85 border-[#EEE9E0] text-[#718096] hover:text-[#2D3748] hover:border-[#3D5A73]',
                  )}
                >
                  <GripHorizontal size={13} strokeWidth={2} />
                  {t('configurator.reorganize')}
                </button>
              </div>
            </div>

            {/* RIGHT — white palette card floating on the warm canvas */}
            <div className="relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white border border-[#EEE9E0] shadow-md flex flex-col lg:max-h-[600px]">
              <div className="overflow-y-auto scrollbar-thin">
                {/* Tab nav — sticky edge-to-edge with its own padding.
                    Top of the palette also exposes an "Univers" pill row so
                    the user can swap atelier without going back to the
                    selection screen. Switching atelier wipes the components
                    (handled in the store) — accepted trade-off since each
                    atelier has a different bead/charm catalog. */}
                <div className="sticky top-0 z-10 bg-white px-5 md:px-7 pt-5 md:pt-7 pb-4 border-b border-[#EEE9E0]">
                  <div className="mb-4">
                    <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                      {t('configurator.universe')}
                    </p>
                    <div className="flex gap-1.5 overflow-x-auto pb-1">
                      {ATELIERS.map((item) => {
                        const active = item.id === atelierId;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              if (active) return;
                              haptic(8);
                              setAtelier(item.id);
                              setStep('beads');
                            }}
                            className={cn(
                              'shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors',
                              active
                                ? 'border-[#2D3748] bg-[#2D3748] text-white'
                                : 'border-[#EEE9E0] bg-[#F8F4ED] text-[#718096] hover:border-[#3D5A73] hover:text-[#2D3748]',
                            )}
                          >
                            {item.id === 'atelier_bracelet_bar'
                              ? t('atelier.bracelet_bar.short')
                              : item.id === 'atelier_kawaii'
                                ? t('atelier.kawaii.short')
                                : t('atelier.classique.short')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div
                    className={cn(
                      'grid gap-2',
                      // Number of visible tabs : 1 (beads only) / 2 (beads +
                      // charms or beads + stones) / 3 (Classique : all three).
                      isClassique && atelier?.allowCharms
                        ? 'grid-cols-3'
                        : atelier?.allowCharms || isClassique
                          ? 'grid-cols-2'
                          : 'grid-cols-1',
                    )}
                  >
                    {TAB_IDS.filter((id) => {
                      if (id === 'charms') return Boolean(atelier?.allowCharms);
                      if (id === 'stones') return isClassique;
                      return true;
                    }).map((id: TabId) => {
                      const active = tab === id;
                      // Kawaii uses figurines (Sanrio / Disney) instead of generic charms.
                      const label =
                        id === 'beads'
                          ? t('tabs.beads')
                          : id === 'stones'
                            ? t('tabs.stones')
                            : atelier?.id === 'atelier_kawaii'
                              ? t('tabs.figurines')
                              : t('tabs.charms');
                      // Beads + Stones share the same length budget (both
                      // sit on the cord). Charms use a count / max badge.
                      const badge =
                        id === 'charms'
                          ? `${charmsCount}/${atelier?.maxCharms ?? 0}`
                          : formatLengthRangeCompact(lengthMm, targetMm, lang);
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => {
                            haptic(6);
                            setStep(id);
                          }}
                          className={cn(
                            'flex items-center justify-between gap-1.5 px-2.5 py-3 rounded-xl border transition-all min-w-0',
                            active
                              ? 'bg-[#2D3748] border-[#2D3748] text-white shadow-md'
                              : 'bg-white border-[#EEE9E0] text-[#718096] hover:border-[#A8BED4]',
                          )}
                        >
                          <span className="text-[10px] font-black uppercase tracking-tight truncate">
                            {label}
                          </span>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center justify-center h-5 px-2 rounded-full text-[9px] font-black tabular-nums whitespace-nowrap',
                              active ? 'bg-white/15 text-white' : 'bg-[#F5F0E8] text-[#3D5A73]',
                            )}
                          >
                            {badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Picker content with own padding */}
                <div className="px-5 md:px-7 py-5 md:py-6">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={tab}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
                    >
                      {tab === 'beads' && (
                        <BeadPicker
                          onTilePointerDown={(refId, e) => startPaletteDrag('bead', refId, e)}
                          // On Classique, "Perles" surfaces only pearls + enamel
                          // shapes (the semi-precious stones live in the dedicated
                          // "Pierres" tab). Other ateliers show everything they
                          // allow — they don't have a Pierres tab to split off to.
                          filterFamilies={isClassique ? NON_STONE_FAMILIES : undefined}
                        />
                      )}
                      {tab === 'stones' && (
                        <BeadPicker
                          onTilePointerDown={(refId, e) => startPaletteDrag('bead', refId, e)}
                          filterFamilies={STONE_FAMILIES}
                          variant="stones"
                        />
                      )}
                      {tab === 'charms' && (
                        <CharmPicker
                          onTilePointerDown={(refId, e) => startPaletteDrag('charm', refId, e)}
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── MA COMPOSITION ─── horizontal tray of placed pieces with
            reorder/remove controls. Hidden by default; shown when the user
            clicks the "Réorganiser" button next to "Recommencer". Also
            requires at least one piece on the cord. */}
        {compositionOpen && (components.length > 0 || figurine) && (
          <div className="mt-4">
            <CompositionTray
              components={components}
              figurine={figurine}
              selectedSlotId={selectedComponent}
              onSelect={(slotId) => {
                haptic(4);
                select(slotId === selectedComponent ? null : slotId);
              }}
              onMove={(from, to) => {
                haptic(4);
                moveComponent(from, to);
              }}
              onRemove={(slotId) => {
                haptic(8);
                removeComponent(slotId);
              }}
            />
          </div>
        )}

        {/* ─── SHARE PREVIEW (carte partagée) ─── */}
        <div className="mt-4">
          <SharePreview
            components={components}
            figurine={figurine}
            title={draftTitle || DEFAULT_BRACELET_NAME}
            sizeCm={sizeCm}
          />
        </div>

        {/* ─── FULFILLMENT MODE ─── assembled-Paris vs DIY kit. Sits right
            above the cart row so the choice is visible at the same scroll
            depth as the price + Ajouter au panier button. Wording matches
            Dany's branch verbatim. Hidden during a gift redemption — the
            sender's chosen mode is already baked into the gift card. */}
        {!activeRedemptionCode && (
          <div className="mt-6 md:mt-8 rounded-[1.5rem] border border-[#EEE9E0] bg-white p-4 md:p-5 shadow-sm">
            <p className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
              {t('fulfillment.label')}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {FULFILLMENT_IDS.map((id) => {
                const active = fulfillmentMode === id;
                const label =
                  id === 'diy-kit' ? t('fulfillment.diy.label') : t('fulfillment.assembled.label');
                const detail =
                  id === 'diy-kit'
                    ? t('fulfillment.diy.detail')
                    : t('fulfillment.assembled.detail');
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      haptic(4);
                      setFulfillmentMode(id);
                    }}
                    className={cn(
                      'rounded-xl border p-3 text-left transition-colors',
                      active
                        ? 'border-[#3D5A73] bg-white text-[#2D3748] shadow-sm'
                        : 'border-[#EEE9E0] bg-[#FBF8F2] text-[#718096] hover:border-[#A8BED4] hover:text-[#2D3748]',
                    )}
                  >
                    <span className="block text-[10px] font-black uppercase tracking-widest">
                      {label}
                    </span>
                    <span className="mt-1 block text-[12px] font-semibold italic leading-relaxed">
                      {detail}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── ACTION ROW ─── primary CTA depends on context :
            - normal : "Ajouter au panier"
            - gift redemption : "Confirmer ce cadeau" (locks the bracelet for
              the artisan; no payment since the sender already paid).
            The "Offrir" button is hidden during redemption — the recipient
            already has a gift, they don't need to make a new one. */}
        <div className="mt-3 md:mt-4 grid sm:grid-cols-[1fr_auto_auto_auto] gap-3 items-stretch bg-[#F5F0E8] rounded-[1.5rem] p-4 md:p-5 border border-[#EEE9E0]">
          <div className="flex items-center justify-between gap-3 px-2 sm:px-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">
                {atelier?.id === 'atelier_kawaii'
                  ? `${atelier?.name} · ${atelier?.wireType}`
                  : `${atelier?.name} · ${sizeLabel === 'custom' ? t('size.perso').replace('.', '') : sizeLabel} · ${formatCm(sizeCm, lang)}`}
              </p>
              <p className="font-serif text-[14px] md:text-[16px] font-black uppercase tracking-tight text-[#2D3748]">
                {fitMessage}
              </p>
            </div>
            <p className="font-serif text-[24px] md:text-[28px] font-black tracking-tighter text-[#2D3748] tabular-nums shrink-0">
              {activeRedemptionCode ? t('action.offered') : formatPrice(price)}
            </p>
          </div>
          <button
            type="button"
            onClick={openShareModal}
            disabled={components.length === 0}
            className="h-full w-full sm:w-auto px-5 py-4 rounded-xl border border-[#EEE9E0] bg-white text-[11px] md:text-[13px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73] hover:text-[#2D3748] disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center justify-center gap-2"
          >
            {shareStatus === t('action.linkCopied') ? (
              <Copy size={14} strokeWidth={2.2} />
            ) : (
              <Share2 size={14} strokeWidth={2.2} />
            )}
            {shareStatus ?? t('action.share')}
          </button>
          {/* "Offrir" — only when not in redemption mode */}
          {!activeRedemptionCode && (
            <button
              type="button"
              onClick={() => {
                haptic(6);
                setGiftModalOpen(true);
              }}
              disabled={components.length === 0}
              className="h-full w-full sm:w-auto px-5 py-4 rounded-xl border border-[#EEE9E0] bg-white text-[11px] md:text-[13px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73] hover:text-[#2D3748] disabled:cursor-not-allowed disabled:opacity-40 inline-flex items-center justify-center gap-2"
            >
              <Gift size={14} strokeWidth={2.2} />
              {t('action.gift')}
            </button>
          )}
          <div ref={addToCartRef}>
            {activeRedemptionCode ? (
              <button
                type="button"
                onClick={handleConfirmGift}
                disabled={!canOrder}
                className="w-full sm:w-auto h-full px-8 py-4 rounded-xl bg-[#244A35] hover:bg-[#1a3525] text-white text-[11px] md:text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
              >
                {giftRedeemedConfirm ? (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    {t('action.confirmed')}
                  </>
                ) : (
                  <>
                    <Gift size={16} strokeWidth={2} />
                    {t('action.confirmGift')}
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!canOrder}
                className="w-full sm:w-auto h-full px-8 py-4 rounded-xl bg-[#3D5A73] hover:bg-[#2A3F50] text-white text-[11px] md:text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
              >
                {justAddedCart ? (
                  <>
                    <Check size={16} strokeWidth={2.5} />
                    {t('action.added')}
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} strokeWidth={2} />
                    {t('action.addToCart')}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Floating ghost following the cursor while dragging from palette */}
      {paletteDrag?.active && (
        <DragGhost
          kind={paletteDrag.kind}
          refId={paletteDrag.refId}
          x={paletteDrag.x}
          y={paletteDrag.y}
        />
      )}

      <ShareModal
        open={shareModalOpen}
        name={shareName}
        onChange={setShareName}
        onClose={() => setShareModalOpen(false)}
        onSubmit={async () => {
          const submitted = shareName;
          setShareModalOpen(false);
          await performShare(submitted);
        }}
      />

      <GiftModal
        open={giftModalOpen}
        initialMode="designed"
        design={
          // Snapshot the current bracelet so the gift carries a stable
          // BraceletConfig, decoupled from later user edits.
          components.length > 0
            ? snapshotConfig(
                useConfigurator.getState(),
                draftTitle || DEFAULT_BRACELET_NAME,
                undefined,
              )
            : undefined
        }
        onClose={() => setGiftModalOpen(false)}
      />

      <UnboxingModal
        open={unboxingOpen}
        title={draftTitle || DEFAULT_BRACELET_NAME}
        price={price}
        lengthMm={lengthMm}
        onClose={() => setUnboxingOpen(false)}
        onShare={() => {
          setUnboxingOpen(false);
          openShareModal();
        }}
      />
    </div>
  );
}

function ShareModal({
  open,
  name,
  onChange,
  onClose,
  onSubmit,
}: {
  open: boolean;
  name: string;
  onChange: (next: string) => void;
  onClose: () => void;
  onSubmit: () => void | Promise<void>;
}) {
  const { t } = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="share-name-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[2200] flex items-center justify-center bg-[rgba(26,32,44,0.62)] p-4 backdrop-blur-[3px]"
          onClick={onClose}
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
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#718096] transition-colors hover:bg-[#F5F0E8] hover:text-[#2D3748]"
            >
              <X size={17} strokeWidth={2} />
            </button>

            <div className="p-6 md:p-7">
              <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <Share2 size={14} strokeWidth={2.2} />
                {t('share.modal.eyebrow')}
              </div>
              <h3 className="font-serif text-[22px] md:text-[24px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                {t('share.modal.title')}
              </h3>
              <p className="mt-2 text-[12px] font-semibold text-[#718096]">
                {t('share.modal.subtitle')}
              </p>

              <label className="sr-only" htmlFor="share-name">
                {t('share.modal.title')}
              </label>
              <input
                id="share-name"
                autoFocus
                value={name}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void onSubmit();
                  }
                }}
                placeholder={t('share.defaultName')}
                maxLength={48}
                className="mt-5 h-12 w-full rounded-lg border border-[#EEE9E0] bg-[#F5F0E8] px-3 text-[14px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73] focus:bg-white"
              />

              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-lg border border-[#EEE9E0] bg-white text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73]"
                >
                  {t('share.modal.cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => void onSubmit()}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                >
                  <Share2 size={13} strokeWidth={2.2} />
                  {t('share.modal.confirm')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function UnboxingModal({
  open,
  title,
  price,
  lengthMm,
  onClose,
  onShare,
}: {
  open: boolean;
  title: string;
  price: number;
  lengthMm: number;
  onClose: () => void;
  onShare: () => void;
}) {
  const { t, lang } = useT();
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="digital-unboxing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[2100] flex items-center justify-center bg-[rgba(26,32,44,0.62)] p-4 backdrop-blur-[3px]"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.96, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.96, y: 10, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-[1.75rem] border border-[#EEE9E0] bg-[#FBF8F2] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-[#718096] transition-colors hover:bg-white hover:text-[#2D3748]"
            >
              <X size={17} strokeWidth={2} />
            </button>

            <div className="relative min-h-[220px] overflow-hidden bg-[#EFE4D4] px-8 pt-10">
              <div
                aria-hidden
                className="absolute inset-0 opacity-[0.22]"
                style={{
                  background:
                    'radial-gradient(circle at 50% 12%, #FFFFFF 0%, transparent 35%), linear-gradient(135deg, #F7EFE5 0%, #DFCDB0 100%)',
                }}
              />
              <motion.div
                aria-hidden
                initial={{ rotateX: 0, y: 0 }}
                animate={{ rotateX: -64, y: -18 }}
                transition={{ duration: 0.7, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
                className="absolute left-1/2 top-12 h-16 w-64 origin-bottom -translate-x-1/2 rounded-t-2xl border border-[#CDBB9B] bg-[#E5D3B6] shadow-md"
              />
              <motion.div
                aria-hidden
                initial={{ y: 28, opacity: 0, scale: 0.94 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, delay: 0.34, ease: [0.22, 1, 0.36, 1] }}
                className="relative mx-auto mt-20 h-20 w-64 rounded-2xl border border-[#CDBB9B] bg-white shadow-xl"
              >
                <div className="absolute left-1/2 top-1/2 h-10 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-[#3D5A73]/25" />
                <div className="absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D4A8A0] shadow-[34px_0_0_#7CADA6,-34px_0_0_#F5EDE0,68px_0_0_#3D5A73,-68px_0_0_#B8823C]" />
              </motion.div>
            </div>

            <div className="p-6">
              <div className="mb-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <PackageCheck size={14} strokeWidth={2.2} />
                {t('unboxing.eyebrow')}
              </div>
              <h3 className="font-serif text-[26px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                {title}
              </h3>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#EEE9E0] bg-white p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    {t('unboxing.length')}
                  </p>
                  <p className="mt-1 font-serif text-[18px] font-black text-[#2D3748]">
                    {formatCmFromMm(lengthMm, lang)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#EEE9E0] bg-white p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    {t('unboxing.price')}
                  </p>
                  <p className="mt-1 font-serif text-[18px] font-black text-[#2D3748]">
                    {formatPrice(price)}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-11 rounded-lg border border-[#EEE9E0] bg-white text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73]"
                >
                  {t('unboxing.close')}
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                >
                  <Share2 size={13} strokeWidth={2.2} />
                  {t('unboxing.share')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SelectedComponentInfo({ slotId }: { slotId: string }) {
  const components = useConfigurator((s) => s.components);
  const figurine = useConfigurator((s) => s.figurine);
  const { lang } = useT();
  const comp =
    figurine && figurine.slotId === slotId ? figurine : components.find((c) => c.slotId === slotId);
  if (!comp) return null;
  if (comp.kind === 'bead') {
    const bead = resolveBead(comp.refId);
    if (!bead) return null;
    return (
      <>
        <StoneSwatch
          hex={bead.hex}
          veinHex={bead.veinHex}
          size={32}
          image={bead.images[0]}
          zoom={beadPhotoZoom(bead.shape)}
        />
        <div>
          <p className="text-[12px] font-black text-[#2D3748] uppercase tracking-tight">
            {bead.name}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4] tabular-nums">
            {formatBeadSize(bead.sizeMm, lang)}
          </p>
        </div>
      </>
    );
  }
  const charm = resolveCharm(comp.refId);
  if (!charm) return null;
  return (
    <>
      <CharmGlyph
        category={charm.category}
        material={charm.material}
        size={32}
        image={charm.images[0]}
      />
      <div>
        <p className="text-[12px] font-black text-[#2D3748] uppercase tracking-tight">
          {charm.name}
        </p>
      </div>
    </>
  );
}
