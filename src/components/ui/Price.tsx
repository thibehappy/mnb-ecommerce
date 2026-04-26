import { cn } from '@/lib/utils/cn';
import { formatPrice } from '@/lib/utils/format';

interface Props {
  amount: number;
  originalAmount?: number;
  size?: 'sm' | 'md' | 'lg';
  align?: 'left' | 'right';
  className?: string;
}

const sizes = {
  sm: 'text-[14px]',
  md: 'text-[18px]',
  lg: 'text-[28px] font-serif',
};

export function Price({ amount, originalAmount, size = 'md', align = 'left', className }: Props) {
  const hasPromo = originalAmount !== undefined && originalAmount > amount;
  return (
    <div className={cn('inline-flex items-baseline gap-2', align === 'right' && 'justify-end', className)}>
      <span className={cn(sizes[size], 'tabular-nums')}>{formatPrice(amount)}</span>
      {hasPromo ? (
        <span className="text-[13px] text-[var(--color-muted)] line-through tabular-nums">
          {formatPrice(originalAmount!)}
        </span>
      ) : null}
    </div>
  );
}
