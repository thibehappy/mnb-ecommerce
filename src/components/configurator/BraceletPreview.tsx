'use client';

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';

interface Props {
  components: BraceletComponent[];
  variant?: 'loop' | 'flat';
  selectedSlotId?: string | null;
  onSelect?: (slotId: string) => void;
  /** Reorder existing items via drag on the SVG */
  onReorder?: (next: BraceletComponent[]) => void;
  /** Cursor position when dragging from an external palette (client coords).
   *  Set to null when no external drag is active. */
  externalDragCursor?: { x: number; y: number } | null;
  emptyText?: string;
  className?: string;
}

export interface BraceletPreviewHandle {
  /** Find the insertion index nearest to the given client coordinates,
   *  or null if outside a reasonable drop radius. */
  getInsertIdxAt(clientX: number, clientY: number): number | null;
}

interface DragState {
  slotId: string;
  startIdx: number;
  startSvgX: number;
  startSvgY: number;
  cx: number;
  cy: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
}

const DRAG_THRESHOLD_PX = 4;
/** Maximum distance (in viewBox units) to count as "over a slot" when dropping from palette */
const DROP_RADIUS = 110;

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

function sizeForBead(size: 4 | 6 | 8 | 10): number {
  return { 4: 18, 6: 26, 8: 32, 10: 38 }[size];
}

function computePositions(n: number, variant: 'loop' | 'flat'): { x: number; y: number }[] {
  if (n === 0) return [];
  const width = 1000;
  const height = variant === 'loop' ? 420 : 140;

  if (variant === 'flat') {
    const startX = 80;
    const endX = width - 80;
    const y = height / 2;
    const step = (endX - startX) / Math.max(1, n - 1);
    return Array.from({ length: n }, (_, i) => ({
      x: r(n === 1 ? (startX + endX) / 2 : startX + step * i),
      y: r(y),
    }));
  }

  const cx = width / 2;
  const cy = height * 0.92;
  const rx = width * 0.44;
  const ry = height * 0.78;
  const start = Math.PI;
  const end = 2 * Math.PI;
  const denom = Math.max(1, n - 1);
  return Array.from({ length: n }, (_, i) => {
    const t = n === 1 ? 0.5 : i / denom;
    const angle = start + (end - start) * t;
    return { x: r(cx + rx * Math.cos(angle)), y: r(cy + ry * Math.sin(angle)) };
  });
}

function clientToSvg(svg: SVGSVGElement, clientX: number, clientY: number) {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const sp = pt.matrixTransform(ctm.inverse());
  return { x: sp.x, y: sp.y };
}

