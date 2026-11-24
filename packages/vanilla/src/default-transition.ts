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

/** The Space's slide, as one block (DEC-10). */
const SLIDE = 500;
/** Each entering Tile's settle after the slide: a fade and a short slide. */
const SETTLE = 450;
/** How far a Tile lands short of its place before it settles, in CSS pixels. */
const SHORT = 40;
/** At most this long between two Tiles' settles, and about this long for them all. */
const STAGGER = 80;
const CASCADE = 600;
/** How faint the entering Tiles are while the Space slides. */
const GHOST = 0.4;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** The cross-fade's duration when the user prefers reduced motion. */
const FADE = 150;

/**
 * Two phases (DEC-10): the Space slides along the axis as one block, the leaving Tiles out and the
 * entering ones in, faint; then each entering Tile settles with a fade and a short slide, in its
 * order within the Space (the fill's flow; backwards, reversed), at most 80 ms apart and about
 * 600 ms in all. Web
 * Animations on `translate` and `opacity`: nothing is written to the Tiles' styles. With
 * `prefers-reduced-motion`, a short cross-fade in place instead.
 */
export function defaultTransition(context: TransitionContext): Animation[] {
  const { leaving, entering, direction, width, height, axis } = context;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const fade = (tile: Tile, from: number, fill: FillMode) =>
      tile.animate([{ opacity: from }, { opacity: 1 - from }], { duration: FADE, fill });
    return [
      ...leaving.map(({ tile }) => fade(tile, 1, "forwards")),
      ...entering.map(({ tile }) => fade(tile, 0, "backwards")),
    ];
  }
  const horizontal = axis === "horizontal";
  const at = (distance: number) => (horizontal ? `${distance}px 0px` : `0px ${distance}px`);
  const size = horizontal ? width : height;
  const step = Math.min(STAGGER, CASCADE / Math.max(1, entering.length - 1));
  return [
    ...leaving.map(({ tile }) =>
      tile.animate(
        [
          { translate: "0px 0px", opacity: 1 },
          { translate: at(-direction * size), opacity: GHOST },
        ],
        { duration: SLIDE, easing: EASING, fill: "forwards" },
      ),
    ),
    ...entering.map(({ tile }, i) => {
      // One Animation per Tile: the slide, a wait for its turn, then its settle.
      // Backwards, the Space's order reversed: its last Tile settles first.
      const turn = direction === 1 ? i : entering.length - 1 - i;
      const start = SLIDE + turn * step;
      const total = start + SETTLE;
      const landed = { translate: at(direction * SHORT), opacity: GHOST };
      return tile.animate(
        [
          { offset: 0, translate: at(direction * size), opacity: GHOST, easing: EASING },
          { offset: SLIDE / total, ...landed },
          { offset: start / total, ...landed, easing: EASING },
          { offset: 1, translate: "0px 0px", opacity: 1 },
        ],
        { duration: total, fill: "backwards" },
      );
    }),
  ];
}
