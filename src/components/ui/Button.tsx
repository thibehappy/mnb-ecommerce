'use client';

import { forwardRef, type ButtonHTMLAttributes } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

type Variant = 'primary' | 'secondary' | 'outline' | 'shiny' | 'ghost' | 'link';
type Size = 'sm' | 'md' | 'lg';

interface BaseProps {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
}

type ButtonProps = BaseProps & ButtonHTMLAttributes<HTMLButtonElement> & { href?: undefined };
type AnchorProps = BaseProps & {
  href: string;
  external?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
};
type Props = ButtonProps | AnchorProps;

/* Identique aux variantes du site existant */
const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-[#3D5A73] text-[#F5F0E8] hover:bg-[#2A3F50] shadow-md border border-[#3D5A73]',
  secondary:
    'bg-[#2D3748] text-[#F5F0E8] hover:bg-[#1A202C] shadow-lg border border-[#2D3748]',
  outline:
    'bg-transparent border-2 border-[#3D5A73] text-[#3D5A73] hover:bg-[#3D5A73]/10',
  shiny:
    'bg-white text-[#2D3748] shadow-xl border border-[#EEE9E0] hover:shadow-2xl',
  ghost:
    'bg-transparent text-[#2D3748] hover:bg-[#EEE9E0]',
  link:
    'bg-transparent text-[#3D5A73] hover:text-[#2D3748] underline underline-offset-4 decoration-[#3D5A73]/40 hover:decoration-[#3D5A73]',
};

const SIZES: Record<Size, string> = {
  sm: 'px-4 py-2.5 text-[10px]',
  md: 'px-6 py-3 text-[11px]',
  lg: 'px-8 py-4 text-[12px]',
};

const BASE =
  'rounded-xl transition-all active:scale-95 inline-flex items-center justify-center gap-2 font-black uppercase tracking-widest leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5A73]/30 disabled:opacity-50 disabled:cursor-not-allowed';

export const Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, Props>(function Button(
  props,
  ref,
) {
  const {
    variant = 'primary',
    size = 'md',
    fullWidth,
    className,
    children,
    ...rest
  } = props as Props & { className?: string; children: React.ReactNode };

  const classes = cn(
    BASE,
    variant !== 'link' && SIZES[size],
    VARIANTS[variant],
    fullWidth && 'w-full',
    className,
  );

  if ('href' in props && props.href) {
    const { href, external, onClick } = props;
    if (external) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          target="_blank"
          rel="noreferrer"
          onClick={onClick}
          className={classes}
        >
          {children}
        </a>
      );
    }
    return (
      <Link
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        onClick={onClick}
        className={classes}
      >
        {children}
      </Link>
    );
  }

  const { loading, disabled, ...btnRest } = rest as ButtonProps;
  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      className={classes}
      disabled={disabled || loading}
      {...btnRest}
    >
      {loading ? (
        <span className="inline-block h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
});
