'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react';
import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { sizeMmOf, totalLengthMm } from '@/lib/store/configurator';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';

type Variant = 'loop' | 'flat' | 'u';

interface ExternalDragInfo {
  /** Cursor position in client coords. */
  x: number;
  y: number;
  /** What's being dragged from the palette — used to render a phantom preview
   *  at the candidate drop position so the user sees where the bead will land. */
  kind: 'bead' | 'charm';
  refId: string;
}

interface Props {
  /** Dense ordered list of components strung on the cord. */
  components: BraceletComponent[];
  /** Target circumference in mm — defines the cord's "full" length on screen. */
  targetMm: number;
  /** Optional figurine attached to the bracelet (Kawaii only). Rendered as
   *  a side decoration outside the cord, not as a slot on it. */
  figurine?: BraceletComponent | null;
  variant?: Variant;
  selectedSlotId?: string | null;
  onSelect?: (slotId: string) => void;
  /** Move a component from `from` to `to` (drag-to-reorder on the bracelet). */
  onMove?: (from: number, to: number) => void;
  /** Active palette drag info (cursor + what's being dragged). */
  externalDrag?: ExternalDragInfo | null;
  /** Zoom factor applied to the bracelet stage via CSS transform.
   *  1 = default, > 1 zooms in, < 1 zooms out. */
  zoom?: number;
  /** Pan offset (in CSS pixels) applied to the bracelet stage. The user can
   *  drag the empty area to pan when zoom > 1 — and we forward the change
   *  via `onPanChange`. */
  pan?: { x: number; y: number };
  onPanChange?: (next: { x: number; y: number }) => void;
  emptyText?: string;
  className?: string;
}

export interface BraceletPreviewHandle {
  /** Find the index where a component dropped at (clientX, clientY) should be
   *  inserted. Returns null if the cursor isn't near the cord. */
  getInsertIdxAt(clientX: number, clientY: number): number | null;
}

interface DragState {
  fromIdx: number;
  startSvgX: number;
  startSvgY: number;
  cx: number;
  cy: number;
  offsetX: number;
  offsetY: number;
  active: boolean;
}

const DRAG_THRESHOLD_PX = 4;
const DROP_RADIUS = 130;

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

function viewBoxFor(variant: Variant): { width: number; height: number } {
  if (variant === 'flat') return { width: 1000, height: 140 };
  if (variant === 'u') return { width: 1000, height: 680 };
  // Loop — height kept compact so the rendered SVG doesn't push the stage
  // container taller than its min-h (which would shove the bottom action
  // buttons offscreen). The curve is positioned at the center of this
  // viewBox via cy = h/2 + ry/2 so empty space is symmetric top/bottom.
  return { width: 1000, height: 420 };
}

const U_GEOM = (() => {
  const { width, height } = viewBoxFor('u');
  const cx = width / 2;
  const curveR = 135;
  const yTop = 60;
  const yBottom = height - 60;
  const yArcCenter = yBottom - curveR;
  return {
    cx,
    curveR,
    xLeft: cx - curveR,
    xRight: cx + curveR,
    yTop,
    yArcCenter,
    yBottom,
    sideLen: yArcCenter - yTop,
  };
})();

interface PathSample {
  x: number;
  y: number;
  /** Tangent vector (direction of motion along the path). */
  tx: number;
  ty: number;
}

interface PathSampler {
  totalLen: number;
  pointAt(s: number): PathSample;
}

function flatPath({ width, height }: { width: number; height: number }): PathSampler {
  const startX = 60;
  const endX = width - 60;
  const y = height / 2;
  const totalLen = endX - startX;
  return {
    totalLen,
    pointAt(s) {
      const clamped = Math.max(0, Math.min(s, totalLen));
      return { x: startX + clamped, y, tx: 1, ty: 0 };
    },
  };
}

