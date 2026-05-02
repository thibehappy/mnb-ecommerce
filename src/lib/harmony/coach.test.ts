import { describe, expect, it } from 'vitest';
import type { BraceletComponent } from '@/types';
import { getSizeFit } from '@/lib/store/configurator';
import { analyzeBraceletDesign } from './coach';

function bead(refId: string, index: number): BraceletComponent {
  return { slotId: `coach-${index}`, kind: 'bead', refId };
}

describe('bracelet coach', () => {
  it('recommends a guided base on an empty bracelet', () => {
    const components: BraceletComponent[] = [];
    const insight = analyzeBraceletDesign({
      components,
      fit: getSizeFit('atelier_bracelet_bar', 17, components),
    });

    expect(insight.tone).toBe('empty');
    expect(insight.suggestions[0]?.action).toBe('generate');
  });

  it('recommends completion when the bracelet is too short', () => {
    const components = Array.from({ length: 12 }, (_, index) => bead('bead_turquoise_6', index));
    const insight = analyzeBraceletDesign({
      components,
      fit: getSizeFit('atelier_bracelet_bar', 17, components),
      title: 'Riviera',
    });

    expect(insight.tone).toBe('progress');
    expect(insight.suggestions.some((suggestion) => suggestion.action === 'complete')).toBe(true);
  });

  it('recognizes a finished creation with story value', () => {
    const components = Array.from({ length: 28 }, (_, index) => bead('bead_turquoise_6', index));
    const insight = analyzeBraceletDesign({
      components,
      fit: getSizeFit('atelier_bracelet_bar', 17, components),
      title: 'Riviera',
      intention: 'Un souvenir bleu de Nice.',
    });

    expect(insight.tone).toBe('ready');
    expect(insight.score).toBeGreaterThan(70);
    expect(insight.suggestions.some((suggestion) => suggestion.action === 'share')).toBe(true);
  });
});
