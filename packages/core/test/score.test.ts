import { describe, expect, it } from "vitest";
import { type Placement, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

describe("pack with a custom Score", () => {
  // Two Tiles that can each be 1x1 or 2x1, on a 2x1 Grid.
  const shapes: Shape[] = [
    [span(1, 1), span(2, 1)],
    [span(1, 1), span(2, 1)],
  ];
  const grid = { columns: 2, rows: 1 };

  it("keeps the preferred Spans with the default Score", () => {
    expect(pack(shapes, grid).spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(1, 1) },
        { tile: 1, col: 1, row: 0, span: span(1, 1) },
      ],
    ]);
  });

  it("chooses the largest Spans when the custom Score prefers them", () => {
    const largest = (placements: readonly Placement[]) => [
      -Math.max(...placements.map((p) => p.span.cols * p.span.rows)),
    ];

    const packing = pack(shapes, grid, { score: largest });

    expect(packing.spaces).toEqual([
      [{ tile: 0, col: 0, row: 0, span: span(2, 1) }],
      [{ tile: 1, col: 0, row: 0, span: span(2, 1) }],
    ]);
  });

  it("places every Tile even when the custom Score prefers empty Spaces", () => {
    const packing = pack(shapes, grid, { score: (placements) => [placements.length] });

    expect(packing.spaces.flat().map((p) => p.tile)).toEqual([0, 1]);
  });

  it("gives the custom Score the Placements of the Space and the Stage's Shapes", () => {
    const seen: unknown[] = [];
    pack(
      [[span(1, 1)]],
      { columns: 1, rows: 1 },
      {
        score: (placements, given) => {
          seen.push([placements, given]);
          return [0];
        },
      },
    );

    expect(seen).toEqual([[[{ tile: 0, col: 0, row: 0, span: span(1, 1) }], [[span(1, 1)]]]]);
  });
});