function uPath(): PathSampler {
  const { cx, curveR, xLeft, xRight, yTop, yArcCenter, sideLen } = U_GEOM;
  const arcLen = Math.PI * curveR;
  const totalLen = 2 * sideLen + arcLen;
  return {
    totalLen,
    pointAt(s) {
      const clamped = Math.max(0, Math.min(s, totalLen));
      if (clamped <= sideLen) {
        return { x: xLeft, y: yTop + clamped, tx: 0, ty: 1 };
      }
      if (clamped <= sideLen + arcLen) {
        const arcDist = clamped - sideLen;
        const theta = Math.PI - (arcDist / arcLen) * Math.PI;
        return {
          x: cx + curveR * Math.cos(theta),
          y: yArcCenter + curveR * Math.sin(theta),
          tx: curveR * Math.sin(theta),
          ty: -curveR * Math.cos(theta),
        };
      }
      const upDist = clamped - sideLen - arcLen;
      return { x: xRight, y: yArcCenter - upDist, tx: 0, ty: -1 };
    },
  };
}

function loopPath({ width, height }: { width: number; height: number }): PathSampler {
  const cx = width / 2;
  // Curve geometry stays absolute (rx=390, ry=294) so the bracelet shape is
  // identical to before. cy is set so the curve is centered vertically in
  // the taller viewBox (apex + baseline midpoint = height/2).
  const rx = width * 0.39;
  const ry = 294;
  const cy = height / 2 + ry / 2;
  // Numerical arc-length sampling — invert α(s) since the half-ellipse isn't
  // arc-length-parameterized analytically.
  const N = 200;
  const angles: number[] = [];
  const cumul: number[] = [];
  let prevX = cx + rx * Math.cos(Math.PI);
  let prevY = cy + ry * Math.sin(Math.PI);
  let len = 0;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const angle = Math.PI + Math.PI * t;
    const x = cx + rx * Math.cos(angle);
    const y = cy + ry * Math.sin(angle);
    if (i > 0) len += Math.hypot(x - prevX, y - prevY);
    angles.push(angle);
    cumul.push(len);
    prevX = x;
    prevY = y;
  }
  const totalLen = len;
  return {
    totalLen,
    pointAt(s) {
      const clamped = Math.max(0, Math.min(s, totalLen));
      // Binary search in cumul
      let lo = 0;
      let hi = cumul.length - 1;
      while (lo < hi - 1) {
        const mid = (lo + hi) >> 1;
        if (cumul[mid]! <= clamped) lo = mid;
        else hi = mid;
      }
      const seg = cumul[hi]! - cumul[lo]!;
      const tInSeg = seg > 0 ? (clamped - cumul[lo]!) / seg : 0;
      const angle = angles[lo]! * (1 - tInSeg) + angles[hi]! * tInSeg;
      return {
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
        tx: -rx * Math.sin(angle),
        ty: ry * Math.cos(angle),
      };
    },
  };
}

function pathFor(variant: Variant, dim: { width: number; height: number }): PathSampler {
  if (variant === 'flat') return flatPath(dim);
  if (variant === 'u') return uPath();
  return loopPath(dim);
}

interface SlotPos {
  /** Center coordinates of the component on the SVG. */
  x: number;
  y: number;
  /** Photo rotation (deg, SVG CW-positive) so the bead's hole follows the tangent. */
  rot: number;
  /** Tangent direction at this point (used for nearestInsertIdx side decisions). */
  tx: number;
  ty: number;
  /** Display radius on screen in svg units. = sizeMm * scale * beadPhotoZoom / 2 */
  displayRadius: number;
}

function tangentToRotDeg(tx: number, ty: number): number {
  return r((Math.atan2(ty, tx) * 180) / Math.PI + 90);
}

/** Bracelet zoom — see comment below. */
const BRACELET_ZOOM = 3;

/**
 * Compute the rendered position + rotation of every component.
 *
 * The components are EVENLY DISTRIBUTED along the cord so the user can target
 * any side of the bracelet when inserting (drop on the right = insert at the
 * rightmost slot, etc.).
 *
 * Math :
 *   freeMm = max(0, target − totalSize)
 *   gapMm  = freeMm / (N + 1)              one gap before, between each, after
 *   bead i center = (i+1)·gap + sumSize[0..i-1] + size[i]/2
 *
 * When totalSize ≈ target (bracelet full), gapMm → 0 and beads pack densely.
 * When totalSize ≪ target (sparse), beads spread out across the full cord.
 *
 * 3× zoom for ALL bead shapes on the bracelet : the SVG canvas has no overflow
 * clipping so points (étoile / nœud / cœur) don't get cropped.
 */
