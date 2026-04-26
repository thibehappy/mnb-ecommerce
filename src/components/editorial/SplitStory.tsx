import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

interface Props {
  eyebrow: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  visual: React.ReactNode;
  reverse?: boolean;
}

export function SplitStory({ eyebrow, title, body, ctaLabel, ctaHref, visual, reverse }: Props) {
  return (
    <section className="container-editorial py-16 lg:py-24">
      <div className={`grid lg:grid-cols-12 gap-10 lg:gap-16 items-center ${reverse ? 'lg:[direction:rtl]' : ''}`}>
        <div className="lg:col-span-6 [direction:ltr]">{visual}</div>
        <div className="lg:col-span-6 [direction:ltr]">
          <span className="text-eyebrow text-[var(--color-gold-deep)]">{eyebrow}</span>
          <h2 className="text-display-l mt-4 mb-6">{title}</h2>
          <p className="text-[17px] leading-[1.75] text-[var(--color-graphite)] mb-8 max-w-[50ch]">
            {body}
          </p>
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 text-[13px] uppercase tracking-[0.14em] font-medium link-underline"
          >
            {ctaLabel} <ArrowUpRight size={14} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </section>
  );
}
