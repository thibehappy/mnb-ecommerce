'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Check,
  Copy,
  Gift,
  Globe2,
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
  Users,
  Wand2,
  X,
  ZoomIn,
  ZoomOut,
  type LucideIcon,
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
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { BEAD_BY_ID, BEADS } from '@/lib/mocks/beads';
import { BraceletPreview, type BraceletPreviewHandle } from './BraceletPreview';
import { BeadPicker } from './BeadPicker';
import { CharmPicker } from './CharmPicker';
import { InspireButton } from './InspireButton';
import { DragGhost } from './DragGhost';
import { SharePreview } from './SharePreview';
import { CreationCoach } from './CreationCoach';
import { DuoSplitPreview } from './DuoSplitPreview';
import { CompositionTray } from './CompositionTray';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import { beadPhotoZoom } from '@/lib/utils/bead-display';
import { formatCmFromMm, formatPrice, uid } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { atelierSound, haptic, successMoment } from '@/lib/utils/feedback';
import { encodeBraceletDesign } from '@/lib/utils/share-design';
import { analyzeBraceletDesign, type CoachAction } from '@/lib/harmony/coach';
import { moodLabel, type Mood } from '@/lib/harmony/rules';

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

type StudioAudience = 'self' | 'gift' | 'friends' | 'couple';
type StudioIntent = 'memory' | 'energy' | 'minimal' | 'viral';
type RemixFilter = 'all' | 'trending' | 'gift' | 'duo' | 'minimal' | 'kawaii';

const STUDIO_AUDIENCES: Array<{
  id: StudioAudience;
  label: string;
  icon: LucideIcon;
}> = [
  { id: 'self', label: 'Moi', icon: Heart },
  { id: 'gift', label: 'Cadeau', icon: Gift },
  { id: 'friends', label: 'Amies', icon: Users },
  { id: 'couple', label: 'Duo', icon: Heart },
];

const STUDIO_INTENTS: Array<{
  id: StudioIntent;
  label: string;
  mood: Mood;
  intention: string;
}> = [
  {
    id: 'memory',
    label: 'Souvenir',
    mood: 'jardin',
    intention: 'Un souvenir à porter tous les jours.',
  },
  {
    id: 'energy',
    label: 'Énergie',
    mood: 'mystique',
    intention: 'Une intention douce, protectrice et lumineuse.',
  },
  {
    id: 'minimal',
    label: 'Minimal',
    mood: 'minimaliste',
    intention: 'Une pièce discrète, nette et intemporelle.',
  },
  {
    id: 'viral',
    label: 'TikTok',
    mood: 'kawaii',
    intention: 'Une composition joyeuse, expressive et prête à partager.',
  },
];

const WORLD_REMIXES: Array<{
  id: string;
  title: string;
  mood: Mood;
  audience: StudioAudience;
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
    audience: 'self',
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
    id: 'midnight',
    title: 'Midnight Gift',
    mood: 'nuit',
    audience: 'gift',
    filter: 'gift',
    intention: 'Un cadeau calme, profond, presque secret.',
    creator: 'MNB Studio',
    city: 'New York',
    story: 'Contraste sombre, touches lunaires, parfait pour un cadeau élégant.',
    remixes: 316,
    likes: 1240,
    colors: ['#1A1A1A', '#3B5A7A', '#DCD4CC'],
  },
  {
    id: 'soft-power',
    title: 'Soft Power',
    mood: 'romantique',
    audience: 'friends',
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
    id: 'solar-club',
    title: 'Solar Club',
    mood: 'solaire',
    audience: 'couple',
    filter: 'duo',
    intention: 'Une capsule chaude et solaire, faite pour rayonner.',
    creator: 'Nina & Lou',
    city: 'Nice',
    story: 'Un bracelet à splitter en duo, très chaud, très été.',
    remixes: 274,
    likes: 980,
    colors: ['#B8823C', '#E89060', '#D4A855'],
  },
  {
    id: 'quiet-pearl',
    title: 'Quiet Pearl',
    mood: 'minimaliste',
    audience: 'self',
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
    audience: 'gift',
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
  { id: 'gift', label: 'Cadeau' },
  { id: 'duo', label: 'Duo' },
  { id: 'minimal', label: 'Minimal' },
  { id: 'kawaii', label: 'Kawaii' },
];

