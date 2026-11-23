import type { Grid, Placement, Span } from "./packing.ts";

/** A Tile waiting for a Space: its index in the Stage and its Span. */
export type Candidate = { tile: number; span: Span };

/**
 * Fills one Space with the Candidates by depth-first branch and bound (DEC-08): at the first empty
 * Cell, try the earliest Candidate of each distinct Span, then a Hole. Keeps the filling with the
 * fewest Holes found within `nodeBudget` search steps.
 */
export function packSpace(
  candidates: readonly Candidate[],
  grid: Grid,
  nodeBudget: number,
): Placement[] {
  const { columns, rows } = grid;
  const cells = columns * rows;
  const occupied = new Uint8Array(cells);
  const used = new Uint8Array(candidates.length);
  const placements: Placement[] = [];
  let best: Placement[] = [];
  let bestHoles = Number.POSITIVE_INFINITY;
  let areaLeft = candidates.reduce((area, c) => area + c.span.cols * c.span.rows, 0);
  let freeCells = cells;
  let holes = 0;
  let nodes = 0;

  const fits = (cell: number, span: Span): boolean => {
    const col = cell % columns;
    const row = (cell - col) / columns;
    if (col + span.cols > columns || row + span.rows > rows) return false;
    for (let r = 0; r < span.rows; r++) {
      for (let c = 0; c < span.cols; c++) {
        if (occupied[cell + r * columns + c]) return false;
      }
    }
    return true;
  };

  const mark = (cell: number, span: Span, value: number): void => {
    for (let r = 0; r < span.rows; r++) {
      for (let c = 0; c < span.cols; c++) occupied[cell + r * columns + c] = value;
    }
  };

  const search = (from: number): void => {
    if (bestHoles === 0 || nodes >= nodeBudget) return;
    nodes++;
    let cell = from;
    while (cell < cells && occupied[cell]) cell++;
    // With no Tile left, every free Cell is a Hole: count them instead of recursing per Cell.
    if (cell === cells || areaLeft === 0) {
      if (holes + freeCells < bestHoles) {
        bestHoles = holes + freeCells;
        best = placements.slice();
      }
      return;
    }
    if (holes + Math.max(0, freeCells - areaLeft) >= bestHoles) return;

    const tried = new Set<string>();
    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i] as Candidate;
      const key = `${candidate.span.cols}x${candidate.span.rows}`;
      if (used[i] || tried.has(key)) continue;
      tried.add(key);
      if (!fits(cell, candidate.span)) continue;
      const area = candidate.span.cols * candidate.span.rows;
      const col = cell % columns;
      mark(cell, candidate.span, 1);
      used[i] = 1;
      areaLeft -= area;
      freeCells -= area;
      placements.push({
        tile: candidate.tile,
        col,
        row: (cell - col) / columns,
        span: candidate.span,
      });
      search(cell + 1);
      placements.pop();
      freeCells += area;
      areaLeft += area;
      used[i] = 0;
      mark(cell, candidate.span, 0);
    }

    occupied[cell] = 1;
    holes++;
    freeCells--;
    search(cell + 1);
    freeCells++;
    holes--;
    occupied[cell] = 0;
  };

  search(0);
  return best;
}
