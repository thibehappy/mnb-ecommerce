import { describe, expect, it } from 'vitest';
import { decodeBraceletDesign, encodeBraceletDesign } from './share-design';

describe('bracelet design sharing', () => {
  it('round-trips a compact bracelet design payload', () => {
    const encoded = encodeBraceletDesign({
      atelierId: 'atelier_bracelet_bar',
      sizeCm: 17,
      sizeLabel: 'M',
      title: 'Bracelet Riviera',
      intention: 'Un souvenir bleu de Nice.',
      components: [
        { slotId: 'a', kind: 'bead', refId: 'bead_turquoise_6' },
        { slotId: 'b', kind: 'bead', refId: 'bead_star_orange' },
      ],
      figurine: null,
    });

    const decoded = decodeBraceletDesign(encoded);

    expect(decoded?.title).toBe('Bracelet Riviera');
    expect(decoded?.intention).toBe('Un souvenir bleu de Nice.');
    expect(decoded?.atelierId).toBe('atelier_bracelet_bar');
    expect(decoded?.components.map((component) => component.refId)).toEqual([
      'bead_turquoise_6',
      'bead_star_orange',
    ]);
  });

  it('rejects invalid share payloads', () => {
    expect(decodeBraceletDesign('not-json')).toBeNull();
  });
});
