'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { MouseEvent } from 'react';
import type { SharedBracelet } from '@/types';
import { ATELIER_BY_ID } from '@/lib/mocks/ateliers';
import { useGallery, score } from '@/lib/store/gallery';
import { encodeBraceletDesign } from '@/lib/utils/share-design';
import { cn } from '@/lib/utils/cn';
import { haptic } from '@/lib/utils/feedback';
import { BraceletGlyph } from './BraceletGlyph';

interface GalleryCardProps {
  entry: SharedBracelet;
}

export function GalleryCard({ entry }: GalleryCardProps) {
  // We subscribe to myVotes only for THIS entry to avoid re-rendering the
  // whole grid when an unrelated card is voted on.
  const myVote = useGallery((s) => s.myVotes[entry.id]);
  const vote = useGallery((s) => s.vote);

  const atelier = ATELIER_BY_ID[entry.atelierId];
  const total = score(entry);
  const sizeLabel =
    atelier?.id === 'atelier_kawaii'
      ? `${(entry.sizeCm).toString().replace('.', ',')} cm`
      : `${entry.sizeLabel === 'custom' ? 'Perso' : entry.sizeLabel} · ${entry.sizeCm.toString().replace('.', ',')} cm`;

  // Stop the click from bubbling up to the parent <Link>. The vote buttons
  // sit inside the link area so the whole card is clickable, but each vote
  // must NOT trigger navigation.
  function stopBubble(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Tapping the card hands the recipe directly to the configurator via the
  // existing `?design=…` URL handler — no intermediate detail page. Encoding
  // in the href (rather than calling `loadSharedDesign` in onClick) lets
  // middle-click / "open in new tab" work correctly: the new tab parses the
  // URL on its own and loads the bracelet without depending on shared state.
  const designHref = `/creer?design=${encodeBraceletDesign({
    atelierId: entry.atelierId,
    sizeCm: entry.sizeCm,
    sizeLabel: entry.sizeLabel,
    components: entry.components,
    figurine: entry.figurine,
    title: entry.title,
  })}`;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="group relative overflow-hidden rounded-[1.25rem] border border-[#EEE9E0] bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <Link
        href={designHref}
        className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3D5A73] focus-visible:ring-offset-2"
        aria-label={`Composer le bracelet ${entry.title}`}
      >
        {/* Bracelet preview */}
        <div className="relative bg-[#EFE7DC]">
          <BraceletGlyph
            components={entry.components}
            figurine={entry.figurine}
            sizeCm={entry.sizeCm}
          />
          {atelier && (
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-black uppercase tracking-widest text-[#3D5A73] backdrop-blur-md">
              {atelier.name}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3 p-4">
          <div>
            <h3 className="font-serif text-[18px] font-black uppercase leading-tight tracking-tight text-[#2D3748] transition-colors group-hover:text-[#3D5A73]">
              {entry.title}
            </h3>
            <p className="mt-0.5 text-[10px] font-black uppercase tracking-widest text-[#A8BED4]">
              {entry.creator ? `Par ${entry.creator}` : 'Anonyme'} · {sizeLabel}
            </p>
          </div>

          {/* Voting bar — buttons swallow the click so they don't navigate. */}
          <div
            className="flex items-center justify-between gap-3 border-t border-[#EEE9E0] pt-3"
            onClick={stopBubble}
          >
            <div className="flex items-center gap-1">
              <VoteButton
                direction="up"
                active={myVote === 'up'}
                count={entry.votesUp}
                onClick={(e) => {
                  stopBubble(e);
                  haptic(6);
                  vote(entry.id, 'up');
                }}
              />
              <VoteButton
                direction="down"
                active={myVote === 'down'}
                count={entry.votesDown}
                onClick={(e) => {
                  stopBubble(e);
                  haptic(6);
                  vote(entry.id, 'down');
                }}
              />
            </div>
            <div className="text-right">
              <p className="text-[8px] font-black uppercase tracking-widest text-[#A8BED4]">
                Score
              </p>
              <p
                className={cn(
                  'font-serif text-[18px] font-black tabular-nums',
                  total > 0
                    ? 'text-[#244A35]'
                    : total < 0
                      ? 'text-[#A4473E]'
                      : 'text-[#718096]',
                )}
              >
                {total > 0 ? `+${total}` : total}
              </p>
            </div>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

function VoteButton({
  direction,
  active,
  count,
  onClick,
}: {
  direction: 'up' | 'down';
  active: boolean;
  count: number;
  onClick: (e: MouseEvent) => void;
}) {
  const Icon = direction === 'up' ? ChevronUp : ChevronDown;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === 'up' ? 'Voter pour' : 'Voter contre'}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-black tabular-nums transition-all',
        active
          ? direction === 'up'
            ? 'border-[#244A35] bg-[#244A35] text-white shadow-sm'
            : 'border-[#A4473E] bg-[#A4473E] text-white shadow-sm'
          : 'border-[#EEE9E0] bg-white text-[#3D5A73] hover:border-[#3D5A73]',
      )}
    >
      <Icon size={14} strokeWidth={2.4} />
      {count}
    </button>
  );
}
