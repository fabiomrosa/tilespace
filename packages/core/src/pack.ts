import { type Candidate, packSpace } from "./pack-space.ts";
import type { Grid, Order, Packing, Placement, Score, Shape } from "./packing.ts";
import { validate } from "./validate.ts";

/** The default search steps per Space, chosen by the benchmark (docs/decisions/0001). */
const NODE_BUDGET = 100_000;

/** How `pack` searches; every option has a default. */
export type PackOptions = { order?: Order; nodeBudget?: number; score?: Score };

/**
 * Packs the Tiles' Shapes into the Spaces of the Grid, one Space at a time with the Tiles left
 * (DEC-08); the last Space holds what remains.
 */
export function pack(
  shapes: readonly Shape[],
  grid: Grid,
  { order = "fill", nodeBudget = NODE_BUDGET, score }: PackOptions = {},
): Packing {
  validate(shapes, grid, { order, nodeBudget });
  const candidates: Candidate[] = shapes.map((shape, tile) => ({
    tile,
    shape: shape.map((span) => ({
      cols: Math.min(span.cols, grid.columns),
      rows: Math.min(span.rows, grid.rows),
    })),
  }));
  const spaces: Placement[][] = [];
  let left = candidates;
  let placedBefore = 0;
  // Every Span fits an empty Space, so each Space places a Tile: at most one Space per Tile.
  for (let i = 0; i < candidates.length && left.length > 0; i++) {
    const space = packSpace(left, grid, { order, nodeBudget, placedBefore, score, shapes });
    placedBefore += space.length;
    const placed = new Set(space.map((placement) => placement.tile));
    left = left.filter((candidate) => !placed.has(candidate.tile));
    spaces.push(space);
  }
  return { spaces };
}
