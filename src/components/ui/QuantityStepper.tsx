'use client';

import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function QuantityStepper({ value, onChange, min = 1, max = 20, size = 'md', className }: Props) {
  const btn =
    'flex items-center justify-center transition-colors hover:bg-[var(--color-line)] disabled:opacity-30';
  const cell = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const num = size === 'sm' ? 'w-8 text-[13px]' : 'w-10 text-[14px]';
  return (
    <div
      className={cn(
        'inline-flex items-center border border-[var(--color-line-strong)] rounded-[var(--radius-sm)]',
        className,
      )}
    >
      <button
        type="button"
        aria-label="Retirer"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        className={cn(btn, cell)}
      >
        <Minus size={14} strokeWidth={1.5} />
      </button>
      <span className={cn('text-center tabular-nums font-medium', num)}>{value}</span>
      <button
        type="button"
        aria-label="Ajouter"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        className={cn(btn, cell)}
      >
        <Plus size={14} strokeWidth={1.5} />
      </button>
    </div>
  );
}
