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
  /** 1 towards the next Space, -1 towards the previous one. */
  direction: 1 | -1;
  axis: Axis;
  grid: Grid;
  /** The Stage's client size, in CSS pixels. */
  width: number;
  height: number;
};

const DURATION = 400;
/** The delay per Cell between an entering Tile and the edge it enters from (the 2017 stagger). */
const STAGGER = 40;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** The cross-fade's duration when the user prefers reduced motion. */
const FADE = 150;

/**
 * Slides the leaving Tiles out and the entering ones in along the axis, the entering Tiles
 * staggered by their Cells from the edge they enter from (DEC-10). Web Animations on `translate` and
 * `opacity`: nothing is written to the Tiles' styles. With `prefers-reduced-motion`, a short
 * cross-fade in place instead.
 */
export function defaultTransition(context: TransitionContext): Animation[] {
  const { leaving, entering, direction, grid, width, height, axis } = context;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const fade = (tile: Tile, from: number, fill: FillMode) =>
      tile.animate([{ opacity: from }, { opacity: 1 - from }], { duration: FADE, fill });
    return [
      ...leaving.map(({ tile }) => fade(tile, 1, "forwards")),
      ...entering.map(({ tile }) => fade(tile, 0, "backwards")),
    ];
  }
  const horizontal = axis === "horizontal";
  const at = (distance: number) =>
    horizontal ? `${distance * width}px 0px` : `0px ${distance * height}px`;
  const [out, into] = [at(-direction), at(direction)];
  return [
    ...leaving.map(({ tile }) =>
      tile.animate(
        [
          { translate: "0px 0px", opacity: 1 },
          { translate: out, opacity: 0 },
        ],
        { duration: DURATION, easing: EASING, fill: "forwards" },
      ),
    ),
    ...entering.map(({ tile, placement: { col, row, span } }) => {
      // Forward, Tiles enter from the right (or bottom) edge; backward, from the left (or top).
      const [start, size, count] = horizontal
        ? [col, span.cols, grid.columns]
        : [row, span.rows, grid.rows];
      const cells = direction === 1 ? count - start - size : start;
      return tile.animate(
        [
          { translate: into, opacity: 0 },
          { translate: "0px 0px", opacity: 1 },
        ],
        { duration: DURATION, delay: cells * STAGGER, easing: EASING, fill: "backwards" },
      );
    }),
  ];
}
