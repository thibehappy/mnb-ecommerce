'use client';

import Image from 'next/image';
import { Share2, Users } from 'lucide-react';
import type { BraceletComponent } from '@/types';
import { BEAD_BY_ID } from '@/lib/mocks/beads';
import { CHARM_BY_ID } from '@/lib/mocks/charms';
import { formatPrice } from '@/lib/utils/format';

interface DuoSplitPreviewProps {
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  title: string;
  price: number;
  onShare: () => void;
}

export function DuoSplitPreview({
  components,
  figurine,
  title,
  price,
  onShare,
}: DuoSplitPreviewProps) {
  const left = components.filter((_, index) => index % 2 === 0);
  const right = components.filter((_, index) => index % 2 === 1);
  const ready = components.length >= 8;

  return (
    <section className="overflow-hidden rounded-2xl border border-[#EEE9E0] bg-white shadow-sm">
      <div className="grid gap-3 p-4 md:grid-cols-[240px_1fr_auto] md:items-center md:p-5">
        <div>
          <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#3D5A73]">
            <Users size={14} strokeWidth={2.2} />
            Mode duo
          </div>
          <h3 className="mt-1 font-serif text-[20px] font-black uppercase leading-tight tracking-tight text-[#2D3748]">
            {ready ? `${title} · duo` : 'Amitié / couple'}
          </h3>
          <p className="mt-1 text-[12px] font-semibold italic leading-relaxed text-[#718096]">
            {ready
              ? 'Deux recettes complémentaires à reprendre ou envoyer.'
              : 'Le duo se débloque avec une base de bracelet plus complète.'}
          </p>
        </div>

        <div className="grid gap-2 md:grid-cols-2">
          <DuoLane label="A" components={left} figurine={figurine} muted={!ready} />
          <DuoLane label="B" components={right} muted={!ready} />
        </div>

        <div className="grid gap-2 md:min-w-[150px]">
          <div className="rounded-xl bg-[#F8F4ED] px-3 py-2">
            <p className="text-[8px] font-black uppercase tracking-widest text-[#A8BED4]">
              Duo estimé
            </p>
            <p className="mt-0.5 font-serif text-[18px] font-black text-[#2D3748]">
              {formatPrice(price * 2)}
            </p>
          </div>
          <button
            type="button"
            onClick={onShare}
            disabled={!ready}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2D3748] px-4 text-[10px] font-black uppercase tracking-widest text-white transition-colors hover:bg-[#3D5A73] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Share2 size={13} strokeWidth={2.2} />
            Partager duo
          </button>
        </div>
      </div>
    </section>
  );
}

function DuoLane({
  label,
  components,
  figurine,
  muted,
}: {
  label: string;
  components: BraceletComponent[];
  figurine?: BraceletComponent | null;
  muted?: boolean;
}) {
  const visible = components.slice(0, 16);
  const hidden = Math.max(0, components.length - visible.length);

  return (
    <div className="min-w-0 rounded-xl border border-[#EEE9E0] bg-[#FBF8F2] p-3">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[9px] font-black uppercase tracking-widest text-[#3D5A73]">
          Bracelet {label}
        </p>
        <span className="rounded-full bg-white px-2 py-1 text-[8px] font-black uppercase tracking-widest text-[#A8BED4]">
          {components.length + (figurine ? 1 : 0)} pièces
        </span>
      </div>
      <div className="flex min-h-10 items-center gap-1 overflow-hidden">
        {visible.length === 0 ? (
          <div className="h-9 flex-1 rounded-full border border-dashed border-[#D9E4F0] bg-white/65" />
        ) : (
          visible.map((component) => (
            <DuoToken key={component.slotId} component={component} muted={muted} />
          ))
        )}
        {figurine && <DuoToken component={figurine} muted={muted} featured />}
        {hidden > 0 && (
          <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-white px-2 text-[9px] font-black text-[#3D5A73]">
            +{hidden}
          </span>
        )}
      </div>
    </div>
  );
}

function DuoToken({
  component,
  muted,
  featured,
}: {
  component: BraceletComponent;
  muted?: boolean;
  featured?: boolean;
}) {
  const bead = component.kind === 'bead' ? BEAD_BY_ID[component.refId] : null;
  const charm = component.kind === 'charm' ? CHARM_BY_ID[component.refId] : null;
  const image = bead?.images[0] ?? charm?.images[0];
  const fallback = bead?.hex ?? '#D4A8A0';

  return (
    <span
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm"
      style={{ opacity: muted ? 0.38 : 1 }}
    >
      {image ? (
        <Image
          src={image}
          alt=""
          width={36}
          height={36}
          unoptimized
          className={featured ? 'h-9 w-9 object-contain' : 'h-7 w-7 object-contain'}
          loading="lazy"
        />
      ) : (
        <span className="h-5 w-5 rounded-full" style={{ backgroundColor: fallback }} />
      )}
    </span>
  );
}
