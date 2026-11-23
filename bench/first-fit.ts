import type { Grid, Packing, Placement, Shape } from "../packages/core/src/index.ts";

/**
 * The 2017 wall's greedy, without its bugs: one Space at a time, each Tile in the Stage's order goes
 * to the first Cell (row by row) where a Span of its Shape fits, Spans tried in order; a Tile that
 * fits nowhere waits for the next Space. No backtracking. The baseline the search is measured
 * against.
 */
export function firstFit(shapes: readonly Shape[], grid: Grid): Packing {
  const { columns, rows } = grid;
  const spaces: Placement[][] = [];
  let left = shapes.map((_, tile) => tile);
  while (left.length > 0) {
    const occupied = new Uint8Array(columns * rows);
    const space: Placement[] = [];
    const waiting: number[] = [];
    for (const tile of left) {
      const placement = firstPlace(tile, shapes[tile] ?? [], grid, occupied);
      if (placement) space.push(placement);
      else waiting.push(tile);
    }
    spaces.push(space);
    left = waiting;
  }
  return { spaces };
}

function firstPlace(
  tile: number,
  shape: Shape,
  { columns, rows }: Grid,
  occupied: Uint8Array,
): Placement | undefined {
  for (const asked of shape) {
    const span = { cols: Math.min(asked.cols, columns), rows: Math.min(asked.rows, rows) };
    for (let row = 0; row + span.rows <= rows; row++) {
      for (let col = 0; col + span.cols <= columns; col++) {
        if (!free(occupied, columns, col, row, span.cols, span.rows)) continue;
        for (let r = row; r < row + span.rows; r++)
          occupied.fill(1, r * columns + col, r * columns + col + span.cols);
        return { tile, col, row, span };
      }
    }
  }
  return undefined;
}

function free(
  occupied: Uint8Array,
  columns: number,
  col: number,
  row: number,
  cols: number,
  rows: number,
) {
  for (let r = row; r < row + rows; r++) {
    for (let c = col; c < col + cols; c++) if (occupied[r * columns + c]) return false;
  }
  return true;
}
