'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, RotateCcw, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  useConfigurator,
  useConfiguratorPrice,
  snapshotConfig,
  resolveBead,
  resolveCharm,
} from '@/lib/store/configurator';
import { useCart } from '@/lib/store/cart';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { BraceletPreview, type BraceletPreviewHandle } from './BraceletPreview';
import { BeadPicker } from './BeadPicker';
import { CharmPicker } from './CharmPicker';
import { InspireButton } from './InspireButton';
import { DragGhost } from './DragGhost';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';
import { formatPrice } from '@/lib/utils/format';
import { cn } from '@/lib/utils/cn';
import { haptic, successMoment } from '@/lib/utils/feedback';

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

export function Configurator() {
  const {
    step,
    setStep,
    components,
    atelierId,
    sizeLabel,
    selectedComponent,
    select,
    removeComponent,
    reorderComponents,
    insertBead,
    insertCharm,
    clearComponents,
    reset,
  } = useConfigurator();
  const addCustom = useCart((s) => s.addCustom);
  const price = useConfiguratorPrice();
  const atelier = ATELIER_BY_ID[atelierId];
  const size = atelier?.sizes.find((s) => s.label === sizeLabel);

  const [justAddedCart, setJustAddedCart] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const braceletRef = useRef<BraceletPreviewHandle>(null);

  // Palette drag state — owned at this level so we can dispatch to bracelet
  const [paletteDrag, setPaletteDrag] = useState<PaletteDrag | null>(null);
  // Mirror in a ref so handlers read the freshest value without re-binding
  const paletteDragRef = useRef<PaletteDrag | null>(null);
  useEffect(() => {
    paletteDragRef.current = paletteDrag;
  }, [paletteDrag]);

  // Active tab : if user is on 'atelier' (shouldn't happen here), default to 'beads'
  const tab = step === 'charms' ? 'charms' : 'beads';

  const beadsCount = components.filter((c) => c.kind === 'bead').length;
  const charmsCount = components.filter((c) => c.kind === 'charm').length;
  const isComplete = atelier ? beadsCount === atelier.beadCount : false;

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
      if (idx !== null && idx !== undefined) {
        if (prev.kind === 'bead') insertBead(prev.refId, idx);
        else insertCharm(prev.refId, idx);
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
  }, [paletteDrag, insertBead, insertCharm]);

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

  function handleAddToCart() {
    const design = snapshotConfig(useConfigurator.getState(), 'Ma création');
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
    setTimeout(() => setJustAddedCart(false), 2000);
  }

  return (
    <div>
      <div className="container mx-auto px-4 md:px-6 pt-6 pb-10">
        {/* Top bar : back to atelier + récap */}
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
            {atelier?.name} · taille {sizeLabel} · {atelier?.wireType}
          </p>
        </div>

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
            {/* LEFT — bracelet directly on the warm canvas (no inner card) */}
            <div className="relative min-h-[480px] md:min-h-[600px] flex items-center justify-center px-3 md:px-4 py-8 md:py-10">
              <div className="w-full">
                <BraceletPreview
                  ref={braceletRef}
                  components={components}
                  variant="loop"
                  selectedSlotId={selectedComponent}
                  onSelect={(id) => select(id === selectedComponent ? null : id)}
                  onReorder={reorderComponents}
                  externalDragCursor={
                    paletteDrag?.active ? { x: paletteDrag.x, y: paletteDrag.y } : null
                  }
                  emptyText="Glissez une perle depuis la palette →"
                />
              </div>

              {/* Selected component tooltip */}
              <AnimatePresence>
                {selectedComponent && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-2 md:top-3 right-2 md:right-3 z-10 bg-white rounded-xl p-3 flex items-center gap-2 shadow-xl border border-[#EEE9E0]"
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

              {/* Inspire-moi + Recommencer floating bottom of bracelet stage */}
              <div className="absolute bottom-2 md:bottom-3 left-2 md:left-3 z-10 flex flex-wrap items-center gap-2">
                <InspireButton />
                <button
                  type="button"
                  onClick={() => {
                    haptic(10);
                    if (components.length === 0) reset();
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
                {/* Tab nav — sticky edge-to-edge with its own padding */}
                <div className="sticky top-0 z-10 bg-white px-5 md:px-7 pt-5 md:pt-7 pb-4 border-b border-[#EEE9E0]">
                  <div className="grid grid-cols-2 gap-2">
                    {TABS.map((t) => {
                      const active = tab === t.id;
                      const count = t.id === 'beads' ? beadsCount : charmsCount;
                      const max =
                        t.id === 'beads' ? (atelier?.beadCount ?? 0) : (atelier?.maxCharms ?? 0);
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
                            {t.label}
                          </span>
                          <span
                            className={cn(
                              'inline-flex items-center justify-center h-6 px-2.5 rounded-full text-[9px] font-black tabular-nums',
                              active ? 'bg-white/15 text-white' : 'bg-[#F5F0E8] text-[#3D5A73]',
                            )}
                          >
                            {count}/{max}
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

        {/* ─── ADD TO CART ─── */}
        <div className="mt-6 md:mt-8 grid sm:grid-cols-[1fr_auto] gap-3 items-stretch bg-[#F5F0E8] rounded-[1.5rem] p-4 md:p-5 border border-[#EEE9E0]">
          <div className="flex items-center justify-between gap-3 px-2 sm:px-4">
            <div>
              <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-[#A8BED4] mb-1">
                {atelier?.name} · {sizeLabel} · {size?.cm} cm
              </p>
              <p className="font-serif text-[14px] md:text-[16px] font-black uppercase tracking-tight text-[#2D3748]">
                {isComplete
                  ? 'Bracelet prêt à commander'
                  : `Placez ${(atelier?.beadCount ?? 0) - beadsCount} perle${
                      (atelier?.beadCount ?? 0) - beadsCount > 1 ? 's' : ''
                    } pour terminer`}
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
              disabled={!isComplete}
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
    </div>
  );
}

function SelectedComponentInfo({ slotId }: { slotId: string }) {
  const components = useConfigurator((s) => s.components);
  const comp = components.find((c) => c.slotId === slotId);
  if (!comp) return null;
  if (comp.kind === 'bead') {
    const bead = resolveBead(comp.refId);
    if (!bead) return null;
    return (
      <>
        <StoneSwatch hex={bead.hex} veinHex={bead.veinHex} size={32} />
        <div>
          <p className="text-[12px] font-black text-[#2D3748] uppercase tracking-tight">
            {bead.name}
          </p>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#A8BED4] tabular-nums">
            {bead.size}mm
          </p>
        </div>
      </>
    );
  }
  const charm = resolveCharm(comp.refId);
  if (!charm) return null;
  return (
    <>
      <CharmGlyph category={charm.category} material={charm.material} size={32} />
      <div>
        <p className="text-[12px] font-black text-[#2D3748] uppercase tracking-tight">
          {charm.name}
        </p>
      </div>
    </>
  );
}
