'use client';

import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  swatch?: string;
  as?: 'button';
}

export function Chip({ active, swatch, className, children, ...rest }: Props) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[12px] font-medium tracking-wide transition-colors duration-[180ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)]',
        active
          ? 'border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-canvas)]'
          : 'border-[var(--color-line-strong)] bg-transparent text-[var(--color-graphite)] hover:border-[var(--color-ink)] hover:text-[var(--color-ink)]',
        className,
      )}
    >
      {swatch ? (
        <span
          className="inline-block h-3 w-3 rounded-full border border-black/10"
          style={{ backgroundColor: swatch }}
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