function moodForGuide(audience: StudioAudience, intent: StudioIntent): Mood {
  if (audience === 'gift' && intent === 'memory') return 'romantique';
  if (audience === 'friends' && intent === 'viral') return 'kawaii';
  if (audience === 'couple' && intent === 'minimal') return 'minimaliste';
  return STUDIO_INTENTS.find((item) => item.id === intent)?.mood ?? 'jardin';
}

function titleForGuide(audience: StudioAudience, intent: StudioIntent): string {
  const audienceLabel = STUDIO_AUDIENCES.find((item) => item.id === audience)?.label ?? 'Moi';
  const intentLabel = STUDIO_INTENTS.find((item) => item.id === intent)?.label ?? 'Souvenir';
  return `${intentLabel} ${audienceLabel}`;
}

function moodFromRgb(r: number, g: number, b: number): Mood {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const light = (max + min) / 2;
  const saturation = max === min ? 0 : (max - min) / (255 - Math.abs(max + min - 255));
  const warm = r * 1.08 + g * 0.55 - b * 0.72;
  const cool = b * 0.95 + g * 0.55 - r * 0.7;

  if (saturation < 0.16 && light < 110) return 'minimaliste';
  if (b > r + 28 && cool > 120) return light < 120 ? 'nuit' : 'jardin';
  if (r > 150 && b > 120 && Math.abs(r - b) < 70) return 'romantique';
  if (r > 130 && b > 120 && b > g + 15) return 'mystique';
  if (warm > 150) return 'solaire';
  if (g > r && g > b - 10) return 'jardin';
  return 'kawaii';
}

