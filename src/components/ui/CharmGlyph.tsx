import Image from 'next/image';
import type { CharmCategory, CharmMaterial } from '@/types';
import { cn } from '@/lib/utils/cn';

interface Props {
  category: CharmCategory;
  material: CharmMaterial;
  size?: number;
  className?: string;
  title?: string;
  /** Real product photo (transparent PNG). Replaces the SVG fallback when set. */
  image?: string;
  /** CSS scale applied to the photo. Defaults to 1 because charm/figurine
   *  PNGs typically already fill their canvas (unlike beads which have
   *  ~60 % padding around them and need 3× zoom to look prominent). */
  zoom?: number;
}

const MATERIAL_COLORS: Record<CharmMaterial, { fill: string; stroke: string; accent: string }> = {
  dore: { fill: '#D4A85F', stroke: '#8F6F3E', accent: '#F0DCB0' },
  argente: { fill: '#C5C8CC', stroke: '#8A8D90', accent: '#E8EAEC' },
  email: { fill: '#F5EFE3', stroke: '#C4B89C', accent: '#FFFFFF' },
  pierre: { fill: '#EDE4D3', stroke: '#A89878', accent: '#FFFFFF' },
};

/**
 * Geometric SVG placeholder for charm visuals.
 * Keeps the DA editorial until real product macros are ready.
 */
export function CharmGlyph({
  category,
  material,
  size = 32,
  className,
  title,
  image,
  zoom = 1,
}: Props) {
  if (image) {
    return (
      <div
        className={cn('relative shrink-0 select-none overflow-hidden', className)}
        style={{ width: size, height: size }}
        role={title ? 'img' : 'presentation'}
        aria-label={title}
      >
        <Image
          src={image}
          alt={title ?? ''}
          width={size}
          height={size}
          draggable={false}
          style={{ transform: `scale(${zoom})` }}
          className="object-contain w-full h-full pointer-events-none select-none"
        />
      </div>
    );
  }

  const { fill, stroke, accent } = MATERIAL_COLORS[material];

  return (
    <svg
      viewBox="0 0 60 60"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      className={cn('block shrink-0', className)}
    >
      <Shape category={category} fill={fill} stroke={stroke} accent={accent} />
    </svg>
  );
}

function Shape({
  category,
  fill,
  stroke,
  accent,
}: {
  category: CharmCategory;
  fill: string;
  stroke: string;
  accent: string;
}) {
  switch (category) {
    case 'coeur':
      return (
        <path
          d="M30 48 C 10 34 10 18 22 18 C 26 18 30 22 30 26 C 30 22 34 18 38 18 C 50 18 50 34 30 48 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      );
    case 'etoile':
      return (
        <polygon
          points="30,10 36,24 50,24 39,33 43,47 30,39 17,47 21,33 10,24 24,24"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      );
    case 'lune':
      return (
        <path
          d="M 42 12 A 22 22 0 1 0 42 48 A 17 17 0 1 1 42 12 Z"
          fill={fill}
          stroke={stroke}
          strokeWidth="1.5"
        />
      );
    case 'fleur':
      return (
        <g>
          {[0, 72, 144, 216, 288].map((angle, i) => (
            <ellipse
              key={i}
              cx="30"
              cy="18"
              rx="6"
              ry="10"
              fill={fill}
              stroke={stroke}
              strokeWidth="1.2"
              transform={`rotate(${angle} 30 30)`}
            />
          ))}
          <circle cx="30" cy="30" r="5" fill={accent} stroke={stroke} strokeWidth="1" />
        </g>
      );
    case 'animal':
      // Stylized butterfly/bee silhouette
      return (
        <g>
          <ellipse cx="20" cy="28" rx="10" ry="14" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <ellipse cx="40" cy="28" rx="10" ry="14" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <line x1="30" y1="14" x2="30" y2="46" stroke={stroke} strokeWidth="2" />
        </g>
      );
    case 'kawaii':
      return (
        <g>
          <circle cx="30" cy="32" r="18" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <circle cx="23" cy="28" r="1.8" fill={stroke} />
          <circle cx="37" cy="28" r="1.8" fill={stroke} />
          <path
            d="M 25 36 Q 30 40 35 36"
            fill="none"
            stroke={stroke}
            strokeWidth="1.3"
            strokeLinecap="round"
          />
          <circle cx="19" cy="34" r="1.6" fill="#E8A0A0" opacity="0.7" />
          <circle cx="41" cy="34" r="1.6" fill="#E8A0A0" opacity="0.7" />
        </g>
      );
    case 'lettre':
      return (
        <g>
          <rect x="14" y="14" width="32" height="32" rx="2" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <text
            x="30"
            y="38"
            textAnchor="middle"
            fontFamily="serif"
            fontSize="20"
            fill={stroke}
            fontWeight="500"
          >
            A
          </text>
        </g>
      );
    case 'symbole':
    default:
      return (
        <g>
          <circle cx="30" cy="30" r="18" fill="none" stroke={stroke} strokeWidth="2" />
          <circle cx="30" cy="30" r="10" fill={fill} stroke={stroke} strokeWidth="1.3" />
          <circle cx="30" cy="30" r="4" fill={accent} />
        </g>
      );
  }
}
