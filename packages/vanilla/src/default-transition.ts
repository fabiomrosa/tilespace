import type { Grid, Placement } from "@tilespace/core";
import type { Tile } from "./read-shape.ts";

/** What a Transition gets: the Tiles leaving and entering, with their Placements. */
export type TransitionContext = {
  leaving: { tile: Tile; placement: Placement }[];
  entering: { tile: Tile; placement: Placement }[];
  /** 1 towards the next Space, -1 towards the previous one. */
  direction: 1 | -1;
  grid: Grid;
  /** The Stage's width, in CSS pixels: how far a Tile slides. */
  width: number;
};

const DURATION = 400;
/** The delay per Cell between an entering Tile and the edge it enters from (the 2017 stagger). */
const STAGGER = 40;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";

/**
 * Slides the leaving Tiles out and the entering ones in along the row, the entering Tiles staggered
 * by their Cells from the edge they enter from (DEC-10). Web Animations on `translate` and
 * `opacity`: nothing is written to the Tiles' styles.
 */
export function defaultTransition(context: TransitionContext): Animation[] {
  const { leaving, entering, direction, grid, width } = context;
  const out = `${-direction * width}px 0px`;
  const into = `${direction * width}px 0px`;
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
    ...entering.map(({ tile, placement: { col, span } }) => {
      // Forward, Tiles enter from the right edge; backward, from the left.
      const cells = direction === 1 ? grid.columns - col - span.cols : col;
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
