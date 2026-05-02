'use client';

import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { useT } from '@/lib/i18n/use-t';

interface BraceletGlyphProps {
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  /** Bracelet circumference in cm — drives the ellipse scaling so smaller
   *  bracelets don't end up with widely-spaced beads. */
  sizeCm?: number;
}

interface GlyphItem {
  component: BraceletComponent;
  x: number;
  y: number;
  rotation: number;
  radius: number;
}

/**
 * Compact SVG preview of a bracelet — used wherever we need a small
 * glyph (cart line items, etc.).
 *
 * Like SharePreview, every bead is dropped onto the bracelet at the same
 * uniform size with a common ×3 photo zoom. We deliberately do NOT scale by
 * `sizeMm`, so visual proportions follow the photo PNGs themselves — same
 * behaviour as the editor's BraceletPreview.
 *
 * The ellipse itself shrinks for smaller bracelets (15 / 17 / 19 cm) so the
 * bead density stays consistent with the Kawaii (~29 cm) reference.
 */
const BEAD_RADIUS = 8;
const PHOTO_ZOOM = 3;
const REFERENCE_SIZE_CM = 29;
const BASE_RX = 135;
const BASE_RY = 52;
const CX = 200;
const CY = 115;

function ellipseScale(sizeCm: number): number {
  return Math.max(0.45, Math.min(1, sizeCm / REFERENCE_SIZE_CM));
}

export function BraceletGlyph({
  components,
  figurine,
  sizeCm = REFERENCE_SIZE_CM,
}: BraceletGlyphProps) {
  const { t } = useT();
  const scale = ellipseScale(sizeCm);
  const rx = BASE_RX * scale;
  const ry = BASE_RY * scale;
  const items = computeItems(components, sizeCm);
  const hasBracelet = components.length > 0;
  const figurineX = CX - rx - 5;

  return (
    <svg
      viewBox="0 0 400 220"
      className="block w-full"
      role="img"
      aria-label="Aperçu du bracelet"
    >
      <defs>
        <radialGradient id="glyphGlow" cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.86" />
          <stop offset="64%" stopColor="#EFE7DC" stopOpacity="0.62" />
          <stop offset="100%" stopColor="#D8C7AF" stopOpacity="0.24" />
        </radialGradient>
      </defs>
      <rect width="400" height="220" fill="url(#glyphGlow)" />

      <ellipse
        cx={CX}
        cy={CY}
        rx={fmt(rx)}
        ry={fmt(ry)}
        fill="none"
        stroke="#A8BED4"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray={hasBracelet ? '0' : '5 8'}
        opacity={hasBracelet ? 0.7 : 0.3}
      />

      {items.map((item) => (
        <GlyphBead key={item.component.slotId} item={item} />
      ))}
      {figurine && (
        <g transform={`translate(${fmt(figurineX)} ${CY + 3})`}>
          <GlyphBead
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
          x="200"
          y="120"
          textAnchor="middle"
          fill="#A8BED4"
          fontSize="11"
          fontWeight="900"
          letterSpacing="3"
        >
          {t('preview.noBeads')}
        </text>
      )}
    </svg>
  );
}

function computeItems(components: BraceletComponent[], sizeCm: number): GlyphItem[] {
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

function GlyphBead({ item }: { item: GlyphItem }) {
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
        <circle r={item.radius * 0.62} fill="#7CADA6" stroke="#FFFFFF" strokeWidth="1.5" />
      )}
    </g>
  );
}

/**
 * Round a float to 3 decimals before stringifying it into an SVG attribute.
 *
 * Without this, `Math.cos` / `Math.sin` can return values that are
 * bit-different between Node.js (SSR) and the browser (client) — the deltas
 * are on the order of 1e-15, but they show up as distinct strings in the
 * `transform` attribute, which trips React's hydration check. 3 decimals
 * gives sub-pixel precision and is identical on both runtimes.
 */
function fmt(value: number): string {
  return value.toFixed(3);
}