function computePositions(
  components: BraceletComponent[],
  variant: Variant,
  targetMm: number,
): SlotPos[] {
  if (components.length === 0) return [];
  const dim = viewBoxFor(variant);
  const path = pathFor(variant, dim);
  const totalSizeMm = totalLengthMm(components);
  const target = Math.max(targetMm, totalSizeMm + 0.0001, 1);
  const scale = path.totalLen / target;
  const freeMm = Math.max(0, targetMm - totalSizeMm);
  const gapMm = freeMm / (components.length + 1);

  const positions: SlotPos[] = [];
  let cumulMm = 0;
  for (let i = 0; i < components.length; i++) {
    const comp = components[i]!;
    const sizeMm = sizeMmOf(comp);
    const centerMm = (i + 1) * gapMm + cumulMm + sizeMm / 2;
    const sample = path.pointAt(centerMm * scale);
    const displayRadius = (sizeMm * scale * BRACELET_ZOOM) / 2;

    positions.push({
      x: r(sample.x),
      y: r(sample.y),
      rot: tangentToRotDeg(sample.tx, sample.ty),
      tx: sample.tx,
      ty: sample.ty,
      displayRadius,
    });
    cumulMm += sizeMm;
  }
  return positions;
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

/**
 * Number of placeholder "ghost" positions to display on the remaining cord.
 * Visual cue showing the user where additional beads can be dropped.
 * Decays from 15 → 0 as the cord fills up.
 */
const DEFAULT_GHOST_COUNT = 15;

/**
 * Find the index where to insert a new component dropped at (svgX, svgY).
 *
 * Strategy : project the cursor onto the path (arc-length sample), convert
 * the position to mm, then find which existing component is closest and
 * decide before / after based on cursor's side relative to its center.
 *
 * Uses the SAME even-distribution math as computePositions so the cursor's
 * snap target matches what the user sees on screen.
 */
function nearestInsertIdx(
  svgX: number,
  svgY: number,
  components: BraceletComponent[],
  variant: Variant,
  targetMm: number,
): number | null {
  const dim = viewBoxFor(variant);
  const path = pathFor(variant, dim);
  const totalSizeMm = totalLengthMm(components);
  const target = Math.max(targetMm, totalSizeMm + 0.0001, 1);
  const scale = path.totalLen / target;

  // Sample the path and find the closest point to the cursor.
  const N = 240;
  let bestS = 0;
  let bestDist = Infinity;
  for (let i = 0; i <= N; i++) {
    const s = (i / N) * path.totalLen;
    const p = path.pointAt(s);
    const d = Math.hypot(p.x - svgX, p.y - svgY);
    if (d < bestDist) {
      bestDist = d;
      bestS = s;
    }
  }
  if (bestDist > DROP_RADIUS) return null;

  const droppedAtMm = bestS / scale;

  if (components.length === 0) return 0;

  // Even-distribution centers — same math as computePositions.
  const freeMm = Math.max(0, targetMm - totalSizeMm);
  const gapMm = freeMm / (components.length + 1);

  let cumulMm = 0;
  let bestIdx = 0;
  let bestCenterDist = Infinity;
  let closestCenterMm = 0;
  for (let i = 0; i < components.length; i++) {
    const sizeMm = sizeMmOf(components[i]!);
    const centerMm = (i + 1) * gapMm + cumulMm + sizeMm / 2;
    const d = Math.abs(droppedAtMm - centerMm);
    if (d < bestCenterDist) {
      bestCenterDist = d;
      bestIdx = i;
      closestCenterMm = centerMm;
    }
    cumulMm += sizeMm;
  }

  return droppedAtMm < closestCenterMm ? bestIdx : bestIdx + 1;
}

/**
 * Placeholder positions on an EMPTY bracelet only — visual hint suggesting
 * "you can drop beads anywhere along this cord". Once the user places at
 * least one bead, the even-distribution layout itself serves as the visual
 * hint, so we don't show ghosts anymore (they'd overlap with the spread
 * beads).
 */
function computeGhostPositions(
  components: BraceletComponent[],
  variant: Variant,
): { x: number; y: number }[] {
  if (components.length > 0) return [];

  const dim = viewBoxFor(variant);
  const path = pathFor(variant, dim);

  const out: { x: number; y: number }[] = [];
  for (let i = 0; i < DEFAULT_GHOST_COUNT; i++) {
    const fraction = (i + 0.5) / DEFAULT_GHOST_COUNT;
    const sample = path.pointAt(fraction * path.totalLen);
    out.push({ x: r(sample.x), y: r(sample.y) });
  }
  return out;
}

export const BraceletPreview = forwardRef<BraceletPreviewHandle, Props>(function BraceletPreview(
  {
    components,
    targetMm,
    figurine = null,
    variant = 'loop',
    selectedSlotId,
    onSelect,
    onMove,
    externalDrag = null,
    zoom = 1,
    pan = { x: 0, y: 0 },
    onPanChange,
    emptyText = 'Glissez une perle pour commencer',
    className,
  },
  ref,
) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);

  const isEmpty = components.length === 0;
  const { width, height } = viewBoxFor(variant);
  const safeZoom = Math.max(0.1, zoom);

  // Pan-drag state — track the cursor + initial pan so we can update via
  // delta on each pointermove. Stored in a ref so window listeners don't
  // need to re-bind on every render.
  const panDragRef = useRef<{
    startX: number;
    startY: number;
    startPan: { x: number; y: number };
  } | null>(null);
  const [isPanning, setIsPanning] = useState(false);

  const positions = useMemo(
    () => computePositions(components, variant, targetMm),
    [components, variant, targetMm],
  );

  const dragRenderX = drag ? drag.cx + drag.offsetX : 0;
  const dragRenderY = drag ? drag.cy + drag.offsetY : 0;

  const ghosts = useMemo(() => computeGhostPositions(components, variant), [components, variant]);

  // Reorder drop target (internal drag of an existing component)
  const reorderTargetIdx = useMemo(() => {
    if (!drag || !drag.active) return null;
    return nearestInsertIdx(dragRenderX, dragRenderY, components, variant, targetMm);
  }, [drag, dragRenderX, dragRenderY, components, variant, targetMm]);

  // External drag (from palette) → snap insert index
  const externalInsertIdx = useMemo(() => {
    if (!externalDrag || !svgRef.current) return null;
    const sp = clientToSvg(svgRef.current, externalDrag.x, externalDrag.y);
    return nearestInsertIdx(sp.x, sp.y, components, variant, targetMm);
  }, [externalDrag, components, variant, targetMm]);

  useImperativeHandle(
    ref,
    () => ({
      getInsertIdxAt(clientX, clientY) {
        if (!svgRef.current) return null;
        const sp = clientToSvg(svgRef.current, clientX, clientY);
        return nearestInsertIdx(sp.x, sp.y, components, variant, targetMm);
      },
    }),
    [components, variant, targetMm],
  );

  function handlePointerDown(e: React.PointerEvent, idx: number) {
    if (!onMove || !svgRef.current) return;
    e.stopPropagation();
    (e.target as Element).setPointerCapture?.(e.pointerId);
    const { x, y } = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const pos = positions[idx];
    if (!pos) return;
    setDrag({
      fromIdx: idx,
      startSvgX: x,
      startSvgY: y,
      cx: x,
      cy: y,
      offsetX: pos.x - x,
      offsetY: pos.y - y,
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

  function handlePointerUp(e: React.PointerEvent, idx: number) {
    if (!drag) return;
    (e.target as Element).releasePointerCapture?.(e.pointerId);
    const comp = components[idx];
    if (!drag.active) {
      if (comp) onSelect?.(comp.slotId);
    } else if (onMove && reorderTargetIdx !== null) {
      // Insert idx is "between i-1 and i". Convert to a target list index :
      //   - if reorderTargetIdx <= drag.fromIdx : the bead lands at reorderTargetIdx
      //   - if reorderTargetIdx > drag.fromIdx  : after removing fromIdx, the
      //     target index shifts down by 1
      const target = reorderTargetIdx <= drag.fromIdx ? reorderTargetIdx : reorderTargetIdx - 1;
      if (target !== drag.fromIdx) {
        onMove(drag.fromIdx, target);
        haptic([6, 18, 6]);
      }
    }
    setDrag(null);
  }

  function handlePointerCancel() {
    setDrag(null);
  }

  /* ─── Pan handlers : drag empty stage area to translate when zoomed in ── */
  function handleStagePointerDown(e: React.PointerEvent) {
    // Pan only makes sense when zoomed in.
    if (safeZoom <= 1.01) return;
    if (!onPanChange) return;
    panDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPan: { ...pan },
    };
    setIsPanning(true);
  }
  useEffect(() => {
    if (!isPanning) return;
    function onMove(e: PointerEvent) {
      const drag = panDragRef.current;
      if (!drag) return;
      onPanChange?.({
        x: drag.startPan.x + (e.clientX - drag.startX),
        y: drag.startPan.y + (e.clientY - drag.startY),
      });
    }
    function onUp() {
      panDragRef.current = null;
      setIsPanning(false);
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [isPanning, onPanChange]);

  /**
   * Compute the position the new component WILL occupy if inserted at index
   * `k` with size `newMm`. We simulate the post-insertion layout (N+1
   * components, redistributed evenly) so the phantom matches exactly where
   * the bead will appear after dropping.
   */
  function insertGapPos(
    k: number,
    newMm: number,
  ): { x: number; y: number; rot: number; radius: number } | null {
    if (k < 0) return null;
    const dim = viewBoxFor(variant);
    const path = pathFor(variant, dim);

    const simN = components.length + 1;
    const simTotalMm = totalLengthMm(components) + newMm;
    const target = Math.max(targetMm, simTotalMm + 0.0001, 1);
    const scale = path.totalLen / target;
    const simFreeMm = Math.max(0, targetMm - simTotalMm);
    const simGap = simFreeMm / (simN + 1);

    // Cumulative size of components before the insertion point.
    let cumulMm = 0;
    for (let i = 0; i < k && i < components.length; i++) {
      cumulMm += sizeMmOf(components[i]!);
    }
    // The new bead is at index k → center =
    //   (k + 1) * simGap + sumSizeBeforeK + newMm / 2
    const centerMm = (k + 1) * simGap + cumulMm + newMm / 2;
    const sample = path.pointAt(centerMm * scale);
    return {
      x: r(sample.x),
      y: r(sample.y),
      rot: tangentToRotDeg(sample.tx, sample.ty),
      radius: (newMm * scale * BRACELET_ZOOM) / 2,
    };
  }

  const stageCursor = isPanning ? 'grabbing' : safeZoom > 1.01 && onPanChange ? 'grab' : 'default';

  return (
    <div
      className={cn('relative w-full overflow-hidden', className)}
      style={{
        touchAction: drag || isPanning ? 'none' : 'auto',
        cursor: stageCursor,
      }}
      onPointerDown={handleStagePointerDown}
    >
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${safeZoom})`,
          // Origin at the canvas center so zooming expands SYMMETRICALLY top
          // and bottom — combined with items-center on the parent stage and
          // a tall enough min-h, the bracelet stays nicely framed when zoomed.
          transformOrigin: 'center',
          transition: isPanning ? 'none' : 'transform 0.42s cubic-bezier(0.22, 1, 0.36, 1)',
          willChange: 'transform',
        }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          className="block w-full h-auto"
          preserveAspectRatio="xMidYMid meet"
          // Allow bead photos to bleed past the viewBox edges (otherwise the
          // big bead images at the curve extremities get sliced by SVG's
          // default overflow:hidden). The outer wrapper still clips at its
          // own bounds, so this is safe.
          style={{ overflow: 'visible' }}
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

          {/* Cord — always shown (the bracelet skeleton) */}
          <Cord variant={variant} width={width} height={height} />

          {/* Placeholder ghosts — visual hints for where additional beads can
             go on the remaining cord. Pure decoration : they don't capture
             pointer events (the drop target is computed by arc-length
             projection, not by ghost proximity). */}
          <g pointerEvents="none">
            {ghosts.map((g, i) => (
              <g key={`ghost-${i}`} transform={`translate(${g.x}, ${g.y})`}>
                <circle r={14} fill="#A8BED4" fillOpacity="0.1" />
                <circle
                  r={14}
                  fill="none"
                  stroke="#A8BED4"
                  strokeWidth="1.2"
                  strokeDasharray="2 3"
                />
              </g>
            ))}
          </g>

          {/* External drag drop hint — phantom preview of the dragged item at
             the candidate insert position. Lets the user clearly SEE where
             the bead will land before releasing. */}
          {externalDrag &&
            externalInsertIdx !== null &&
            (() => {
              // Compute the dragged item's mm size so the phantom matches the
              // bead it represents.
              const draggedMm =
                externalDrag.kind === 'bead'
                  ? (BEAD_BY_ID[externalDrag.refId]?.sizeMm ?? 8)
                  : (CHARM_BY_ID[externalDrag.refId]?.sizeMm ?? 8);
              const gap = insertGapPos(externalInsertIdx, draggedMm);
              if (!gap) return null;
              // gap.radius is the photo BOX (3× the visible bead). For the halo
              // and the dashed outline we use the visible bead size so they hug
              // the bead instead of swallowing a much larger area.
              const coreR = gap.radius / BRACELET_ZOOM;
              const draggedBead =
                externalDrag.kind === 'bead' ? BEAD_BY_ID[externalDrag.refId] : null;
              const draggedCharm =
                externalDrag.kind === 'charm' ? CHARM_BY_ID[externalDrag.refId] : null;
              return (
                <g pointerEvents="none" transform={`translate(${gap.x}, ${gap.y})`} opacity="0.85">
                  {/* Pulsing halo behind the phantom for emphasis */}
                  <circle r={coreR + 6} fill="#3D5A73" fillOpacity="0.2">
                    <animate
                      attributeName="r"
                      values={`${coreR + 4};${coreR + 10};${coreR + 4}`}
                      dur="0.9s"
                      repeatCount="indefinite"
                    />
                  </circle>
                  {/* Phantom bead/charm preview */}
                  {draggedBead && draggedBead.images[0] && (
                    <g transform={`rotate(${gap.rot})`}>
                      <image
                        href={draggedBead.images[0]}
                        x={-gap.radius}
                        y={-gap.radius}
                        width={gap.radius * 2}
                        height={gap.radius * 2}
                        preserveAspectRatio="xMidYMid meet"
                      />
                    </g>
                  )}
                  {draggedCharm && draggedCharm.images[0] && (
                    <image
                      href={draggedCharm.images[0]}
                      x={-gap.radius}
                      y={-gap.radius}
                      width={gap.radius * 2}
                      height={gap.radius * 2}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  )}
                  <circle
                    r={coreR + 2}
                    fill="none"
                    stroke="#3D5A73"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })()}

          {/* Reorder drop hint — when dragging an existing bead */}
          {drag?.active &&
            reorderTargetIdx !== null &&
            (() => {
              // Use the dragged bead's own mm size for an accurate preview.
              const dragged = components[drag.fromIdx];
              const draggedMm = dragged ? sizeMmOf(dragged) : 8;
              const gap = insertGapPos(reorderTargetIdx, draggedMm);
              if (!gap) return null;
              const coreR = gap.radius / BRACELET_ZOOM;
              return (
                <g pointerEvents="none">
                  <circle cx={gap.x} cy={gap.y} r={coreR + 4} fill="#3D5A73" fillOpacity="0.16" />
                  <circle
                    cx={gap.x}
                    cy={gap.y}
                    r={coreR + 4}
                    fill="none"
                    stroke="#3D5A73"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                  />
                </g>
              );
            })()}

          {/* Figurine attached to the bracelet — rendered NEXT TO the cord
             (not as a slot on it). Only Kawaii passes a figurine. */}
          {figurine &&
            (() => {
              const charm = CHARM_BY_ID[figurine.refId];
              if (!charm || !charm.images[0]) return null;
              // Anchor : on the LEFT of the bracelet.
              // For the U (Kawaii) we sit it at the vertical level of the
              // opening, in the empty space left of the left leg.
              // For other variants, fall back to a top-left position.
              const figCx = variant === 'u' ? U_GEOM.xLeft - 240 : 130;
              const figCy = variant === 'u' ? U_GEOM.yTop + 130 : 130;
              const figR = 90;
              const isFigSelected = figurine.slotId === selectedSlotId;
              return (
                <g
                  transform={`translate(${figCx}, ${figCy})`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    onSelect?.(figurine.slotId);
                  }}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                >
                  {/* Soft halo behind the figurine */}
                  <circle r={figR + 18} fill="#FFFFFF" fillOpacity="0.55" />
                  <circle
                    r={figR + 18}
                    fill="none"
                    stroke="#A8BED4"
                    strokeWidth="1.4"
                    strokeDasharray="3 4"
                    opacity="0.7"
                  />
                  {/* "Attached" link — dashed line from the figurine halo
                     toward the U's left leg, suggesting the clasp. */}
                  {variant === 'u' && (
                    <line
                      x1={figR + 18}
                      y1={0}
                      x2={U_GEOM.xLeft - figCx}
                      y2={0}
                      stroke="#A8BED4"
                      strokeWidth="1.5"
                      strokeDasharray="2 3"
                      opacity="0.5"
                    />
                  )}
                  {isFigSelected && (
                    <circle r={figR + 26} fill="#A8BED4" fillOpacity="0.4">
                      <animate
                        attributeName="r"
                        values={`${figR + 22};${figR + 32};${figR + 22}`}
                        dur="1.6s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}
                  <g filter={isFigSelected ? 'url(#mnb-glow)' : undefined}>
                    <image
                      href={charm.images[0]}
                      x={-figR}
                      y={-figR}
                      width={figR * 2}
                      height={figR * 2}
                      preserveAspectRatio="xMidYMid meet"
                    />
                  </g>
                  {isFigSelected && (
                    <circle r={figR + 4} fill="none" stroke="#3D5A73" strokeWidth="2" />
                  )}
                </g>
              );
            })()}

          <g>
            {components.map((comp, i) => {
              const pos = positions[i];
              if (!pos) return null;
              const isDragged = drag?.fromIdx === i && drag.active;
              const x = isDragged ? dragRenderX : pos.x;
              const y = isDragged ? dragRenderY : pos.y;

              const common = {
                transform: `translate(${x}, ${y})`,
                onPointerDown: (e: React.PointerEvent) => handlePointerDown(e, i),
                onPointerUp: (e: React.PointerEvent) => handlePointerUp(e, i),
                onPointerCancel: handlePointerCancel,
                style: {
                  cursor: onMove
                    ? isDragged
                      ? 'grabbing'
                      : 'grab'
                    : onSelect
                      ? 'pointer'
                      : 'default',
                  transition: isDragged ? 'none' : 'transform 0.22s cubic-bezier(0.22, 1, 0.36, 1)',
                } as React.CSSProperties,
              };

              const isSelected = comp.slotId === selectedSlotId;
              const radius = pos.displayRadius;
              // The displayRadius is the photo BOX size (3× bigger than the
              // actual bead because of the bleed factor). Halo + selection ring
              // must size to the VISIBLE bead, not the box, so they hug the
              // bead instead of swallowing a huge area around it.
              const coreR = radius / BRACELET_ZOOM;

              // Hit-area radius — sized to the VISIBLE bead, not the photo
              // box. Adjacent beads have hit areas that don't overlap, so
              // clicking on one selects exactly that one. The visual content
              // (photo with its 3× bleed) is rendered with pointer-events
              // disabled so it can't steal clicks from neighbours.
              const hitR = coreR + 2;

              if (comp.kind === 'bead') {
                const bead = BEAD_BY_ID[comp.refId];
                if (!bead) return null;
                return (
                  <g key={comp.slotId} {...common}>
                    {/* Visual layer — decoration only, no hit. */}
                    <g pointerEvents="none">
                      {isSelected && !isDragged && (
                        <circle r={coreR + 6} fill="#A8BED4" fillOpacity="0.45">
                          <animate
                            attributeName="r"
                            values={`${coreR + 4};${coreR + 10};${coreR + 4}`}
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
                      {/* Rotate the bead photo so its drilled hole follows the tangent. */}
                      <g
                        filter={isSelected && !isDragged ? 'url(#mnb-glow)' : undefined}
                        transform={`rotate(${pos.rot})`}
                      >
                        <BeadShape
                          hex={bead.hex}
                          veinHex={bead.veinHex}
                          radius={radius}
                          faceted={bead.shape === 'faceted'}
                          shape={bead.shape}
                          image={bead.images[0]}
                        />
                      </g>
                      {isSelected && !isDragged && (
                        <circle r={coreR + 2} fill="none" stroke="#3D5A73" strokeWidth="1.5" />
                      )}
                    </g>
                    {/* Hit area — invisible circle matching the visible bead. */}
                    <circle r={hitR} fill="transparent" />
                  </g>
                );
              }

              const charm = CHARM_BY_ID[comp.refId];
              if (!charm) return null;
              return (
                <g key={comp.slotId} {...common}>
                  <g pointerEvents="none">
                    {isSelected && !isDragged && (
                      <circle r={coreR + 6} fill="#A8BED4" fillOpacity="0.45">
                        <animate
                          attributeName="r"
                          values={`${coreR + 4};${coreR + 10};${coreR + 4}`}
                          dur="1.6s"
                          repeatCount="indefinite"
                        />
                      </circle>
                    )}
                    <g filter={isSelected && !isDragged ? 'url(#mnb-glow)' : undefined}>
                      <CharmShape
                        radius={radius}
                        category={charm.category}
                        material={charm.material}
                        image={charm.images[0]}
                      />
                    </g>
                    {isSelected && !isDragged && (
                      <circle r={coreR + 2} fill="none" stroke="#3D5A73" strokeWidth="1.5" />
                    )}
                  </g>
                  {/* Hit area — invisible circle matching the visible charm. */}
                  <circle r={hitR} fill="transparent" />
                </g>
              );
            })}
          </g>
        </svg>
      </div>
      {isEmpty && (
        <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
          <p className="text-[11px] font-black uppercase tracking-widest text-[#A8BED4] text-center max-w-xs px-3 py-1 rounded-full bg-white/70 backdrop-blur-sm">
            {emptyText}
          </p>
        </div>
      )}
    </div>
  );
});

function Cord({ variant, width, height }: { variant: Variant; width: number; height: number }) {
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
  if (variant === 'u') {
    const { xLeft, xRight, yTop, yArcCenter, curveR } = U_GEOM;
    const d = [
      `M ${xLeft} ${yTop}`,
      `L ${xLeft} ${yArcCenter}`,
      `A ${curveR} ${curveR} 0 0 0 ${xRight} ${yArcCenter}`,
      `L ${xRight} ${yTop}`,
    ].join(' ');
    return (
      <path
        d={d}
        fill="none"
        stroke="#A8BED4"
        strokeWidth="2"
        strokeDasharray="2 4"
        strokeLinecap="round"
        opacity="0.8"
      />
    );
  }
  // Same geometry as loopPath — keep the cord and the bead positions in sync.
  const cx = width / 2;
  const rx = width * 0.39;
  const ry = 294;
  const cy = height / 2 + ry / 2;
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
  image,
}: {
  hex: string;
  veinHex?: string;
  radius: number;
  faceted?: boolean;
  shape: string;
  image?: string;
}) {
  // The radius here already encodes the shape-aware zoom (computed upstream
  // from sizeMm * scale * beadPhotoZoom / 2). The image box spans 2 * radius.
  if (image) {
    return (
      <image
        href={image}
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }

  const dark = veinHex ?? hex;
  const gradId = `rg-${hex.slice(1)}-${veinHex?.slice(1) ?? 'x'}`;

  if (shape === 'tube') {
    return (
      <g>
        <rect
          x={-radius * 0.4}
          y={-radius * 0.18}
          width={radius * 0.8}
          height={radius * 0.36}
          rx={3}
          fill={hex}
          stroke={dark}
          strokeWidth="1"
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
      <circle r={radius * 0.4} fill={`url(#${gradId})`} />
      {faceted && (
        <polygon
          points={`${-radius * 0.24},${-radius * 0.22} ${radius * 0.24},${-radius * 0.22} ${radius * 0.32},${radius * 0.12} 0,${radius * 0.3} ${-radius * 0.32},${radius * 0.12}`}
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.35"
          strokeWidth="0.8"
        />
      )}
      <circle r={radius * 0.4} fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
    </g>
  );
}

function CharmShape({
  radius,
  category,
  material,
  image,
}: {
  radius: number;
  category: string;
  material: string;
  image?: string;
}) {
  if (image) {
    return (
      <image
        href={image}
        x={-radius}
        y={-radius}
        width={radius * 2}
        height={radius * 2}
        preserveAspectRatio="xMidYMid meet"
      />
    );
  }
  // SVG fallback (currently unused — charms catalog is empty)
  const fill = material === 'dore' ? '#D4A85F' : material === 'argente' ? '#C5C8CC' : '#F5EFE3';
  const stroke = material === 'dore' ? '#8F6F3E' : material === 'argente' ? '#8A8D90' : '#C4B89C';
  void category;
  return <circle r={radius * 0.5} fill={fill} stroke={stroke} strokeWidth="1.2" />;
}
