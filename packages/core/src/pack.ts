import { type Candidate, packSpace } from "./pack-space.ts";
import type { Grid, Packing, Placement, Shape } from "./packing.ts";
import { validate } from "./validate.ts";

/** Search steps per Space; T1.6 makes it an option and T1.9 chooses its value. */
const NODE_BUDGET = 1_000_000;

/**
 * Packs the Tiles' Shapes into the Spaces of the Grid, one Space at a time with the Tiles left
 * (DEC-08); the last Space holds what remains.
 */
export function pack(shapes: readonly Shape[], grid: Grid): Packing {
  validate(shapes, grid);
  const candidates: Candidate[] = shapes.map((shape, tile) => ({
    tile,
    shape: shape.map((span) => ({
      cols: Math.min(span.cols, grid.columns),
      rows: Math.min(span.rows, grid.rows),
    })),
  }));
  const spaces: Placement[][] = [];
  let left = candidates;
  // Every Span fits an empty Space, so each Space places a Tile: at most one Space per Tile.
  for (let i = 0; i < candidates.length && left.length > 0; i++) {
    const space = packSpace(left, grid, NODE_BUDGET);
    const placed = new Set(space.map((placement) => placement.tile));
    left = left.filter((candidate) => !placed.has(candidate.tile));
    spaces.push(space);
  }
  return { spaces };
}
