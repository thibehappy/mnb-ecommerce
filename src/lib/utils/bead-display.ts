import type { BeadShape } from '@/types';

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
