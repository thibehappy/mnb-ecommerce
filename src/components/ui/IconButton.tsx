'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils/cn';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost' | 'solid';
  size?: 'sm' | 'md' | 'lg';
  'aria-label': string;
}

const sizes = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

const variants = {
  default:
    'border border-[var(--color-line-strong)] bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-line)]',
  ghost:
    'bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-line)]',
  solid:
    'bg-[var(--color-ink)] text-[var(--color-canvas)] hover:bg-[var(--color-graphite)]',
};

export const IconButton = forwardRef<HTMLButtonElement, Props>(function IconButton(
  { variant = 'default', size = 'md', className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-[var(--radius-sm)] transition-colors duration-[320ms] ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ink)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-canvas)] disabled:opacity-40',
        sizes[size],
        variants[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