async function moodFromImageFile(file: File): Promise<Mood> {
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return 'jardin';
    canvas.width = 32;
    canvas.height = 32;
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let r = 0;
    let g = 0;
    let b = 0;
    let count = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3] ?? 0;
      if (alpha < 20) continue;
      r += pixels[i] ?? 0;
      g += pixels[i + 1] ?? 0;
      b += pixels[i + 2] ?? 0;
      count++;
    }
    if (count === 0) return 'jardin';
    return moodFromRgb(r / count, g / count, b / count);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function completionScore(
  bead: (typeof BEADS)[number],
  gapMm: number,
  preferredFamily?: string,
  previousRefId?: string,
): number {
  let score = Math.abs(gapMm - bead.sizeMm);
  if (preferredFamily && bead.family === preferredFamily) score -= 4;
  if (previousRefId === bead.id) score += 2;
  if (gapMm > 18 && bead.sizeMm >= 8) score -= 1.5;
  if (gapMm <= 10 && bead.sizeMm <= gapMm) score -= 1;
  return score;
}

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
    replaceComponents,
    reset,
    save,
    loadDesign,
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
  const [moodboardStatus, setMoodboardStatus] = useState<string | null>(null);
  const [studioAudience, setStudioAudience] = useState<StudioAudience>('self');
  const [studioIntent, setStudioIntent] = useState<StudioIntent>('memory');
  const [remixFilter, setRemixFilter] = useState<RemixFilter>('all');
  const [unboxingOpen, setUnboxingOpen] = useState(false);
  const [customStepperOpen, setCustomStepperOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const addToCartRef = useRef<HTMLDivElement>(null);
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
  const targetMm = targetMmOf(atelierId, sizeCm);
  const lengthMm = totalLengthMm(components);
  const fit = getSizeFit(atelierId, sizeCm, components);
  const canOrder = fit.status === 'ready';
  const creationName = creationTitle.trim() || 'Ma création';
  const fitTone = fit.status === 'ready' ? 'ready' : fit.status === 'too-long' ? 'danger' : 'quiet';
  const fitMessage =
    fit.status === 'empty'
      ? 'Ajoutez vos premières perles pour composer le bracelet'
      : fit.status === 'ready'
        ? `Ajustement parfait · ${formatCmFromMm(lengthMm)}`
        : fit.status === 'too-long'
          ? `Trop long de ${formatCmFromMm(fit.overflowMm)} · retirez une perle`
          : `Encore ${formatCmFromMm(fit.remainingMm)} pour une taille parfaite`;
  const filteredRemixes = useMemo(
    () =>
      remixFilter === 'all'
        ? WORLD_REMIXES
        : WORLD_REMIXES.filter((remix) => remix.filter === remixFilter),
    [remixFilter],
  );
  const coachInsight = analyzeBraceletDesign({
    components,
    figurine,
    fit,
    title: creationTitle,
    intention,
  });

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
      intention: intention.trim() || undefined,
    };
  }

  function announceStudio(message: string) {
    setStudioStatus(message);
    setTimeout(() => setStudioStatus(null), 2600);
  }

  function handleGuidedCreation() {
    const mood = moodForGuide(studioAudience, studioIntent);
    const intent = STUDIO_INTENTS.find((item) => item.id === studioIntent);
    applyInspired(mood);
    atelierSound('stone');
    haptic([8, 18, 8]);
    setCreationTitle((current) => current.trim() || titleForGuide(studioAudience, studioIntent));
    setIntention((current) => current.trim() || intent?.intention || '');
    setStep('beads');
    announceStudio(`Style ${moodLabel(mood)} généré`);
  }

  function handleWorldRemix(remix: (typeof WORLD_REMIXES)[number]) {
    applyInspired(remix.mood);
    setCreationTitle(`Remix · ${remix.title}`);
    setIntention(remix.intention);
    setStudioAudience(remix.audience);
    setStep('beads');
    atelierSound('stone');
    haptic([8, 18, 8]);
    announceStudio(`${remix.title} remixé`);
  }

  function handleSavedRemix(id: string, title?: string, savedIntention?: string) {
    loadDesign(id);
    setCreationTitle(`Remix · ${title || 'Création'}`);
    setIntention(savedIntention || intention);
    setStep('beads');
    haptic(8);
    announceStudio('Création reprise');
  }

  async function handleMoodboardUpload(file?: File) {
    if (!file) return;
    setMoodboardStatus('Analyse...');
    try {
      const mood = await moodFromImageFile(file);
      applyInspired(mood);
      setCreationTitle((current) => current.trim() || `Moodboard · ${moodLabel(mood)}`);
      setIntention((current) => current.trim() || `Palette inspirée de ${file.name}.`);
      setMoodboardStatus(`Palette ${moodLabel(mood)}`);
      setStep('beads');
      atelierSound('stone');
      haptic([8, 18, 8]);
    } catch {
      setMoodboardStatus('Image non lisible');
    }
    setTimeout(() => setMoodboardStatus(null), 2800);
  }

  function handleSaveDesign() {
    if (components.length === 0) return;
    haptic(8);
    atelierSound('soft');
    const design = save(creationName, intention.trim() || undefined);
    setSaveStatus(`Sauvegardé · ${design.title ?? 'Ma création'}`);
    setTimeout(() => setSaveStatus(null), 2400);
  }

  async function handleShareDesign() {
    if (components.length === 0 || typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    url.searchParams.set('design', encodeBraceletDesign(getCurrentShareDesign()));
    const shareText = `Regarde mon bracelet "${creationName}" créé chez My Nice Bracelet.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: creationName,
          text: shareText,
          url: url.toString(),
        });
        setShareStatus('Partage ouvert');
      } else {
        await navigator.clipboard.writeText(`${shareText}\n${url.toString()}`);
        setShareStatus('Lien copié');
      }
      haptic([6, 18, 6]);
    } catch {
      setShareStatus('Partage annulé');
    }
    setTimeout(() => setShareStatus(null), 2400);
  }

  function handleAutoCompleteBracelet() {
    if (!atelier || fit.status !== 'too-short') return;

    const familyCounts = new Map<string, number>();
    for (const component of components) {
      if (component.kind !== 'bead') continue;
      const bead = BEAD_BY_ID[component.refId];
      if (!bead) continue;
      familyCounts.set(bead.family, (familyCounts.get(bead.family) ?? 0) + 1);
    }
    const familyOrder = [...familyCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([family]) => family);
    const allowedFamilies = atelier.allowedBeadFamilies;
    const candidates = BEADS.filter(
      (bead) => allowedFamilies.includes(bead.family) && bead.stock > 0 && bead.sizeMm > 0,
    );
    if (candidates.length === 0) return;

    const next = [...components];
    let total = lengthMm;
    let guard = 0;

    while (total < fit.minMm - 0.0001 && guard < 80) {
      const capacity = fit.maxMm - total;
      const gap = fit.minMm - total;
      const preferredFamily = familyOrder[next.length % Math.max(1, familyOrder.length)];
      const possible = candidates.filter((bead) => bead.sizeMm <= capacity + 0.0001);
      if (possible.length === 0) break;

      const bead = possible
        .slice()
        .sort((a, b) => {
          const aScore = completionScore(a, gap, preferredFamily, next.at(-1)?.refId);
          const bScore = completionScore(b, gap, preferredFamily, next.at(-1)?.refId);
          return aScore - bScore;
        })[0];
      if (!bead) break;

      next.push({ slotId: uid('s'), kind: 'bead', refId: bead.id });
      total += bead.sizeMm;
      guard++;
    }

    if (next.length === components.length) return;
    replaceComponents(next);
    atelierSound('stone');
    haptic([7, 16, 7]);
    announceStudio('Longueur complétée');
  }

  function handleCoachAction(action: CoachAction) {
    if (action === 'generate') {
      handleGuidedCreation();
      return;
    }
    if (action === 'complete') {
      handleAutoCompleteBracelet();
      return;
    }
    if (action === 'name') {
      titleInputRef.current?.focus();
      return;
    }
    if (action === 'share') {
      void handleShareDesign();
    }
  }

  function handleAddToCart() {
    if (!canOrder) return;
    const design = snapshotConfig(
      useConfigurator.getState(),
      creationName,
      intention.trim() || undefined,
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
            Changer d&rsquo;atelier
          </button>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
            {atelier?.name} · {atelier?.wireType}
          </p>
        </div>

        <section className="mb-5 grid xl:grid-cols-[1.25fr_0.75fr] gap-3">
          <div className="rounded-2xl border border-[#EEE9E0] bg-white p-3 md:p-4 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <Wand2 size={14} strokeWidth={2.2} />
                Studio guidé
              </div>
              {studioStatus && (
                <span className="rounded-full bg-[#EDF7F0] px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#244A35]">
                  {studioStatus}
                </span>
              )}
            </div>
            <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
              <div className="grid grid-cols-4 gap-1.5">
                {STUDIO_AUDIENCES.map((item) => {
                  const Icon = item.icon;
                  const active = studioAudience === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        haptic(4);
                        setStudioAudience(item.id);
                      }}
                      className={cn(
                        'inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-[9px] font-black uppercase tracking-widest transition-colors',
                        active
                          ? 'border-[#3D5A73] bg-[#3D5A73] text-white'
                          : 'border-[#EEE9E0] bg-[#F8F4ED] text-[#718096] hover:border-[#A8BED4] hover:text-[#2D3748]',
                      )}
                    >
                      <Icon size={12} strokeWidth={2.2} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {STUDIO_INTENTS.map((item) => {
                  const active = studioIntent === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        haptic(4);
                        setStudioIntent(item.id);
                      }}
                      className={cn(
                        'h-10 rounded-lg border px-2 text-[9px] font-black uppercase tracking-widest transition-colors',
                        active
                          ? 'border-[#A4473E] bg-[#FFF1EE] text-[#7A2D25]'
                          : 'border-[#EEE9E0] bg-[#F8F4ED] text-[#718096] hover:border-[#D4A8A0] hover:text-[#2D3748]',
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={handleGuidedCreation}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white shadow-sm transition-colors hover:bg-[#3D5A73]"
              >
                <Sparkles size={13} strokeWidth={2.2} />
                Créer
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9E4D7] bg-[#F4FAF4] p-3 md:p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#244A35]">
                <Camera size={14} strokeWidth={2.2} />
                Moodboard
              </div>
              {moodboardStatus && (
                <span className="rounded-full bg-white/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#244A35]">
                  {moodboardStatus}
                </span>
              )}
            </div>
            <label className="mt-3 inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#BFD9C7] bg-white px-4 text-[10px] font-black uppercase tracking-widest text-[#244A35] transition-colors hover:border-[#244A35]">
              <Camera size={13} strokeWidth={2.2} />
              Image vers bracelet
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void handleMoodboardUpload(event.target.files?.[0]);
                  event.currentTarget.value = '';
                }}
              />
            </label>
          </div>
        </section>

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
                  emptyText="Glissez une perle pour commencer"
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
              <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 z-10 inline-flex items-center gap-1 bg-white/85 backdrop-blur-md rounded-full p-1 shadow-sm border border-[#EEE9E0]">
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
              </div>
            </div>

            {/* RIGHT — white palette card floating on the warm canvas */}
            <div className="relative rounded-[1.5rem] md:rounded-[2rem] overflow-hidden bg-white border border-[#EEE9E0] shadow-md flex flex-col lg:max-h-[600px]">
              <div className="overflow-y-auto scrollbar-thin">
                {/* Tab nav — sticky edge-to-edge with its own padding.
                    Hide the Charms / Figurines tab when the atelier doesn't
                    allow them (Bracelet Bar). */}
                <div className="sticky top-0 z-10 bg-white px-5 md:px-7 pt-5 md:pt-7 pb-4 border-b border-[#EEE9E0]">
                  <div
                    className={cn(
                      'grid gap-2',
                      atelier?.allowCharms ? 'grid-cols-2' : 'grid-cols-1',
                    )}
                  >
                    {TABS.filter((t) => t.id !== 'charms' || atelier?.allowCharms).map((t) => {
                      const active = tab === t.id;
                      // Kawaii uses figurines (Sanrio / Disney) instead of generic charms.
                      const label =
                        t.id === 'charms' && atelier?.id === 'atelier_kawaii'
                          ? 'Figurines'
                          : t.label;
                      // Beads tab : compact "X,X / YY cm" (no decimals on the
                      // target since presets are integer cm values).
                      // Charms tab : count / max.
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
                            'flex items-center justify-between gap-2 p-3 rounded-xl border transition-all',
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
                              'inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[9px] font-black tabular-nums whitespace-nowrap',
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

        {/* ─── CREATION RITUAL ─── */}
        <div className="mt-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-3">
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
                Sauver
              </button>
              <button
                type="button"
                onClick={handleShareDesign}
                disabled={components.length === 0}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {shareStatus === 'Lien copié' ? (
                  <Copy size={13} strokeWidth={2.2} />
                ) : (
                  <Share2 size={13} strokeWidth={2.2} />
                )}
                Partager
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

          <div
            className={cn(
              'border rounded-xl p-4 md:p-5 shadow-sm',
              fitTone === 'ready' && 'bg-[#EDF7F0] border-[#BFD9C7] text-[#244A35]',
              fitTone === 'danger' && 'bg-[#FFF1EE] border-[#E5B8AE] text-[#7A2D25]',
              fitTone === 'quiet' && 'bg-white border-[#EEE9E0] text-[#2D3748]',
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">
                  Ajustement
                </p>
                <p className="mt-1 font-serif text-[18px] md:text-[21px] font-black uppercase tracking-tight leading-tight">
                  {fitMessage}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-white/75 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest tabular-nums">
                {formatCmFromMm(lengthMm)} / {formatCmFromMm(targetMm)}
              </span>
            </div>
          </div>
        </div>

        {/* ─── ATELIER COACH ─── */}
        <div className="mt-4">
          <CreationCoach insight={coachInsight} onAction={handleCoachAction} />
        </div>

        {/* ─── SHARE PREVIEW ─── */}
        <div className="mt-4">
          <SharePreview
            components={components}
            figurine={figurine}
            title={creationName}
            intention={intention.trim() || undefined}
            lengthMm={lengthMm}
            targetMm={targetMm}
            price={price}
          />
        </div>

        {/* ─── DUO SPLIT ─── */}
        <div className="mt-4">
          <DuoSplitPreview
            components={components}
            figurine={figurine}
            title={creationName}
            price={price}
            onShare={() => {
              void handleShareDesign();
            }}
          />
        </div>

        {/* ─── SOCIAL REMIX ─── */}
        <div className="mt-4 grid xl:grid-cols-[1fr_0.8fr] gap-3">
          <div className="rounded-2xl border border-[#EEE9E0] bg-white p-4 md:p-5 shadow-sm">
            <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                  <Globe2 size={14} strokeWidth={2.1} />
                  Galerie remix
                </div>
                <p className="mt-1 text-[12px] font-semibold italic text-[#718096]">
                  Des recettes mondiales à reprendre, personnaliser et partager.
                </p>
              </div>
              <span className="w-fit rounded-full bg-[#F5F0E8] px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#718096]">
                Paris · Global · {WORLD_REMIXES.length} drops
              </span>
            </div>
            <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
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
            <div className="grid gap-3 md:grid-cols-2">
              {filteredRemixes.map((remix) => (
                <button
                  key={remix.id}
                  type="button"
                  onClick={() => handleWorldRemix(remix)}
                  className="group overflow-hidden rounded-xl border border-[#EEE9E0] bg-[#FBF8F2] text-left transition-all hover:-translate-y-0.5 hover:border-[#3D5A73] hover:bg-white hover:shadow-md"
                >
                  <div
                    className="h-2"
                    style={{
                      background: `linear-gradient(90deg, ${remix.colors.join(', ')})`,
                    }}
                  />
                  <div className="p-3.5">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex -space-x-1.5">
                        {remix.colors.map((hex, index) => (
                          <span
                            key={`${remix.id}-${hex}-${index}`}
                            className="h-8 w-8 rounded-full border-2 border-white shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                        ))}
                      </div>
                      <span className="rounded-full bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] shadow-sm">
                        {moodLabel(remix.mood)}
                      </span>
                    </div>
                    <p className="font-serif text-[18px] font-black uppercase leading-none tracking-tight text-[#2D3748]">
                      {remix.title}
                    </p>
                    <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                      {remix.creator} · {remix.city}
                    </p>
                    <p className="mt-2 line-clamp-2 min-h-[34px] text-[12px] font-semibold italic leading-relaxed text-[#718096]">
                      {remix.story}
                    </p>
                    <div className="mt-3 grid grid-cols-[1fr_1fr_auto] items-center gap-2">
                      <span className="rounded-lg bg-white px-2.5 py-2 text-[9px] font-black uppercase tracking-widest text-[#718096]">
                        {remix.remixes} remix
                      </span>
                      <span className="rounded-lg bg-white px-2.5 py-2 text-[9px] font-black uppercase tracking-widest text-[#718096]">
                        {(remix.likes / 1000).toFixed(1).replace('.', ',')}k likes
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#2D3748] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-white">
                        <Wand2 size={11} strokeWidth={2.2} />
                        Ouvrir
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#D9E4F0] bg-[#F4F8FB] p-4 md:p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
                <Save size={14} strokeWidth={2.1} />
                Vos designs
              </div>
              <span className="rounded-full bg-white/85 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-[#718096]">
                {savedDesigns.length}/24
              </span>
            </div>
            {savedDesigns.length === 0 ? (
              <div className="flex min-h-[138px] items-center justify-center rounded-xl border border-dashed border-[#BFD0DF] bg-white/55 px-4 text-center text-[12px] font-semibold italic text-[#718096]">
                Sauvegardez une création pour la reprendre ou la partager.
              </div>
            ) : (
              <div className="grid max-h-[180px] gap-2 overflow-y-auto pr-1">
                {savedDesigns.slice(0, 5).map((design) => (
                  <button
                    key={design.id}
                    type="button"
                    onClick={() => handleSavedRemix(design.id, design.title, design.intention)}
                    className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-xl border border-white/80 bg-white p-3 text-left shadow-sm transition-colors hover:border-[#3D5A73]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-serif text-[14px] font-black uppercase tracking-tight text-[#2D3748]">
                        {design.title || 'Ma création'}
                      </span>
                      <span className="block text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
                        {design.components.length} pièces · {formatPrice(design.price)}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F5F0E8] px-3 py-2 text-[9px] font-black uppercase tracking-widest text-[#3D5A73]">
                      <Wand2 size={11} strokeWidth={2.2} />
                      Remix
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── ADD TO CART ─── */}
        <div className="mt-6 md:mt-8 grid sm:grid-cols-[1fr_auto] gap-3 items-stretch bg-[#F5F0E8] rounded-[1.5rem] p-4 md:p-5 border border-[#EEE9E0]">
          <div className="flex items-center justify-between gap-3 px-2 sm:px-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">
                {atelier?.id === 'atelier_kawaii'
                  ? `${atelier?.name} · ${atelier?.wireType}`
                  : `${atelier?.name} · ${sizeLabel === 'custom' ? 'Perso' : sizeLabel} · ${sizeCm.toString().replace('.', ',')} cm`}
              </p>
              <p className="font-serif text-[14px] md:text-[16px] font-black uppercase tracking-tight text-[#2D3748]">
                {fitMessage}
              </p>
            </div>
            <p className="font-serif text-[24px] md:text-[28px] font-black tracking-tighter text-[#2D3748] tabular-nums shrink-0">
              {formatPrice(price)}
            </p>
          </div>
          <div ref={addToCartRef}>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={!canOrder}
              className="w-full sm:w-auto h-full px-8 py-4 rounded-xl bg-[#3D5A73] hover:bg-[#2A3F50] text-white text-[11px] md:text-[13px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center justify-center gap-3"
            >
              {justAddedCart ? (
                <>
                  <Check size={16} strokeWidth={2.5} />
                  Ajouté
                </>
              ) : (
                <>
                  <ShoppingBag size={16} strokeWidth={2} />
                  Ajouter au panier
                </>
              )}
            </button>
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

      <UnboxingModal
        open={unboxingOpen}
        title={creationName}
        intention={intention.trim()}
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
                Unboxing digital
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
