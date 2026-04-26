import { cn } from '@/lib/utils/cn';

interface Props {
  palette: string[];
  name?: string;
  className?: string;
  aspect?: 'square' | 'portrait' | 'landscape';
}

/**
 * Stylized placeholder for kit product photography.
 * Uses palette colors and an abstract layered composition.
 * Meant to be replaced by actual photos later.
 */
export function KitVisual({ palette, name, className, aspect = 'square' }: Props) {
  const aspectClass = {
    square: 'aspect-square',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
  }[aspect];

  const [c1, c2, c3, c4] = [
    palette[0] ?? '#D4C9B5',
    palette[1] ?? '#EDE4D3',
    palette[2] ?? '#B8935A',
    palette[3] ?? '#8B8680',
  ];

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-grain',
        aspectClass,
        className,
      )}
      style={{
        background: `linear-gradient(135deg, ${c2} 0%, ${c1} 100%)`,
      }}
      role="img"
      aria-label={name ? `Visuel : ${name}` : 'Visuel du kit'}
    >
      {/* Soft concentric bracelet arc */}
      <svg
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
      >
        <defs>
          <radialGradient id={`rg-kit-${c1.slice(1)}`} cx="50%" cy="55%" r="40%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="400" fill={`url(#rg-kit-${c1.slice(1)})`} />
        {/* A stylized bracelet arc */}
        {[0, 1, 2].map((i) => {
          const radius = 130 - i * 14;
          const colors = [c3, c1, c4];
          return (
            <g key={i} opacity={0.75 - i * 0.12}>
              <path
                d={`M ${200 - radius} 230 A ${radius} ${radius * 0.7} 0 0 1 ${200 + radius} 230`}
                stroke={colors[i]}
                strokeWidth="2"
                fill="none"
                strokeDasharray="4 6"
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {/* Scattered beads along a curve */}
        {Array.from({ length: 11 }).map((_, i) => {
          const radius = 130;
          const angle = Math.PI + (i / 10) * Math.PI;
          const cx = 200 + radius * Math.cos(angle);
          const cy = 230 + radius * 0.7 * Math.sin(angle);
          const color = [c1, c3, c4, c2][i % 4];
          const size = 9 + (i % 3) * 2;
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={size} fill={color} />
              <circle
                cx={cx - size * 0.3}
                cy={cy - size * 0.35}
                r={size * 0.35}
                fill="#ffffff"
                opacity={0.4}
              />
            </g>
          );
        })}
      </svg>
      {/* Soft vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 55%, rgba(26,26,26,0.12) 100%)',
        }}
        aria-hidden
      />
    </div>
  );
}
