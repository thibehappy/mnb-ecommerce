import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Fil d'Ariane" className="flex items-center gap-1.5 text-[12px] text-[var(--color-muted)]">
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5">
            {item.href && !isLast ? (
              <Link href={item.href} className="link-underline">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? 'text-[var(--color-ink)]' : ''}>{item.label}</span>
            )}
            {!isLast ? <ChevronRight size={12} strokeWidth={1.5} /> : null}
          </span>
        );
      })}
    </nav>
  );
}
