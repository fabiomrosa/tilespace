import type { Grid, Placement, Shape, Span } from "./packing.ts";

/** A Tile waiting for a Space: its index in the Stage and its Shape, clamped to the Grid. */
export type Candidate = { tile: number; shape: Shape };

/**
 * Fills one Space with the Candidates by depth-first branch and bound (DEC-08): at the first empty
 * Cell, try the earliest Candidate of each distinct Shape with each of its Spans in order, then a
 * Hole. Keeps the best filling by the Score `[holes, spanRank]` found within `nodeBudget` steps;
 * a filling with no Hole stops the search.
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
  const keys = candidates.map((c) => c.shape.map((s) => `${s.cols}x${s.rows}`).join(" "));
  const largest = candidates.map((c) => Math.max(...c.shape.map((s) => s.cols * s.rows)));
  const placements: Placement[] = [];
  let best: Placement[] = [];
  let bestHoles = Number.POSITIVE_INFINITY;
  let bestRank = Number.POSITIVE_INFINITY;
  let areaLeft = largest.reduce((area, a) => area + a, 0);
  let freeCells = cells;
  let holes = 0;
  let rank = 0;
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
      const total = holes + freeCells;
      if (total < bestHoles || (total === bestHoles && rank < bestRank)) {
        bestHoles = total;
        bestRank = rank;
        best = placements.slice();
      }
      return;
    }
    // Holes and span ranks only grow deeper down, so a branch that cannot beat the best is cut.
    const bound = holes + Math.max(0, freeCells - areaLeft);
    if (bound > bestHoles || (bound === bestHoles && rank >= bestRank)) return;

    const tried = new Set<string>();
    const col = cell % columns;
    const row = (cell - col) / columns;
    for (let i = 0; i < candidates.length; i++) {
      const key = keys[i] as string;
      if (used[i] || tried.has(key)) continue;
      tried.add(key);
      const { tile, shape } = candidates[i] as Candidate;
      const maxArea = largest[i] as number;
      used[i] = 1;
      areaLeft -= maxArea;
      shape.forEach((span, spanRank) => {
        if (!fits(cell, span)) return;
        const area = span.cols * span.rows;
        mark(cell, span, 1);
        freeCells -= area;
        rank += spanRank;
        placements.push({ tile, col, row, span });
        search(cell + 1);
        placements.pop();
        rank -= spanRank;
        freeCells += area;
        mark(cell, span, 0);
      });
      areaLeft += maxArea;
      used[i] = 0;
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
