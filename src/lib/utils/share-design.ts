import type { SharedBraceletDesign } from '@/lib/store/configurator';

type ShareableComponent = Pick<
  SharedBraceletDesign['components'][number],
  'kind' | 'refId' | 'flipped'
>;

interface ShareableBraceletPayload {
  v: 1;
  atelierId: string;
  sizeCm: number;
  sizeLabel: SharedBraceletDesign['sizeLabel'];
  components: ShareableComponent[];
  figurine: ShareableComponent | null;
  /** Kawaii attachment ids — preserved verbatim through the URL when
   *  set ; missing keys mean "use catalogue defaults" on hydration. */
  figurineChainId?: string;
  figurineClaspId?: string;
  title?: string;
  intention?: string;
}

export function encodeBraceletDesign(design: SharedBraceletDesign): string {
  const payload: ShareableBraceletPayload = {
    v: 1,
    atelierId: design.atelierId,
    sizeCm: design.sizeCm,
    sizeLabel: design.sizeLabel,
    components: design.components.map((component) => ({
      kind: component.kind,
      refId: component.refId,
      // Only emit `flipped` when truthy — keeps URLs short for the
      // common case where every component is in its default orientation.
      ...(component.flipped ? { flipped: true } : {}),
    })),
    figurine: design.figurine
      ? {
          kind: design.figurine.kind,
          refId: design.figurine.refId,
        }
      : null,
    // Only emit attachment ids when present + non-empty — keeps the
    // URLs tight for non-Kawaii designs.
    ...(design.figurineChainId ? { figurineChainId: design.figurineChainId } : {}),
    ...(design.figurineClaspId ? { figurineClaspId: design.figurineClaspId } : {}),
    title: design.title,
    intention: design.intention,
  };

  return encodeURIComponent(JSON.stringify(payload));
}

export function decodeBraceletDesign(raw: string): SharedBraceletDesign | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<ShareableBraceletPayload>;
    if (parsed.v !== 1 || typeof parsed.atelierId !== 'string') return null;
    if (typeof parsed.sizeCm !== 'number' || !Number.isFinite(parsed.sizeCm)) return null;
    if (
      parsed.sizeLabel !== 'S' &&
      parsed.sizeLabel !== 'M' &&
      parsed.sizeLabel !== 'L' &&
      parsed.sizeLabel !== 'custom'
    ) {
      return null;
    }
    if (!Array.isArray(parsed.components)) return null;

    return {
      atelierId: parsed.atelierId,
      sizeCm: parsed.sizeCm,
      sizeLabel: parsed.sizeLabel,
      components: parsed.components
        .filter(
          (component): component is ShareableComponent =>
            Boolean(component) &&
            (component.kind === 'bead' || component.kind === 'charm') &&
            typeof component.refId === 'string',
        )
        .map((component, index) => ({
          slotId: `shared-${index}`,
          kind: component.kind,
          refId: component.refId,
          ...(component.flipped === true ? { flipped: true } : {}),
        })),
      figurine:
        parsed.figurine &&
        (parsed.figurine.kind === 'bead' || parsed.figurine.kind === 'charm') &&
        typeof parsed.figurine.refId === 'string'
          ? {
              slotId: 'shared-figurine',
              kind: parsed.figurine.kind,
              refId: parsed.figurine.refId,
            }
          : null,
      figurineChainId:
        typeof parsed.figurineChainId === 'string' ? parsed.figurineChainId : undefined,
      figurineClaspId:
        typeof parsed.figurineClaspId === 'string' ? parsed.figurineClaspId : undefined,
      title: typeof parsed.title === 'string' ? parsed.title : undefined,
      intention: typeof parsed.intention === 'string' ? parsed.intention : undefined,
    };
  } catch {
    return null;
  }
}
