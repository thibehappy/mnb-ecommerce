'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { resolveBead, resolveCharm } from '@/lib/store/configurator';
import { StoneSwatch } from '@/components/ui/StoneSwatch';
import { CharmGlyph } from '@/components/ui/CharmGlyph';

interface Props {
  kind: 'bead' | 'charm';
  refId: string;
  x: number;
  y: number;
}

/** Floating ghost rendered via portal that follows the cursor while dragging. */
export function DragGhost({ kind, refId, x, y }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const node = (
    <div
      className="pointer-events-none fixed z-[3000] -translate-x-1/2 -translate-y-1/2 will-change-transform"
      style={{ left: x, top: y }}
    >
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#3D5A73] shadow-2xl p-2.5 scale-[1.05]">
        {kind === 'bead' ? (
          <BeadGhost refId={refId} />
        ) : (
          <CharmGhost refId={refId} />
        )}
      </div>
    </div>
  );

  return createPortal(node, document.body);
}

function BeadGhost({ refId }: { refId: string }) {
  const bead = resolveBead(refId);
  if (!bead) return null;
  return (
    <StoneSwatch
      hex={bead.hex}
      veinHex={bead.veinHex}
      size={56}
      faceted={bead.shape === 'faceted'}
    />
  );
}

function CharmGhost({ refId }: { refId: string }) {
  const charm = resolveCharm(refId);
  if (!charm) return null;
  return <CharmGlyph category={charm.category} material={charm.material} size={52} />;
}
