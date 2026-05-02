'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  Heart,
  MessageCircle,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Save,
  Share2,
  ShoppingBag,
  Sparkles,
  Trash2,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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
import { useCart } from '@/lib/store/cart';
import { ATELIER_BY_ID, ATELIERS } from '@/lib/mocks/ateliers';
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
import { formatCmFromMm, formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { atelierSound, haptic, successMoment } from '@/lib/utils/feedback';
import { encodeBraceletDesign } from '@/lib/utils/share-design';
import { moodLabel, type Mood } from '@/lib/harmony/rules';
import type { FulfillmentMode } from '@/types';

const TABS = [
  { id: 'beads' as const, label: 'Perles' },
  { id: 'charms' as const, label: 'Charms' },
];

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

type RemixFilter = 'all' | 'trending' | 'minimal' | 'kawaii';

const WORLD_REMIXES: Array<{
  id: string;
  title: string;
  mood: Mood;
  filter: Exclude<RemixFilter, 'all'>;
  intention: string;
  creator: string;
  city: string;
  story: string;
  remixes: number;
  likes: number;
  colors: string[];
}> = [
  {
    id: 'riviera',
    title: 'Riviera 17',
    mood: 'jardin',
    filter: 'trending',
    intention: 'Un été bleu-vert, façonné à Paris.',
    creator: 'Atelier Louvre',
    city: 'Paris',
    story: 'Bleus doux, nacre et vert tendre pour une vibe vacances propres.',
    remixes: 428,
    likes: 1900,
    colors: ['#7CADA6', '#F5EDE0', '#9BC4A8'],
  },
  {
    id: 'soft-power',
    title: 'Soft Power',
    mood: 'romantique',
    filter: 'kawaii',
    intention: 'Une douceur assumée, à porter en accumulation.',
    creator: 'Camille',
    city: 'Tokyo',
    story: 'Pastel, douceur, perles lumineuses : le remix très partageable.',
    remixes: 611,
    likes: 2800,
    colors: ['#D4A8A0', '#F5EDE0', '#8B6F9B'],
  },
  {
    id: 'quiet-pearl',
    title: 'Quiet Pearl',
    mood: 'minimaliste',
    filter: 'minimal',
    intention: 'Une signature simple, lumineuse, jamais trop visible.',
    creator: 'Mina',
    city: 'Seoul',
    story: 'Peu de bruit, beaucoup de présence : la version quiet luxury.',
    remixes: 189,
    likes: 770,
    colors: ['#F5EDE0', '#DCD4CC', '#1A1A1A'],
  },
  {
    id: 'mystic-note',
    title: 'Mystic Note',
    mood: 'mystique',
    filter: 'trending',
    intention: 'Une intention douce, protectrice et presque talisman.',
    creator: 'Léna',
    city: 'Los Angeles',
    story: 'Améthyste, reflets sombres et énergie talisman.',
    remixes: 352,
    likes: 1450,
    colors: ['#8B6F9B', '#1E1A1A', '#88B5A8'],
  },
];

const REMIX_FILTERS: Array<{ id: RemixFilter; label: string }> = [
  { id: 'all', label: 'Tous' },
  { id: 'trending', label: 'Tendance' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'kawaii', label: 'Kawaii' },
];

const FULFILLMENT_OPTIONS: Array<{
  id: FulfillmentMode;
  label: string;
  detail: string;
}> = [
  {
    id: 'assembled-paris',
    label: 'Assemblé à Paris · recommandé',
    detail: 'Assemblé à la main par notre atelier parisien.',
  },
  {
    id: 'diy-kit',
    label: 'Kit DIY',
    detail: 'Les pièces préparées, à monter chez vous.',
  },
];

export function Configurator() {
  const {
    step,
    setStep,
    setAtelier,
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
    save,
    applyInspired,
  } = useConfigurator();
  const addCustom = useCart((s) => s.addCustom);
  const savedDesigns = useConfigurator((s) => s.savedDesigns);
  const draftTitle = useConfigurator((s) => s.draftTitle);
  const draftIntention = useConfigurator((s) => s.draftIntention);
  const price = useConfiguratorPrice();
  const atelier = ATELIER_BY_ID[atelierId];

  const [justAddedCart, setJustAddedCart] = useState(false);
  const [creationTitle, setCreationTitle] = useState('');
  const [intention, setIntention] = useState('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [studioStatus, setStudioStatus] = useState<string | null>(null);
  const [remixFilter, setRemixFilter] = useState<RemixFilter>('all');
  const [sharePanelOpen, setSharePanelOpen] = useState(false);
  const [inspirationOpen, setInspirationOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] =
    useState<FulfillmentMode>('assembled-paris');
  const [portalReady, setPortalReady] = useState(false);
  const [unboxingOpen, setUnboxingOpen] = useState(false);
  const [customStepperOpen, setCustomStepperOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const addToCartRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const mobilePaletteRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
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

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (draftTitle) setCreationTitle(draftTitle);
    if (draftIntention) setIntention(draftIntention);
  }, [draftTitle, draftIntention]);

  // Palette drag state — owned at this level so we can dispatch to bracelet
  const [paletteDrag, setPaletteDrag] = useState<PaletteDrag | null>(null);
  // Mirror in a ref so handlers read the freshest value without re-binding
  const paletteDragRef = useRef<PaletteDrag | null>(null);
  useEffect(() => {
    paletteDragRef.current = paletteDrag;
  }, [paletteDrag]);

  // Active tab : if user is on 'atelier' (shouldn't happen here), default to 'beads'.
  // Also force 'beads' when the atelier doesn't allow charms (Bracelet Bar).
  const tab = step === 'charms' && atelier?.allowCharms ? 'charms' : 'beads';

  const beadsCount = countBeads(components);
  const charmsCount = countCharms(components);
  const totalPieces = components.length + (figurine ? 1 : 0);
  const targetMm = targetMmOf(atelierId, sizeCm);
  const lengthMm = totalLengthMm(components);
  const fit = getSizeFit(atelierId, sizeCm, components);
  const canOrder = fit.status === 'ready';
  const creationName = creationTitle.trim() || 'Ma création';
  const orderStatusMessage =
    fit.status === 'empty'
      ? 'Ajoutez vos premières perles pour composer le bracelet'
      : fit.status === 'ready'
        ? `Votre bracelet est prêt · ${formatCmFromMm(lengthMm)}`
        : fit.status === 'too-long'
          ? `Retirez une pièce pour retrouver l’équilibre`
          : `Encore ${formatCmFromMm(fit.remainingMm)} pour finaliser`;
  const isKawaiiAtelier = atelier?.id === 'atelier_kawaii';
  const creationSteps = [
    {
      label: 'Base',
      done: components.length > 0,
      active: components.length === 0,
    },
    {
      label: 'Perles',
      done: components.length > 0,
      active: components.length > 0 && fit.status !== 'ready',
    },
    {
      label: isKawaiiAtelier ? 'Figurine' : 'Détails',
      done: isKawaiiAtelier ? Boolean(figurine) : charmsCount > 0,
      active: isKawaiiAtelier ? components.length > 0 && !figurine : false,
    },
    {
      label: 'Finaliser',
      done: canOrder,
      active: canOrder,
    },
  ];
  const filteredRemixes = useMemo(
    () =>
      remixFilter === 'all'
        ? WORLD_REMIXES
        : WORLD_REMIXES.filter((remix) => remix.filter === remixFilter),
    [remixFilter],
  );
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

  function getCurrentShareDesign(): SharedBraceletDesign {
    return {
      atelierId,
      sizeCm,
      sizeLabel,
      components,
      figurine,
      title: creationName,
      intention: getPackagedIntention(),
    };
  }

  function getPackagedIntention(): string | undefined {
    return intention.trim() || undefined;
  }

  function getShareUrl(): string | null {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    url.searchParams.set('design', encodeBraceletDesign(getCurrentShareDesign()));
    return url.toString();
  }

  function announceStudio(message: string) {
    setStudioStatus(message);
    setTimeout(() => setStudioStatus(null), 2600);
  }

  function revealMobilePalette() {
    if (typeof window === 'undefined') return;
    requestAnimationFrame(() => {
      mobilePaletteRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  function handleWorldRemix(remix: (typeof WORLD_REMIXES)[number]) {
    applyInspired(remix.mood);
    setCreationTitle(`Remix · ${remix.title}`);
    setIntention(remix.intention);
    setStep('beads');
    atelierSound('stone');
    haptic([8, 18, 8]);
    announceStudio(`${remix.title} remixé`);
  }

  function handleSaveDesign() {
    if (components.length === 0) return;
    haptic(8);
    atelierSound('soft');
    const design = save(creationName, getPackagedIntention());
    setSaveStatus(`Enregistré · ${design.title ?? 'Ma création'}`);
    setTimeout(() => setSaveStatus(null), 2400);
  }

  async function handleShareDesign() {
    if (components.length === 0 || typeof window === 'undefined') return;
    const url = getShareUrl();
    if (!url) return;
    const shareText = `Regarde mon bracelet "${creationName}" créé chez My Nice Bracelet.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: creationName,
          text: shareText,
          url,
        });
        setShareStatus('Partage ouvert');
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url}`);
        setShareStatus('Lien copié');
      }
      haptic([6, 18, 6]);
    } catch {
      setShareStatus('Partage annulé');
    }
    setTimeout(() => setShareStatus(null), 2400);
  }

  async function handleCopyShareLink() {
    if (components.length === 0 || typeof window === 'undefined') return;
    const url = getShareUrl();
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setShareStatus('Lien copié');
      haptic([6, 18, 6]);
    } catch {
      setShareStatus('Copie impossible');
    }
    setTimeout(() => setShareStatus(null), 2400);
  }

  function handleAddToCart() {
    if (!canOrder) return;
    const design = snapshotConfig(
      useConfigurator.getState(),
      creationName,
      getPackagedIntention(),
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
    setFinalizeOpen(false);
    setUnboxingOpen(true);
    setTimeout(() => setJustAddedCart(false), 2000);
  }

  function renderPaletteContent() {
    return (
      <>
        <div className="top-0 z-10 bg-white px-5 pb-4 pt-5 md:px-7 md:pt-7 lg:sticky border-b border-[#EEE9E0]">
          <div className="mb-4">
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
              Univers
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
                      setTimelineOpen(false);
                    }}
                    className={cn(
                      'shrink-0 rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-widest transition-colors',
                      active
                        ? 'border-[#2D3748] bg-[#2D3748] text-white'
                        : 'border-[#EEE9E0] bg-[#F8F4ED] text-[#718096] hover:border-[#3D5A73] hover:text-[#2D3748]',
                    )}
                  >
                    {item.id === 'atelier_bracelet_bar'
                      ? 'Essentiel'
                      : item.id === 'atelier_kawaii'
                        ? 'Kawaii'
                        : 'Classique'}
                  </button>
                );
              })}
            </div>
          </div>
          <div
            className={cn(
              'grid gap-2',
              atelier?.allowCharms ? 'grid-cols-2' : 'grid-cols-1',
            )}
          >
            {TABS.filter((t) => t.id !== 'charms' || atelier?.allowCharms).map((t) => {
              const active = tab === t.id;
              const label =
                t.id === 'charms' && atelier?.id === 'atelier_kawaii' ? 'Figurines' : t.label;
              const badge =
                t.id === 'beads'
                  ? `${(lengthMm / 10).toFixed(1).replace('.', ',')}/${(targetMm / 10).toFixed(0)} cm`
                  : `${charmsCount}/${atelier?.maxCharms ?? 0}`;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    haptic(6);
                    setStep(t.id);
                  }}
                  className={cn(
                    'flex items-center justify-between gap-2 rounded-xl border p-3 transition-all',
                    active
                      ? 'bg-[#2D3748] border-[#2D3748] text-white shadow-md'
                      : 'bg-white border-[#EEE9E0] text-[#718096] hover:border-[#A8BED4]',
                  )}
                >
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">
                    {label}
                  </span>
                  <span
                    className={cn(
                      'inline-flex h-6 items-center justify-center rounded-full px-2.5 text-[9px] font-black tabular-nums whitespace-nowrap',
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

        <div className="px-5 py-5 md:px-7 md:py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            >
              {tab === 'beads' && (
                <BeadPicker onTilePointerDown={(refId, e) => startPaletteDrag('bead', refId, e)} />
              )}
              {tab === 'charms' && (
                <CharmPicker
                  onTilePointerDown={(refId, e) => startPaletteDrag('charm', refId, e)}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </>
    );
  }

  function renderInspirationGallery() {
    return (
      <div className="rounded-2xl border border-[#EEE9E0] bg-white p-4 shadow-sm md:p-5">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
              <Sparkles size={14} strokeWidth={2.1} />
              Galerie inspiration
            </div>
            <p className="mt-1 text-[12px] font-semibold italic text-[#718096]">
              Choisissez une base déjà harmonieuse, puis changez ce qui vous ressemble.
            </p>
          </div>
          <div className="flex gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {REMIX_FILTERS.map((filter) => (
              <button
                key={filter.id}
                type="button"
                onClick={() => {
                  haptic(4);
                  setRemixFilter(filter.id);
                }}
                className={cn(
                  'shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest transition-colors',
                  remixFilter === filter.id
                    ? 'bg-[#2D3748] text-white'
                    : 'border border-[#EEE9E0] bg-white text-[#718096] hover:border-[#3D5A73] hover:text-[#2D3748]',
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {filteredRemixes.map((remix) => (
            <article
              key={remix.id}
              className="overflow-hidden rounded-xl border border-[#EEE9E0] bg-[#FBF8F2] text-left transition-all hover:-translate-y-0.5 hover:border-[#3D5A73] hover:bg-white hover:shadow-md"
            >
              <div
                className="relative h-20 overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${remix.colors.join(', ')})`,
                }}
              >
                <div className="absolute inset-x-6 top-1/2 h-9 -translate-y-1/2 rounded-full border-[4px] border-white/75 shadow-[0_14px_32px_rgba(45,55,72,0.2)]" />
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-1">
                  {remix.colors.concat(remix.colors).slice(0, 7).map((hex, index) => (
                    <span
                      key={`${remix.id}-preview-${hex}-${index}`}
                      className="h-5 w-5 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: hex }}
                    />
                  ))}
                </div>
              </div>
              <div className="p-3.5">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-serif text-[16px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                    {remix.title}
                  </p>
                  <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm">
                    {moodLabel(remix.mood)}
                  </span>
                </div>
                <p className="line-clamp-2 min-h-[32px] text-[12px] font-semibold italic leading-relaxed text-[#718096]">
                  {remix.story}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    handleWorldRemix(remix);
                    setInspirationOpen(false);
                  }}
                  className="mt-3 inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-[#2D3748] px-3 text-[9px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                >
                  <Wand2 size={11} strokeWidth={2.2} />
                  Personnaliser ce modèle
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  function renderFinalDetails({ inSheet = false }: { inSheet?: boolean } = {}) {
    return (
      <div
        className={cn(
          'grid gap-4 border border-[#EEE9E0] bg-[#F5F0E8] p-4 md:p-5',
          inSheet ? 'rounded-2xl' : 'rounded-[1.5rem]',
        )}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
              Finaliser
            </p>
            <p className="font-serif text-[16px] font-black uppercase tracking-tight text-[#2D3748]">
              {orderStatusMessage}
            </p>
          </div>
          <p className="shrink-0 font-serif text-[26px] font-black tracking-tighter text-[#2D3748] tabular-nums">
            {formatPrice(price)}
          </p>
        </div>

        {atelier?.id !== 'atelier_kawaii' && (
          <div>
            <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
              Taille
            </p>
            <div className="grid grid-cols-4 gap-1.5">
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
                      'rounded-lg border px-2 py-2 text-center transition-colors',
                      active
                        ? 'border-[#3D5A73] bg-[#3D5A73] text-white'
                        : 'border-[#EEE9E0] bg-white text-[#718096] hover:border-[#3D5A73] hover:text-[#2D3748]',
                    )}
                  >
                    <span className="block font-serif text-[14px] font-black uppercase leading-none">
                      {sz.label}
                    </span>
                    <span className="mt-1 block text-[8px] font-black uppercase tracking-widest tabular-nums opacity-75">
                      {sz.cm} cm
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
                  'rounded-lg border px-2 py-2 text-center transition-colors',
                  sizeLabel === 'custom'
                    ? 'border-[#3D5A73] bg-[#3D5A73] text-white'
                    : 'border-[#EEE9E0] bg-white text-[#718096] hover:border-[#3D5A73] hover:text-[#2D3748]',
                )}
              >
                <span className="block text-[10px] font-black uppercase tracking-tight">
                  Perso.
                </span>
                <span className="mt-1 block text-[8px] font-black uppercase tracking-widest tabular-nums opacity-75">
                  {sizeCm.toString().replace('.', ',')} cm
                </span>
              </button>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
            Assemblage
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {FULFILLMENT_OPTIONS.map((option) => {
              const active = fulfillmentMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    haptic(4);
                    setFulfillmentMode(option.id);
                  }}
                  className={cn(
                    'rounded-xl border p-3 text-left transition-colors',
                    active
                      ? 'border-[#3D5A73] bg-white text-[#2D3748] shadow-sm'
                      : 'border-[#EEE9E0] bg-white/65 text-[#718096] hover:border-[#A8BED4] hover:text-[#2D3748]',
                  )}
                >
                  <span className="block text-[10px] font-black uppercase tracking-widest">
                    {option.label}
                  </span>
                  <span className="mt-1 block text-[12px] font-semibold italic leading-relaxed">
                    {option.detail}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div ref={inSheet ? undefined : addToCartRef}>
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={!canOrder}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl bg-[#3D5A73] px-6 text-[11px] font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-[#2A3F50] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {justAddedCart ? (
              <>
                <Check size={16} strokeWidth={2.5} />
                Ajouté
              </>
            ) : (
              <>
                <ShoppingBag size={16} strokeWidth={2} />
                Ajouter au panier · {formatPrice(price)}
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const mobileActionBar = (
    <div
      className="fixed inset-x-3 z-[1800] grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-2xl border border-[#EEE9E0] bg-white/95 p-2.5 shadow-[0_18px_50px_rgba(45,55,72,0.22)] backdrop-blur-md lg:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}
    >
      <div className="min-w-0 px-1">
        <p className="truncate text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
          {canOrder ? 'Prêt à commander' : 'Création en cours'}
        </p>
        <p className="font-serif text-[22px] font-black leading-none tracking-tighter text-[#2D3748] tabular-nums">
          {formatPrice(price)}
        </p>
      </div>
      <button
        type="button"
        onClick={handleCopyShareLink}
        disabled={components.length === 0}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl border border-[#EEE9E0] bg-white px-3 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Copy size={13} strokeWidth={2.2} />
        Lien
      </button>
      <button
        type="button"
        onClick={() => {
          haptic(6);
          if (canOrder) setFinalizeOpen(true);
          else revealMobilePalette();
        }}
        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#2D3748] px-4 text-[9px] font-black uppercase tracking-widest text-white"
      >
        {canOrder ? <ShoppingBag size={13} strokeWidth={2.2} /> : <Plus size={13} strokeWidth={2.2} />}
        {canOrder ? 'Panier' : 'Ajouter'}
      </button>
    </div>
  );

  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-28 lg:pb-10">
        <div className="mb-4 hidden flex-wrap items-center justify-between gap-3 lg:flex">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
              My Nice Bracelet
            </p>
            <h1 className="font-serif text-[26px] font-black uppercase leading-none tracking-tight text-[#2D3748] md:text-[34px]">
              Le Studio
            </h1>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEE9E0] bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm">
              <PackageCheck size={12} strokeWidth={2.2} />
              Assemblé à Paris par nos soins
            </span>
            <span className="inline-flex rounded-full bg-[#2D3748] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
              {formatPrice(price)}
            </span>
          </div>
        </div>

        <section className="mb-4 hidden rounded-2xl border border-[#EEE9E0] bg-white p-3 shadow-sm md:p-4 lg:block">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="grid grid-cols-4 gap-1.5">
              {creationSteps.map((item, index) => (
                <div
                  key={item.label}
                  className={cn(
                    'rounded-lg border px-2 py-2 text-center transition-colors',
                    item.active
                      ? 'border-[#3D5A73] bg-[#F4F8FB] text-[#2D3748]'
                      : item.done
                        ? 'border-[#BFD9C7] bg-[#EDF7F0] text-[#244A35]'
                        : 'border-[#EEE9E0] bg-[#FBF8F2] text-[#A8BED4]',
                  )}
                >
                  <span className="block text-[8px] font-black uppercase tracking-widest">
                    {index + 1}
                  </span>
                  <span className="mt-0.5 block truncate text-[9px] font-black uppercase tracking-widest">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 lg:justify-end">
              <button
                type="button"
                onClick={() => {
                  haptic(4);
                  setInspirationOpen(true);
                }}
                className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-[#EEE9E0] bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73] sm:flex-none"
              >
                <Sparkles size={13} strokeWidth={2.2} />
                Inspirations
              </button>
              {studioStatus && (
                <span className="hidden min-w-0 truncate rounded-full bg-[#EDF7F0] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#244A35] md:inline-flex">
                  {studioStatus}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* ─── MAIN CARD : warm canvas containing the bracelet AND a floating palette ─── */}
        <div
          className={cn(
            'overflow-hidden rounded-[1.5rem] border border-[#EEE9E0] shadow-md lg:relative lg:top-auto lg:z-auto lg:rounded-[3rem]',
            timelineOpen ? 'relative z-0' : 'sticky top-20 z-20 md:top-24',
          )}
        >
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

          <div className="relative grid gap-3 p-3 md:gap-6 md:p-6 lg:grid-cols-[1fr_400px]">
            {/* LEFT — bracelet directly on the warm canvas (no inner card).
                Vertically centered. Canvas height kept tight so the action
                buttons stay close to the bracelet. Heavy zoom uses pan to
                navigate beyond the visible bounds. */}
            <div
              className={cn(
                'relative flex h-[44dvh] min-h-[320px] max-h-[430px] items-center justify-center px-3 pb-2 md:h-[50dvh] md:min-h-[460px] md:px-4 md:pb-3 lg:h-auto lg:max-h-none lg:min-h-[560px]',
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
                            {sz.cm}cm
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
                        Perso.
                      </span>
                      <span
                        className={cn(
                          'text-[8px] font-black uppercase tracking-widest tabular-nums mt-0.5',
                          sizeLabel === 'custom' ? 'opacity-80' : 'opacity-60',
                        )}
                      >
                        {sizeLabel === 'custom'
                          ? `${sizeCm.toString().replace('.', ',')}cm`
                          : '±0,5'}
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
                        aria-label="Réduire la taille de 0,5 cm"
                      >
                        <Minus size={14} strokeWidth={2.4} />
                      </button>
                      <span className="font-serif font-black text-[16px] tabular-nums text-[#2D3748] min-w-[64px] text-center">
                        {sizeCm.toString().replace('.', ',')} cm
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          haptic(4);
                          adjustSize(0.5);
                        }}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-[#F5F0E8] hover:bg-[#EEE9E0] text-[#3D5A73] transition-colors"
                        aria-label="Augmenter la taille de 0,5 cm"
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
                        Valider
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
                  emptyText="Touchez une perle pour commencer"
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
                      aria-label="Retirer"
                    >
                      <Trash2 size={14} strokeWidth={1.8} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Zoom controls — floating bottom-right of bracelet stage */}
              <div className="absolute bottom-2 right-2 z-10 hidden items-center gap-1 rounded-full border border-[#EEE9E0] bg-white/85 p-1 shadow-sm backdrop-blur-md md:bottom-3 md:right-3 lg:inline-flex">
                <button
                  type="button"
                  onClick={() => {
                    haptic(4);
                    zoomOut();
                  }}
                  disabled={zoom <= ZOOM_MIN + 0.001}
                  aria-label="Dézoomer"
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
                  aria-label="Zoom 100 %"
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
                  aria-label="Zoomer"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full text-[#3D5A73] hover:bg-[#F5F0E8] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ZoomIn size={14} strokeWidth={2.2} />
                </button>
              </div>

              {/* Inspire-moi + Recommencer floating bottom of bracelet stage */}
              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 z-10 flex flex-wrap items-center gap-2">
                <InspireButton />
                {totalPieces === 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic(4);
                      setInspirationOpen(true);
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-full border border-[#EEE9E0] bg-white/85 px-4 text-[10px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm transition-colors hover:border-[#3D5A73] lg:hidden"
                  >
                    <Sparkles size={13} strokeWidth={2.2} />
                    Inspirations
                  </button>
                )}
                {totalPieces > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      haptic(4);
                      const nextTimelineOpen = !timelineOpen;
                      setTimelineOpen(nextTimelineOpen);
                      if (nextTimelineOpen) {
                        requestAnimationFrame(() => {
                          timelineRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'start',
                          });
                        });
                      }
                    }}
                    className={cn(
                      'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-[10px] font-black uppercase tracking-widest shadow-sm transition-colors',
                      timelineOpen
                        ? 'border-[#3D5A73] bg-[#3D5A73] text-white'
                        : 'border-[#EEE9E0] bg-white/85 text-[#3D5A73] hover:border-[#3D5A73]',
                    )}
                  >
                    Réorganiser
                  </button>
                )}
                {totalPieces > 0 && (
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
                    Recommencer
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    haptic(6);
                    revealMobilePalette();
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-full bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#3D5A73] lg:hidden"
                >
                  <Plus size={13} strokeWidth={2.2} />
                  Perles
                </button>
              </div>
            </div>

            {/* RIGHT — white palette card floating on the warm canvas */}
            <div className="relative hidden overflow-hidden rounded-[2rem] border border-[#EEE9E0] bg-white shadow-md lg:flex lg:max-h-[600px] lg:flex-col">
              <div className="overflow-y-auto scrollbar-thin">{renderPaletteContent()}</div>
            </div>
          </div>
        </div>

        {timelineOpen && totalPieces > 0 && (
          <div ref={timelineRef} className="scroll-mt-24">
            <CompositionTray
              components={components}
              figurine={figurine}
              selectedSlotId={selectedComponent}
              onSelect={select}
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

        <div
          id="mobile-palette"
          ref={mobilePaletteRef}
          className="mt-3 scroll-mt-[calc(44dvh+5.5rem)] overflow-hidden rounded-2xl border border-[#EEE9E0] bg-white shadow-sm lg:hidden"
        >
          {renderPaletteContent()}
        </div>

        <div className="mt-5">
          <div className="bg-white border border-[#EEE9E0] rounded-xl p-4 md:p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <Heart size={14} strokeWidth={2} />
                Signature
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                {savedDesigns.length}/24
              </span>
            </div>
            <div className="grid sm:grid-cols-[1fr_auto_auto] gap-2">
              <label className="sr-only" htmlFor="creation-title">
                Nom du bracelet
              </label>
              <input
                id="creation-title"
                ref={titleInputRef}
                value={creationTitle}
                onChange={(e) => setCreationTitle(e.target.value)}
                placeholder="Nom du bracelet"
                maxLength={48}
                className="h-11 rounded-lg border border-[#EEE9E0] bg-[#F5F0E8] px-3 text-[13px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73] focus:bg-white"
              />
              <button
                type="button"
                onClick={handleSaveDesign}
                disabled={components.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#EEE9E0] bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[#3D5A73] transition-colors hover:border-[#3D5A73] hover:text-[#2D3748] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Save size={13} strokeWidth={2.2} />
                Enregistrer
              </button>
              <button
                type="button"
                onClick={() => setSharePanelOpen(true)}
                disabled={components.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {shareStatus === 'Lien copié' ? (
                  <Copy size={13} strokeWidth={2.2} />
                ) : (
                  <Share2 size={13} strokeWidth={2.2} />
                )}
                Partager mon bracelet
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-[auto_1fr] sm:items-center">
              <span className="hidden h-11 w-11 items-center justify-center rounded-lg bg-[#F5F0E8] text-[#3D5A73] sm:inline-flex">
                <MessageCircle size={15} strokeWidth={2.1} />
              </span>
              <label className="sr-only" htmlFor="creation-intention">
                Message pour le colis
              </label>
              <input
                id="creation-intention"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="Message à glisser dans le colis"
                maxLength={96}
                className="h-11 rounded-lg border border-[#EEE9E0] bg-white px-3 text-[13px] font-semibold text-[#2D3748] outline-none transition-colors placeholder:text-[#A8BED4] focus:border-[#3D5A73]"
              />
            </div>
            {(saveStatus || shareStatus) && (
              <p className="mt-2 text-[11px] font-semibold text-[#718096]">
                {saveStatus ?? shareStatus}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 hidden md:mt-8 lg:block">{renderFinalDetails()}</div>
      </div>

      {portalReady ? createPortal(mobileActionBar, document.body) : null}

      {/* Floating ghost following the cursor while dragging from palette */}
      {paletteDrag?.active && (
        <DragGhost
          kind={paletteDrag.kind}
          refId={paletteDrag.refId}
          x={paletteDrag.x}
          y={paletteDrag.y}
        />
      )}

      <AnimatePresence>
        {sharePanelOpen && (
          <motion.div
            key="share-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[2050] flex items-center justify-center bg-[rgba(26,32,44,0.48)] p-3 backdrop-blur-sm"
            onClick={() => setSharePanelOpen(false)}
          >
            <motion.div
              initial={{ y: 24, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 16, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#EEE9E0] bg-[#FBF8F2] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Partager la création"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#EEE9E0] bg-white px-5 py-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    Partage
                  </p>
                  <h3 className="font-serif text-[22px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                    {creationName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSharePanelOpen(false)}
                  aria-label="Fermer le partage"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0E8] text-[#3D5A73] transition-colors hover:bg-[#EEE9E0]"
                >
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>
              <div className="p-3 md:p-4">
                <SharePreview
                  components={components}
                  figurine={figurine}
                  title={creationName}
                  intention={getPackagedIntention()}
                  lengthMm={lengthMm}
                  targetMm={targetMm}
                  price={price}
                  onCopyLink={handleCopyShareLink}
                  copyStatus={shareStatus}
                />
                <button
                  type="button"
                  onClick={() => {
                    void handleShareDesign();
                  }}
                  disabled={components.length === 0}
                  className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Share2 size={13} strokeWidth={2.2} />
                  Partager ma création
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {inspirationOpen && (
          <motion.div
            key="inspiration-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[2050] bg-[rgba(26,32,44,0.48)] p-3 backdrop-blur-sm"
            onClick={() => setInspirationOpen(false)}
          >
            <motion.div
              initial={{ y: 34, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto flex max-h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#EEE9E0] bg-[#FBF8F2] shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Galerie inspiration"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 border-b border-[#EEE9E0] bg-white px-5 py-4">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    Inspirations
                  </p>
                  <h3 className="font-serif text-[22px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                    Partir d&rsquo;une base
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setInspirationOpen(false)}
                  aria-label="Fermer la galerie"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0E8] text-[#3D5A73] transition-colors hover:bg-[#EEE9E0]"
                >
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>
              <div className="overflow-y-auto p-3 md:p-4">{renderInspirationGallery()}</div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {finalizeOpen && (
          <motion.div
            key="finalize-panel"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.16 }}
            className="fixed inset-0 z-[2050] bg-[rgba(26,32,44,0.48)] p-3 backdrop-blur-sm lg:hidden"
            onClick={() => setFinalizeOpen(false)}
          >
            <motion.div
              initial={{ y: 42, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-x-3 bottom-3 max-h-[88vh] overflow-y-auto rounded-2xl border border-[#EEE9E0] bg-white p-3 shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-label="Finaliser la création"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    Terminer ma création
                  </p>
                  <h3 className="font-serif text-[22px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                    {creationName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setFinalizeOpen(false)}
                  aria-label="Fermer la finalisation"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F5F0E8] text-[#3D5A73] transition-colors hover:bg-[#EEE9E0]"
                >
                  <X size={17} strokeWidth={2.2} />
                </button>
              </div>
              {renderFinalDetails({ inSheet: true })}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <UnboxingModal
        open={unboxingOpen}
        title={creationName}
        intention={getPackagedIntention() ?? ''}
        price={price}
        lengthMm={lengthMm}
        onClose={() => setUnboxingOpen(false)}
        onShare={() => {
          void handleShareDesign();
        }}
      />
    </div>
  );
}

function UnboxingModal({
  open,
  title,
  intention,
  price,
  lengthMm,
  onClose,
  onShare,
}: {
  open: boolean;
  title: string;
  intention: string;
  price: number;
  lengthMm: number;
  onClose: () => void;
  onShare: () => void;
}) {
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
                Préparation atelier
              </div>
              <h3 className="font-serif text-[26px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                {title}
              </h3>
              {intention && (
                <p className="mt-2 text-[13px] font-semibold italic leading-relaxed text-[#718096]">
                  {intention}
                </p>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-[#EEE9E0] bg-white p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    Longueur
                  </p>
                  <p className="mt-1 font-serif text-[18px] font-black text-[#2D3748]">
                    {formatCmFromMm(lengthMm)}
                  </p>
                </div>
                <div className="rounded-xl border border-[#EEE9E0] bg-white p-3">
                  <p className="text-[9px] font-black uppercase tracking-widest text-[#A8BED4]">
                    Prix
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
                  Fermer
                </button>
                <button
                  type="button"
                  onClick={onShare}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73]"
                >
                  <Share2 size={13} strokeWidth={2.2} />
                  Partager
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
            {bead.sizeMm.toString().replace('.', ',')}mm
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
