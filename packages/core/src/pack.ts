import { type Candidate, packSpace } from "./pack-space.ts";
import type { Grid, Packing, Shape } from "./packing.ts";
import { validate } from "./validate.ts";

/** Search steps per Space; T1.6 makes it an option and T1.9 chooses its value. */
const NODE_BUDGET = 1_000_000;

/** Packs the Tiles' Shapes into the Spaces of the Grid. T1.1: one Space. */
export function pack(shapes: readonly Shape[], grid: Grid): Packing {
  validate(shapes, grid);
  const candidates: Candidate[] = shapes.map((shape, tile) => ({
    tile,
    shape: shape.map((span) => ({
      cols: Math.min(span.cols, grid.columns),
      rows: Math.min(span.rows, grid.rows),
    })),
  }));
  return { spaces: [packSpace(candidates, grid, NODE_BUDGET)] };
}
