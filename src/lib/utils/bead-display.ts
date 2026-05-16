import type { Bead, BeadShape } from '@/types';

/**
 * Photo zoom factor per bead shape.
 *
 * Why this exists : every PNG in /public/photos/beads/ has the bead centered
 * with some transparent padding around it. Round / faceted / nugget beads
 * occupy ~40 % of their PNG canvas (lots of padding) so a 3× zoom is needed
 * to make them visually prominent in tiles and on the bracelet.
 *
 * Shaped beads (cœur, étoile, fleur, nœud) fill ~70-80 % of the PNG canvas
 * (the shape's points/petals reach close to the edges). At 3× they would
 * overflow the tile container and get cropped by `overflow-hidden`. So we
 * use a smaller zoom for them.
 */
export function beadPhotoZoom(shape: BeadShape): number {
  switch (shape) {
    case 'heart':
    case 'star':
    case 'flower':
    case 'bow':
      return 1.45;
    case 'tube':
    case 'cube':
      return 2.4;
    default:
      // round, faceted, rondelle, nugget — lots of PNG padding
      return 3;
  }
}

/**
 * Picker-specific zoom — honors an optional per-bead `pickerZoom` override
 * (used for beads whose source PNG is more tightly cropped than the shape's
 * default crop ratio assumes, e.g. animal silhouettes or 2-bead "paire"
 * photos that would otherwise dominate the tile grid).
 *
 * The bracelet preview, drag ghost, and CompositionTray continue to use
 * `beadPhotoZoom(bead.shape)` directly — the override is intentionally
 * scoped to the picker, since `sizeMm` is the source of truth for bracelet
 * length and visual scale on the cord.
 */
export function beadPickerZoom(bead: Pick<Bead, 'shape' | 'pickerZoom'>): number {
  return bead.pickerZoom ?? beadPhotoZoom(bead.shape);
}
