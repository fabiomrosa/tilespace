import type { Grid, Placement } from "@tilespace/core";
import type { Tile } from "./read-shape.ts";

/** The direction Spaces follow: the arrow keys, the default slide, the Drag. */
export type Axis = "horizontal" | "vertical";

/**
 * What a Transition gets: the Tiles leaving and entering with their Placements, the direction, the
 * Grid and the Stage's size. The Placements and the Grid are copies.
 */
export type TransitionContext = {
  leaving: { tile: Tile; placement: Placement }[];
  entering: { tile: Tile; placement: Placement }[];
  /**
   * With `peek`: the Space beyond the entering one, resting where it will be a neighbour (one Stage
   * size plus the `spaceGap` away along `direction`), and the one behind the leaving one, resting
   * where it was. Empty without `peek`, or when there is none. A Transition that slides `leaving`
   * out lands it where `behind` rests: it moves or hides them too, as the default does.
   */
  ahead: { tile: Tile; placement: Placement }[];
  behind: { tile: Tile; placement: Placement }[];
  /**
   * 1 towards the next Space (its cards come in from the right, or from below), -1 towards the
   * previous one, at the loop's wrap too.
   */
  direction: 1 | -1;
  axis: Axis;
  grid: Grid;
  /** The Stage's client size, in CSS pixels. */
  width: number;
  height: number;
  /** The distance between two Spaces, in CSS pixels: a neighbour rests a Stage size plus it away. */
  spaceGap: number;
  /** Whether the neighbouring Spaces show beside the Stage (the `peek` option). */
  peek: boolean;
};

/** The Space's slide, as one block (DEC-10). */
const SLIDE = 500;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** The cross-fade's duration when the user prefers reduced motion. */
const FADE = 150;

/**
 * The Space's slide (DEC-10): it moves along the axis as one block, the leaving Tiles out and the
 * entering ones in, one Stage size plus the `spaceGap` apart; with `peek`, the neighbours beyond
 * with them. Web Animations on `translate` only: nothing is written to the Tiles' styles. What a
 * card does beyond that is the user's, on `change`. With `prefers-reduced-motion`, a short
 * cross-fade in place instead.
 */
export function defaultTransition(context: TransitionContext): Animation[] {
  const { leaving, entering, ahead, behind, direction, width, height, axis, spaceGap } = context;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const fade = (tile: Tile, from: number, fill: FillMode) =>
      tile.animate([{ opacity: from }, { opacity: 1 - from }], { duration: FADE, fill });
    return [
      ...leaving.map(({ tile }) => fade(tile, 1, "forwards")),
      ...entering.map(({ tile }) => fade(tile, 0, "backwards")),
    ];
  }
  const at = (distance: number) =>
    axis === "horizontal" ? `${distance}px 0px` : `0px ${distance}px`;
  // A Space slides one Stage size plus the space gap, to where a neighbour rests with `peek`.
  const size = (axis === "horizontal" ? width : height) + spaceGap;
  // From one place to the next, in Spaces along the move's direction.
  const slide =
    (from: number, to: number, fill: FillMode) =>
    ({ tile }: { tile: Tile }) =>
      tile.animate([{ translate: at(from * size) }, { translate: at(to * size) }], {
        duration: SLIDE,
        easing: EASING,
        fill,
      });
  return [
    ...ahead.map(slide(2 * direction, direction, "backwards")),
    ...entering.map(slide(direction, 0, "backwards")),
    ...leaving.map(slide(0, -direction, "forwards")),
    ...behind.map(slide(-direction, -2 * direction, "forwards")),
  ];
}
