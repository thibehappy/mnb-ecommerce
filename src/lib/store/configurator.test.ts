import { describe, expect, it } from 'vitest';
import type { BraceletComponent } from '@/types';
import { canFit, getSizeFit, isComplete, snapshotConfig } from './configurator';

function bead(refId: string, index: number): BraceletComponent {
  return { slotId: `test-${index}`, kind: 'bead', refId };
}

describe('configurator sizing', () => {
  it('accepts a near-perfect bracelet within the user-pick tolerance', () => {
    const components = Array.from({ length: 28 }, (_, index) => bead('bead_turquoise_6', index));

    const fit = getSizeFit('atelier_bracelet_bar', 17, components);

    expect(fit.status).toBe('ready');
    expect(fit.lengthMm).toBe(168);
    expect(isComplete('atelier_bracelet_bar', 17, components)).toBe(true);
    expect(canFit('atelier_bracelet_bar', 17, components, 6)).toBe(false);
  });

  it('blocks checkout when the same bracelet is too long for a smaller size', () => {
    const components = Array.from({ length: 28 }, (_, index) => bead('bead_turquoise_6', index));

    const fit = getSizeFit('atelier_bracelet_bar', 15, components);

    expect(fit.status).toBe('too-long');
    expect(isComplete('atelier_bracelet_bar', 15, components)).toBe(false);
  });

  it('keeps the closing ritual message on cart snapshots', () => {
    const components = Array.from({ length: 28 }, (_, index) => bead('bead_turquoise_6', index));
    const state = {
      atelierId: 'atelier_bracelet_bar',
      sizeLabel: 'M',
      sizeCm: 17,
      components,
      figurine: null,
    } as Parameters<typeof snapshotConfig>[0];

    const snapshot = snapshotConfig(state, 'Bracelet Riviera', 'Un souvenir bleu de Nice.');

    expect(snapshot.title).toBe('Bracelet Riviera');
    expect(snapshot.intention).toBe('Un souvenir bleu de Nice.');
    expect(snapshot.components).toHaveLength(28);
  });
});
