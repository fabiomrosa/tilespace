import { describe, expect, it } from "vitest";
import { type Grid, type Packing, type PackOptions, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

// The first path leaves 3 Holes in the first Space; a full search leaves none.
const shapes: Shape[] = [
  [span(2, 1)],
  [span(1, 3)],
  [span(1, 2)],
  [span(1, 2)],
  [span(3, 1)],
  [span(2, 1)],
  [span(1, 3)],
  [span(1, 3)],
  [span(2, 2)],
];
const grid: Grid = { columns: 4, rows: 3 };

/** Holes, then span rank, of the first Space: the terms a larger budget may only improve. */
const firstSpaceScore = (packing: Packing): [number, number] => {
  const space = packing.spaces[0] ?? [];
  const area = space.reduce((sum, p) => sum + p.span.cols * p.span.rows, 0);
  const rank = space.reduce(
    (sum, p) =>
      sum +
      (shapes[p.tile] ?? []).findIndex((s) => s.cols === p.span.cols && s.rows === p.span.rows),
    0,
  );
  return [grid.columns * grid.rows - area, rank];
};

describe("pack with a Node budget", () => {
  it("places every Tile exactly once with no overlap when the budget is 1", () => {
    const packing = pack(shapes, grid, { nodeBudget: 1 });

    const tiles = packing.spaces.flat().map((p) => p.tile);
    expect(tiles.toSorted((a, b) => a - b)).toEqual(shapes.map((_, i) => i));
    for (const space of packing.spaces) {
      const cells = space.flatMap((p) =>
        Array.from({ length: p.span.cols * p.span.rows }, (_, k) => {
          const col = p.col + (k % p.span.cols);
          const row = p.row + Math.floor(k / p.span.cols);
          return row * grid.columns + col;
        }),
      );
      expect(new Set(cells).size).toBe(cells.length);
    }
  });

  it("never gives a worse Score when the budget is larger", () => {
    const scores = [1, 3, 10, 30, 100, 1_000_000].map((nodeBudget) =>
      firstSpaceScore(pack(shapes, grid, { nodeBudget })),
    );

    for (let i = 1; i < scores.length; i++) {
      const [holes, rank] = scores[i] as [number, number];
      const [prevHoles, prevRank] = scores[i - 1] as [number, number];
      expect(holes < prevHoles || (holes === prevHoles && rank <= prevRank)).toBe(true);
    }
    // The fixture is only worth something if the budget changes the result.
    expect(scores[0]).not.toEqual(scores.at(-1));
  });

  it("returns when the Grid is 32x32 with 500 Tiles", () => {
    const many: Shape[] = Array.from(
      { length: 500 },
      (_, i) =>
        [
          [span(2, 2), span(1, 1)],
          [span(3, 1), span(1, 1)],
          [span(1, 2)],
          [span(2, 3), span(2, 1)],
        ][i % 4] as Shape,
    );

    const packing = pack(many, { columns: 32, rows: 32 });

    expect(packing.spaces.flat()).toHaveLength(500);
  });

  it("throws when the budget is not a positive integer", () => {
    const options: PackOptions = { nodeBudget: 0 };

    expect(() => pack(shapes, grid, options)).toThrow(
      new Error("tilespace: nodeBudget must be a positive integer, got 0"),
    );
  });
});
