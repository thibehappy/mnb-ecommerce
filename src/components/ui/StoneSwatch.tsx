import Image from 'next/image';
import { cn } from '@/lib/utils/cn';

interface Props {
  /** Primary stone color */
  hex: string;
  /** Optional veining color to suggest natural texture */
  veinHex?: string;
  size?: number;
  /** Show a subtle highlight for depth */
  glossy?: boolean;
  className?: string;
  title?: string;
  /** Faceted look — angular highlights */
  faceted?: boolean;
  /** Real product photo (transparent PNG) — when provided, replaces the SVG fallback */
  image?: string;
  /** Photo zoom factor (CSS scale). Use beadPhotoZoom(shape) from
   *  @/lib/utils/bead-display for shape-appropriate values. Defaults to 3
   *  which is right for round / faceted beads (lots of PNG padding) but
   *  crops shaped beads (heart, star, flower, bow). */
  zoom?: number;
}

/**
 * Renders a bead-like orb. When a real product photo URL is provided via
 * `image`, displays the photo (with transparent background). Otherwise
 * falls back to a stylized SVG with radial gradient + veining + highlight.
 */
export function StoneSwatch({
  hex,
  veinHex,
  size = 64,
  glossy = true,
  className,
  title,
  faceted = false,
  image,
  zoom = 3,
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

  const darker = veinHex ?? hex;
  const gradId = `g-${hex.slice(1)}-${veinHex?.slice(1) ?? 'x'}`;
  const highlightId = `h-${hex.slice(1)}`;
  const noiseId = `n-${hex.slice(1)}`;

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-label={title}
      className={cn('block shrink-0', className)}
    >
      <defs>
        <radialGradient id={gradId} cx="38%" cy="32%" r="70%">
          <stop offset="0%" stopColor={hex} stopOpacity="1" />
          <stop offset="55%" stopColor={hex} stopOpacity="1" />
          <stop offset="100%" stopColor={darker} stopOpacity="1" />
        </radialGradient>
        <radialGradient id={highlightId} cx="35%" cy="25%" r="30%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <filter id={noiseId}>
          <feTurbulence type="fractalNoise" baseFrequency="1.8" numOctaves="2" seed="3" />
          <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
          <feComposite in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill={`url(#${gradId})`} />
      {veinHex ? (
        <>
          <path
            d="M 15 55 Q 40 35 70 50 T 90 48"
            stroke={veinHex}
            strokeWidth="0.8"
            strokeOpacity="0.35"
            fill="none"
          />
          <path
            d="M 25 70 Q 50 60 72 72"
            stroke={veinHex}
            strokeWidth="0.6"
            strokeOpacity="0.25"
            fill="none"
          />
        </>
      ) : null}
      {faceted ? (
        <>
          <polygon
            points="30,30 70,30 82,60 50,80 18,60"
            fill="none"
            stroke="#ffffff"
            strokeOpacity="0.25"
            strokeWidth="0.6"
          />
          <line
            x1="50"
            y1="30"
            x2="50"
            y2="80"
            stroke="#ffffff"
            strokeOpacity="0.2"
            strokeWidth="0.4"
          />
          <line
            x1="30"
            y1="30"
            x2="82"
            y2="60"
            stroke="#ffffff"
            strokeOpacity="0.15"
            strokeWidth="0.4"
          />
          <line
            x1="70"
            y1="30"
            x2="18"
            y2="60"
            stroke="#ffffff"
            strokeOpacity="0.15"
            strokeWidth="0.4"
          />
        </>
      ) : null}
      <circle cx="50" cy="50" r="48" fill={`url(#${noiseId})`} />
      {glossy ? <circle cx="50" cy="50" r="48" fill={`url(#${highlightId})`} /> : null}
      <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}
