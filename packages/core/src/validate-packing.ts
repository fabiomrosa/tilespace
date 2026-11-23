import type { Grid, Packing, Shape } from "./packing.ts";

/**
 * Throws a `tilespace:` error naming the first invariant a Packing breaks for these Shapes and Grid:
 * a Tile unknown, placed twice or left unplaced, a Span not in its (clamped) Shape, a Tile out of
 * the Grid, or two Tiles sharing a Cell. The engine checks a custom Packer's result with it.
 */
export function validatePacking(packing: Packing, shapes: readonly Shape[], grid: Grid): void {
  const fail = (message: string): never => {
    throw new Error(`tilespace: packing ${message}`);
  };
  const placed = new Set<number>();
  packing.spaces.forEach((space, s) => {
    const owner = new Map<number, number>();
    for (const { tile, col, row, span } of space) {
      const shape = shapes[tile];
      if (!shape) fail(`places unknown tile ${tile}`);
      if (placed.has(tile)) fail(`places tile ${tile} twice`);
      placed.add(tile);
      const inShape = shape?.some(
        (s) =>
          Math.min(s.cols, grid.columns) === span.cols && Math.min(s.rows, grid.rows) === span.rows,
      );
      if (!inShape) fail(`gives tile ${tile} the Span ${span.cols}x${span.rows}, not in its Shape`);
      if (col < 0 || row < 0 || col + span.cols > grid.columns || row + span.rows > grid.rows) {
        fail(`places tile ${tile} out of the Grid at col ${col}, row ${row}`);
      }
      for (let r = row; r < row + span.rows; r++) {
        for (let c = col; c < col + span.cols; c++) {
          const other = owner.get(r * grid.columns + c);
          if (other !== undefined) {
            fail(`overlaps tiles ${tile} and ${other} in space ${s} at col ${c}, row ${r}`);
          }
          owner.set(r * grid.columns + c, tile);
        }
      }
    }
  });
  shapes.forEach((_, tile) => {
    if (!placed.has(tile)) fail(`leaves tile ${tile} unplaced`);
  });
}
