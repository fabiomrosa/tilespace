import { type Candidate, packSpace } from "./pack-space.ts";
import type { Grid, Packing, Shape, Span } from "./packing.ts";

/** Search steps per Space; T1.6 makes it an option and T1.9 chooses its value. */
const NODE_BUDGET = 1_000_000;

/** Packs the Tiles' Shapes into the Spaces of the Grid. T1.1: one Space, each Tile's first Span. */
export function pack(shapes: readonly Shape[], grid: Grid): Packing {
  const candidates: Candidate[] = shapes.map((shape, tile) => {
    const span = shape[0] as Span; // T1.2 rejects an empty Shape.
    return {
      tile,
      span: { cols: Math.min(span.cols, grid.columns), rows: Math.min(span.rows, grid.rows) },
    };
  });
  return { spaces: [packSpace(candidates, grid, NODE_BUDGET)] };
}