export const BraceletPreview = forwardRef<BraceletPreviewHandle, Props>(function BraceletPreview(
  {
    components,
    variant = 'loop',
    selectedSlotId,
    onSelect,
    onReorder,
    externalDragCursor,
    emptyText = 'Glissez une perle ici depuis la palette',
    className,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const isEmpty = components.length === 0;
  const width = 1000;
  const height = variant === 'loop' ? 420 : 140;

  // Slot positions for current components
  const positions = useMemo(
    () => computePositions(components.length, variant),
    [components.length, variant],
  );

  // Insertion targets : positions where a NEW item could land (n+1 candidates)
  const insertionPositions = useMemo(() => {
    return computePositions(components.length + 1, variant);
  }, [components.length, variant]);

  // Internal drag (reorder) target
  const dragRenderX = drag ? drag.cx + drag.offsetX : 0;
  const dragRenderY = drag ? drag.cy + drag.offsetY : 0;
  const reorderTargetIdx = useMemo(() => {
    if (!drag || !drag.active) return null;
    let bestIdx = drag.startIdx;
    let best = Infinity;
    positions.forEach((p, i) => {
      if (i === drag.startIdx) return;
      const d = Math.hypot(p.x - dragRenderX, p.y - dragRenderY);
      if (d < best) {
        best = d;
        bestIdx = i;
      }
    });
    return bestIdx;
  }, [drag, positions, dragRenderX, dragRenderY]);

  // External drag (from palette) : compute insertion index based on cursor
  const externalTargetIdx = useMemo(() => {
    if (!externalDragCursor || !svgRef.current) return null;
    const svgPoint = clientToSvg(svgRef.current, externalDragCursor.x, externalDragCursor.y);
    let bestIdx = -1;
    let best = Infinity;
    insertionPositions.forEach((p, i) => {
      const d = Math.hypot(p.x - svgPoint.x, p.y - svgPoint.y);
      if (d < best) {
        best = d;
        bestIdx = i;
      }
    });
    if (best > DROP_RADIUS) return null;
    return bestIdx;
  }, [externalDragCursor, insertionPositions]);

  // While the external palette drag is over a slot, shift existing beads to
  // their *future* slot positions (the n+1 layout) — this opens up a clean
  // gap exactly where the new bead will land. Outside drop zone : unchanged.
  const usingInsertionLayout = externalTargetIdx !== null;
  const displayPositions = useMemo(() => {
    if (!usingInsertionLayout || externalTargetIdx === null) return positions;
    return components.map((_, i) => {
      const slotIdx = i < externalTargetIdx ? i : i + 1;
      return insertionPositions[slotIdx] ?? positions[i];
    });
  }, [usingInsertionLayout, externalTargetIdx, positions, insertionPositions, components]);

  useImperativeHandle(
    ref,
    () => ({
      getInsertIdxAt(clientX, clientY) {
        if (!svgRef.current) return null;
        const svgPoint = clientToSvg(svgRef.current, clientX, clientY);
        let bestIdx = -1;
        let best = Infinity;
        insertionPositions.forEach((p, i) => {
          const d = Math.hypot(p.x - svgPoint.x, p.y - svgPoint.y);
          if (d < best) {
            best = d;
            bestIdx = i;
          }
        });
        if (best > DROP_RADIUS) return null;
        return bestIdx;
      },
    }),
    [insertionPositions],
  );

  // ── Reorder drag handlers ────────────────────────────
  function handlePointerDown(e: React.PointerEvent, slotId: string, idx: number) {
    if (!onReorder || !svgRef.current) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const slotPos = positions[idx];
    if (!slotPos) return;
    setDrag({
      slotId,
      startIdx: idx,
      startSvgX: x,
      startSvgY: y,
      cx: x,
      cy: y,
      offsetX: slotPos.x - x,
      offsetY: slotPos.y - y,
      active: false,
    });
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!drag || !svgRef.current) return;
    const { x, y } = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const dx = x - drag.startSvgX;
    const dy = y - drag.startSvgY;
    const moved = Math.hypot(dx, dy) > DRAG_THRESHOLD_PX;
    setDrag({ ...drag, cx: x, cy: y, active: drag.active || moved });
  }

  function handlePointerUp(e: React.PointerEvent, slotId: string, idx: number) {
    if (!drag) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    if (!drag.active) {
      onSelect?.(slotId);
    } else if (onReorder && reorderTargetIdx !== null && reorderTargetIdx !== drag.startIdx) {
      const next = [...components];
      const [moved] = next.splice(drag.startIdx, 1);
      if (moved) next.splice(reorderTargetIdx, 0, moved);
      onReorder(next);
      haptic([6, 18, 6]);
    }
    setDrag(null);
    void idx;
  }

  function handlePointerCancel() {
    setDrag(null);
  }

  return (
    <div className={cn('relative w-full', className)} style={{ touchAction: drag ? 'none' : 'auto' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        className="block w-full h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Aperçu du bracelet"
        onPointerMove={drag ? handlePointerMove : undefined}
      >
        <defs>
          <filter id="mnb-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {!isEmpty && <Cord variant={variant} width={width} height={height} />}

        {/* External drag : single snap target ring where the new bead will land */}
        {externalTargetIdx !== null && insertionPositions[externalTargetIdx] && (
          <g
            transform={`translate(${insertionPositions[externalTargetIdx]!.x}, ${insertionPositions[externalTargetIdx]!.y})`}
            pointerEvents="none"
          >
            <circle r="28" fill="#3D5A73" fillOpacity="0.18" />
            <circle r="28" fill="none" stroke="#3D5A73" strokeWidth="2" strokeDasharray="3 4">
              <animate attributeName="r" values="24;30;24" dur="1.4s" repeatCount="indefinite" />
            </circle>
          </g>
        )}

        {/* Reorder drop hint */}
        {drag?.active && reorderTargetIdx !== null && positions[reorderTargetIdx] && (
          <g
            transform={`translate(${positions[reorderTargetIdx]!.x}, ${positions[reorderTargetIdx]!.y})`}
            pointerEvents="none"
          >
            <circle r="22" fill="#3D5A73" fillOpacity="0.16" />
            <circle r="22" fill="none" stroke="#3D5A73" strokeWidth="2" strokeDasharray="3 4" />
          </g>
        )}

        <g>
          {components.map((comp, i) => {
            const pos = displayPositions[i];
            if (!pos) return null;
            const isDragged = drag?.slotId === comp.slotId && drag.active;
            const x = isDragged ? dragRenderX : pos.x;
            const y = isDragged ? dragRenderY : pos.y;

            const common = {
              transform: `translate(${x}, ${y})`,
              onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, comp.slotId, i),
              onPointerUp: (e: React.PointerEvent) => handlePointerUp(e, comp.slotId, i),
              onPointerCancel: handlePointerCancel,
              style: {
                cursor: onReorder ? (isDragged ? 'grabbing' : 'grab') : onSelect ? 'pointer' : 'default',
                transition: isDragged ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
              } as React.CSSProperties,
            };

            if (comp.kind === 'bead') {
              const bead = BEAD_BY_ID[comp.refId];
              if (!bead) return null;
              const radius = sizeForBead(bead.size);
              const isSelected = comp.slotId === selectedSlotId;
              return (
                <g key={comp.slotId} {...common}>
                  {isSelected && !isDragged && (
                    <circle r={radius + 12} fill="#A8BED4" fillOpacity="0.45">
                      <animate
                        attributeName="r"
                        values={`${radius + 8};${radius + 18};${radius + 8}`}
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="fill-opacity"
                        values="0.55;0.15;0.55"
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <g filter={isSelected && !isDragged ? 'url(#mnb-glow)' : undefined}>
                    <BeadShape
                      hex={bead.hex}
                      veinHex={bead.veinHex}
                      radius={radius}
                      faceted={bead.shape === 'faceted'}
                      shape={bead.shape}
                    />
                  </g>
                  {isSelected && !isDragged && (
                    <circle r={radius + 3} fill="none" stroke="#3D5A73" strokeWidth="2" />
                  )}
                </g>
              );
            }

            const charm = CHARM_BY_ID[comp.refId];
            if (!charm) return null;
            const isSelected = comp.slotId === selectedSlotId;
            return (
              <g key={comp.slotId} {...common}>
                {isSelected && !isDragged && (
                  <circle r={36} fill="#A8BED4" fillOpacity="0.45">
                    <animate
                      attributeName="r"
                      values="28;44;28"
                      dur="1.6s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
                <g filter={isSelected && !isDragged ? 'url(#mnb-glow)' : undefined}>
                  <CharmShape category={charm.category} material={charm.material} />
                </g>
                {isSelected && !isDragged && (
                  <circle r={30} fill="none" stroke="#3D5A73" strokeWidth="2" />
                )}
              </g>
            );
          })}
        </g>
      </svg>
      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <p className="text-[13px] font-black uppercase tracking-widest text-[#A8BED4] text-center max-w-xs">
            {emptyText}
          </p>
        </div>
      )}
    </div>
  );
});

function Cord({
  variant,
  width,
  height,
}: {
  variant: 'loop' | 'flat';
  width: number;
  height: number;
}) {
  if (variant === 'flat') {
    const y = height / 2;
    return (
      <line
        x1={60}
        y1={y}
        x2={width - 60}
        y2={y}
        stroke="#A8BED4"
        strokeWidth="2"
        strokeDasharray="2 4"
        strokeLinecap="round"
        opacity="0.8"
      />
    );
  }
  const cx = width / 2;
  const cy = height * 0.92;
  const rx = width * 0.44;
  const ry = height * 0.78;
  return (
    <path
      d={`M ${cx - rx} ${cy} A ${rx} ${ry} 0 0 1 ${cx + rx} ${cy}`}
      fill="none"
      stroke="#A8BED4"
      strokeWidth="2"
      strokeDasharray="2 4"
      strokeLinecap="round"
      opacity="0.8"
    />
  );
}

function BeadShape({
  hex,
  veinHex,
  radius,
  faceted,
  shape,
}: {
  hex: string;
  veinHex?: string;
  radius: number;
  faceted?: boolean;
  shape: string;
}) {
  const dark = veinHex ?? hex;
  const gradId = `rg-${hex.slice(1)}-${veinHex?.slice(1) ?? 'x'}`;

  if (shape === 'tube') {
    return (
      <g>
        <rect
          x={-radius * 1.2}
          y={-radius * 0.55}
          width={radius * 2.4}
          height={radius * 1.1}
          rx={3}
          fill={hex}
          stroke={dark}
          strokeWidth="1"
        />
        <rect
          x={-radius * 1.2}
          y={-radius * 0.55}
          width={radius * 2.4}
          height={radius * 0.3}
          rx={3}
          fill="#ffffff"
          fillOpacity="0.35"
        />
      </g>
    );
  }

  return (
    <g>
      <defs>
        <radialGradient id={gradId} cx="35%" cy="25%" r="75%">
          <stop offset="0%" stopColor={hex} stopOpacity="1" />
          <stop offset="100%" stopColor={dark} stopOpacity="1" />
        </radialGradient>
      </defs>
      <circle r={radius} fill={`url(#${gradId})`} />
      {faceted && (
        <polygon
          points={`${-radius * 0.6},${-radius * 0.55} ${radius * 0.6},${-radius * 0.55} ${radius * 0.8},${radius * 0.3} 0,${radius * 0.75} ${-radius * 0.8},${radius * 0.3}`}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
      )}
      <circle r={radius} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <ellipse
        cx={-radius * 0.3}
        cy={-radius * 0.35}
        rx={radius * 0.38}
        ry={radius * 0.24}
        fill="#ffffff"
        fillOpacity="0.5"
      />
    </g>
  );
}

function CharmShape({
  category,
  material,
}: {
  category: string;
  material: string;
}) {
  const fill = material === 'dore' ? '#D4A85F' : material === 'argente' ? '#C5C8CC' : '#F5EFE3';
  const stroke = material === 'dore' ? '#8F6F3E' : material === 'argente' ? '#8A8D90' : '#C4B89C';
  const accent = material === 'dore' ? '#F0DCB0' : '#FFFFFF';

  const s = 1.8;
  return (
    <g transform={`scale(${s})`}>
      <circle cx={0} cy={-18} r={2.5} fill="none" stroke={stroke} strokeWidth="1" />
      {category === 'coeur' && (
        <path
          d="M 0 8 C -12 -2 -12 -12 -6 -12 C -3 -12 0 -9 0 -6 C 0 -9 3 -12 6 -12 C 12 -12 12 -2 0 8 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="0.8"
        />
      )}
      {category === 'etoile' && (
        <polygon
          points="0,-12 3.6,-4 12,-4 5.3,1.4 7.8,10 0,5.2 -7.8,10 -5.3,1.4 -12,-4 -3.6,-4"
          fill={fill}
          stroke={stroke}
          strokeWidth="0.8"
          strokeLinejoin="round"
        />
      )}
      {category === 'lune' && (
        <path
          d="M 8 -12 A 12 12 0 1 0 8 10 A 9 9 0 1 1 8 -12 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="0.8"
        />
      )}
      {category === 'fleur' && (
        <g>
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="0"
              cy="-6"
              rx="3"
              ry="6"
              fill={fill}
              stroke={stroke}
              strokeWidth="0.7"
              transform={`rotate(${angle} 0 0)`}
            />
          ))}
          <circle r="2.5" fill={accent} stroke={stroke} strokeWidth="0.6" />
        </g>
      )}
      {category === 'animal' && (
        <g>
          <ellipse cx={-5} cy={0} rx={5} ry={8} fill={fill} stroke={stroke} strokeWidth="0.8" />
          <ellipse cx={5} cy={0} rx={5} ry={8} fill={fill} stroke={stroke} strokeWidth="0.8" />
        </g>
      )}
      {category === 'kawaii' && (
        <g>
          <circle r="10" fill={fill} stroke={stroke} strokeWidth="0.8" />
          <circle cx={-3.5} cy={-2} r={1.2} fill={stroke} />
          <circle cx={3.5} cy={-2} r={1.2} fill={stroke} />
          <path
            d="M -3 2 Q 0 5 3 2"
            fill="none"
            stroke={stroke}
            strokeWidth="0.9"
            strokeLinecap="round"
          />
          <circle cx={-6.5} cy={2} r={1.4} fill="#E8A0A0" opacity="0.7" />
          <circle cx={6.5} cy={2} r={1.4} fill="#E8A0A0" opacity="0.7" />
        </g>
      )}
      {category === 'lettre' && (
        <g>
          <rect x={-8} y={-8} width={16} height={16} rx={1} fill={fill} stroke={stroke} strokeWidth="0.8" />
          <text x={0} y={4} textAnchor="middle" fontFamily="Georgia, serif" fontSize="11" fontWeight="900" fill={stroke}>
            A
          </text>
        </g>
      )}
      {category === 'symbole' && (
        <g>
          <circle r="8" fill="none" stroke={stroke} strokeWidth="1.2" />
          <circle r="4" fill={fill} stroke={stroke} strokeWidth="0.7" />
        </g>
      )}
    </g>
  );
}
