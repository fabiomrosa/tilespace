import type { Grid, Holes, Order, Placement, Score, Shape, Span } from "./packing.ts";

/** A Tile waiting for a Space: its index in the Stage and its Shape, clamped to the Grid. */
export type Candidate = { tile: number; shape: Shape };

/**
 * How a Space is searched: the order mode, the Node budget, the Tiles placed in earlier Spaces, and
 * a custom Score with the Stage's Shapes it is given.
 */
export type SpaceSearch = {
  order: Order;
  nodeBudget: number;
  placedBefore: number;
  score: Score | undefined;
  shapes: readonly Shape[];
  holes: Holes;
};

/**
 * Fills one Space with the Candidates by depth-first branch and bound (DEC-08): at the first empty
 * Cell, try the earliest Candidate of each distinct Shape (in `strict` mode only the next one) with
 * each of its Spans in order, then a Hole. Keeps the best filling by the Score
 * `[holes, spanRank, early, displacement]` found within the Node budget (`early`: how far before the
 * end of the flow its Holes sit, so they gather at the end); a filling with no Hole stops the
 * search. A custom Score replaces it, with no cut and no stop: only the Node budget bounds it.
 */
export function packSpace(
  candidates: readonly Candidate[],
  grid: Grid,
  { order, nodeBudget, placedBefore, score, shapes, holes: where }: SpaceSearch,
): Placement[] {
  const { columns, rows } = grid;
  const cells = columns * rows;
  const occupied = new Uint8Array(cells);
  const used = new Uint8Array(candidates.length);
  const keys = candidates.map((c) => c.shape.map((s) => `${s.cols}x${s.rows}`).join(" "));
  const largest = candidates.map((c) => Math.max(...c.shape.map((s) => s.cols * s.rows)));
  const placements: Placement[] = [];
  let best: Placement[] | undefined;
  let bestHoles = Number.POSITIVE_INFINITY;
  let bestRank = Number.POSITIVE_INFINITY;
  let bestEarly = Number.POSITIVE_INFINITY;
  let bestDisplacement = Number.POSITIVE_INFINITY;
  let bestTerms: number[] = [];
  let areaLeft = largest.reduce((area, a) => area + a, 0);
  let freeCells = cells;
  let holes = 0;
  let rank = 0;
  let early = 0;
  let displacement = 0;
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

  /** Compares a Score with the best one, term by term: negative when it is better. */
  // With `holes: "order"` the Displacement comes before `early`.
  const compare = (h: number, r: number, e: number, d: number): number =>
    h - bestHoles ||
    r - bestRank ||
    (where === "end"
      ? e - bestEarly || d - bestDisplacement
      : d - bestDisplacement || e - bestEarly);

  const search = (from: number): void => {
    // The budget stops the search only once it has a filling, so the first path, which takes the
    // first Candidate that fits at each Cell or a Hole, always completes the Space.
    if (bestHoles === 0 || (nodes >= nodeBudget && best !== undefined)) return;
    nodes++;
    let cell = from;
    while (cell < cells && occupied[cell]) cell++;
    // With no Tile left, every free Cell is a Hole: count them instead of recursing per Cell.
    if (cell === cells || areaLeft === 0) {
      if (score) {
        // A Space that places no Tile would drop Tiles: it never counts, whatever the Score says.
        if (placements.length === 0) return;
        // A copy, so a Score that changes what it is given cannot change the Packing or the search.
        const terms = score(
          placements.map((p) => ({ ...p, span: { ...p.span } })),
          shapes,
        );
        if (best === undefined || isLower(terms, bestTerms)) {
          bestTerms = terms;
          best = placements.slice();
        }
        return;
      }
      const total = holes + freeCells;
      // The free Cells left are Holes too: each counts how far it sits before the last Cell.
      let allEarly = early;
      for (let c = cell; c < cells; c++) if (!occupied[c]) allEarly += cells - 1 - c;
      if (compare(total, rank, allEarly, displacement) < 0) {
        bestHoles = total;
        bestRank = rank;
        bestEarly = allEarly;
        bestDisplacement = displacement;
        best = placements.slice();
      }
      return;
    }
    // Every term of the Score only grows deeper down, so a branch that cannot beat the best is cut.
    // The Holes still to come are at least the Cells no Tile can cover; at best they are the last
    // Cells of the flow, which sit 0, 1, … k-1 before the end.
    const coming = Math.max(0, freeCells - areaLeft);
    const soon = early + (coming * (coming - 1)) / 2;
    if (!score && compare(holes + coming, rank, soon, displacement) >= 0) return;

    const tried = new Set<string>();
    const col = cell % columns;
    const row = (cell - col) / columns;
    for (let i = 0; i < candidates.length; i++) {
      const key = keys[i] as string;
      if (used[i] || tried.has(key)) continue;
      tried.add(key);
      const { tile, shape } = candidates[i] as Candidate;
      const maxArea = largest[i] as number;
      // Displacement: how many places the Tile moves from its order in the Stage.
      const moved = Math.abs(placedBefore + placements.length - tile);
      used[i] = 1;
      displacement += moved;
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
      displacement -= moved;
      used[i] = 0;
      if (order === "strict") break;
    }

    occupied[cell] = 1;
    holes++;
    early += cells - 1 - cell;
    freeCells--;
    search(cell + 1);
    freeCells++;
    early -= cells - 1 - cell;
    holes--;
    occupied[cell] = 0;
  };

  search(0);
  return best ?? [];
}

/** Whether the terms of `a` rank before those of `b`, compared in order. */
function isLower(a: readonly number[], b: readonly number[]): boolean {
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) return (a[i] as number) < (b[i] as number);
  }
  return false;
}
