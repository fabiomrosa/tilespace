import type { Grid, Shape } from "../src/index.ts";

/**
 * The fewest Holes any filling of one Space can have with these Shapes (already clamped), found by
 * trying every Tile with every Span, or a Hole, at the first empty Cell. Tiles of equal Shapes are
 * interchangeable, so only the first unused one of each is tried, and a Span listed twice once. A
 * branch is cut when its Holes plus the Cells the unused Tiles cannot cover even at their largest
 * Spans reach the best. An oracle for small Grids, written apart from the Packer.
 */
export function fewestHoles(shapes: readonly Shape[], grid: Grid): number {
  const { columns, rows } = grid;
  const occupied = new Uint8Array(columns * rows);
  const used = shapes.map(() => false);
  const largest = shapes.map((shape) => Math.max(...shape.map((s) => s.cols * s.rows)));
  let best = columns * rows;

  const cover = (cell: number, cols: number, spanRows: number, value: number): boolean => {
    const col = cell % columns;
    const row = Math.floor(cell / columns);
    if (col + cols > columns || row + spanRows > rows) return false;
    for (let r = 0; r < spanRows; r++) {
      for (let c = 0; c < cols; c++) {
        if (value === 1 && occupied[cell + r * columns + c]) return false;
      }
    }
    for (let r = 0; r < spanRows; r++) {
      for (let c = 0; c < cols; c++) occupied[cell + r * columns + c] = value;
    }
    return true;
  };

  const search = (holes: number): void => {
    const free = occupied.length - occupied.reduce((sum, v) => sum + v, 0);
    const coverable = largest.reduce((sum, area, i) => (used[i] ? sum : sum + area), 0);
    if (holes + Math.max(0, free - coverable) >= best) return;
    const cell = occupied.indexOf(0);
    if (cell === -1) {
      best = holes;
      return;
    }
    const tried = new Set<string>();
    shapes.forEach((shape, i) => {
      const key = JSON.stringify(shape);
      if (used[i] || tried.has(key)) return;
      tried.add(key);
      for (const span of new Map(shape.map((s) => [`${s.cols}x${s.rows}`, s])).values()) {
        if (!cover(cell, span.cols, span.rows, 1)) continue;
        used[i] = true;
        search(holes);
        used[i] = false;
        cover(cell, span.cols, span.rows, 0);
      }
    });
    occupied[cell] = 1;
    search(holes + 1);
    occupied[cell] = 0;
  };

  search(0);
  return best;
}
