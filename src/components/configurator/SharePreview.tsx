'use client';

import { Camera } from 'lucide-react';
import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { useT } from '@/lib/i18n/use-t';

interface SharePreviewProps {
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  title: string;
  intention?: string;
  /** Bracelet circumference in cm, used to scale the on-canvas ellipse so
   *  smaller bracelets render with tighter bead spacing. Defaults to the
   *  Kawaii reference size (29 cm) when unknown — that's the calibration
   *  point at which the geometry below was tuned. */
  sizeCm?: number;
}

interface ShareItem {
  component: BraceletComponent;
  x: number;
  y: number;
  rotation: number;
  radius: number;
}

/**
 * Uniform bead size in the preview — we deliberately ignore each bead's
 * `sizeMm`. The PNGs are dropped onto the bracelet at full size with a
 * common ×3 photo zoom, mirroring how the main BraceletPreview renders
 * during creation.
 */
const BEAD_RADIUS = 16;
const PHOTO_ZOOM = 3;
/** Reference size at which the ellipse below was calibrated. Bracelets of
 *  this size render at scale = 1; smaller bracelets shrink proportionally
 *  so the bead density (count / arc length) stays visually consistent. */
const REFERENCE_SIZE_CM = 29;
const BASE_RX = 245;
const BASE_RY = 94;
const CX = 410;
const CY = 205;

function ellipseScale(sizeCm: number): number {
  // Clamp the floor so very tiny bracelets still produce a recognisable
  // shape; cap at 1 so the Kawaii size doesn't oversize the canvas.
  return Math.max(0.45, Math.min(1, sizeCm / REFERENCE_SIZE_CM));
}

function shareItems(components: BraceletComponent[], sizeCm: number): ShareItem[] {
  if (components.length === 0) return [];

  const scale = ellipseScale(sizeCm);
  const rx = BASE_RX * scale;
  const ry = BASE_RY * scale;
  const start = -Math.PI * 0.92;
  const span = Math.PI * 1.84;

  return components.map((component, index) => {
    const fraction = components.length === 1 ? 0.5 : index / components.length;
    const angle = start + fraction * span;
    return {
      component,
      x: CX + Math.cos(angle) * rx,
      y: CY + Math.sin(angle) * ry,
      rotation: (angle * 180) / Math.PI + 90,
      radius: BEAD_RADIUS,
    };
  });
}

export function SharePreview({
  components,
  figurine,
  title,
  intention,
  sizeCm = REFERENCE_SIZE_CM,
}: SharePreviewProps) {
  const { t } = useT();
  const scale = ellipseScale(sizeCm);
  const rx = BASE_RX * scale;
  const ry = BASE_RY * scale;
  const items = shareItems(components, sizeCm);
  const hasBracelet = components.length > 0;
  const posterIntention = intention ? truncateLabel(intention, 72) : '';
  // Figurine sits a constant offset to the LEFT of the ellipse's left edge
  // (cx − rx). When the ellipse shrinks for a smaller bracelet, the figurine
  // tracks the new edge so it stays "anchored" to the bracelet, not to the
  // canvas absolute coordinates.
  const figurineX = CX - rx - 45;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EEE9E0] bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-[#EEE9E0] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Camera size={14} strokeWidth={2.2} />
            {t('share.previewTitle')}
          </div>
          <h3 className="mt-1 font-serif text-[20px] font-black uppercase leading-tight tracking-tight text-[#2D3748]">
            {title}
          </h3>
        </div>
      </div>

      <div className="bg-[#F8F4ED] p-3 md:p-4">
        <div className="relative overflow-hidden rounded-xl bg-[#EFE7DC]">
          <svg
            viewBox="0 0 820 390"
            className="block w-full"
            role="img"
            aria-label="Prévisualisation du bracelet"
          >
            <defs>
              <radialGradient id="shareGlow" cx="50%" cy="38%" r="62%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.86" />
                <stop offset="64%" stopColor="#EFE7DC" stopOpacity="0.68" />
                <stop offset="100%" stopColor="#D8C7AF" stopOpacity="0.28" />
              </radialGradient>
            </defs>
            <rect width="820" height="390" fill="url(#shareGlow)" />
            <ellipse
              cx={CX}
              cy={CY}
              rx={fmt(rx)}
              ry={fmt(ry)}
              fill="none"
              stroke="#A8BED4"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={hasBracelet ? '0' : '7 12'}
              opacity={hasBracelet ? 0.75 : 0.3}
            />

            {items.map((item) => (
              <ShareBead key={item.component.slotId} item={item} />
            ))}
            {figurine && (
              <g transform={`translate(${fmt(figurineX)} ${CY + 5})`}>
                <ShareBead
                  item={{
                    component: figurine,
                    x: 0,
                    y: 0,
                    rotation: 0,
                    radius: BEAD_RADIUS * 1.6,
                  }}
                />
              </g>
            )}

            {!hasBracelet && (
              <text
                x="410"
                y="210"
                textAnchor="middle"
                fill="#A8BED4"
                fontSize="18"
                fontWeight="900"
                letterSpacing="4"
              >
                {t('share.empty')}
              </text>
            )}
            {posterIntention && (
              <text x="410" y="356" textAnchor="middle" fill="#718096" fontSize="13" fontWeight="700">
                {posterIntention}
              </text>
            )}
          </svg>
        </div>
      </div>
    </section>
  );
}

function ShareBead({ item }: { item: ShareItem }) {
  const bead = item.component.kind === 'bead' ? BEAD_BY_ID[item.component.refId] : null;
  const charm = item.component.kind === 'charm' ? CHARM_BY_ID[item.component.refId] : null;
  const image = bead?.images[0] ?? charm?.images[0];
  const boxRadius = item.radius * PHOTO_ZOOM;

  return (
    <g transform={`translate(${fmt(item.x)} ${fmt(item.y)}) rotate(${fmt(item.rotation)})`}>
      {image ? (
        <image
          href={image}
          x={-boxRadius}
          y={-boxRadius}
          width={boxRadius * 2}
          height={boxRadius * 2}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <circle r={item.radius * 0.62} fill="#7CADA6" stroke="#FFFFFF" strokeWidth="2" />
      )}
    </g>
  );
}

/**
 * Round a float to 3 decimals before stringifying it into an SVG attribute.
 * Math.cos / Math.sin are not guaranteed bit-identical between Node.js and
 * the browser, which would otherwise produce slightly different transform
 * strings on the server and the client and break hydration.
 */
function fmt(value: number): string {
  return value.toFixed(3);
}

function truncateLabel(value: string, maxLength: number): string {
  const compact = value.trim().replace(/\s+/g, ' ');
  if (compact.length <= maxLength) return compact;
  return `${compact.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}
