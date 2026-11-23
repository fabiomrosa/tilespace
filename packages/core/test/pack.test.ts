import { describe, expect, it } from "vitest";
import { type Grid, type Placement, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

const holes = (space: Placement[], grid: Grid) =>
  grid.columns * grid.rows - space.reduce((area, p) => area + p.span.cols * p.span.rows, 0);

describe("pack", () => {
  it("fills the Space with no Hole when the Stage's order alone would leave one", () => {
    // In the Stage's order the 2x2 never fits after two 1x1 Tiles in the first row.
    const shapes: Shape[] = [[span(1, 1)], [span(1, 1)], [span(2, 2)]];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(1, 1) },
        { tile: 2, col: 1, row: 0, span: span(2, 2) },
        { tile: 1, col: 0, row: 1, span: span(1, 1) },
      ],
    ]);
  });

  it("clamps a Span to the Grid when it is wider or taller than the Grid", () => {
    const packing = pack([[span(3, 2)]], { columns: 2, rows: 1 });

    expect(packing.spaces[0]).toEqual([{ tile: 0, col: 0, row: 0, span: span(2, 1) }]);
  });

  it("leaves the fewest Holes possible when no filling is complete", () => {
    // Only 2x1 + 2x2 + 3x1 cover 9 Cells, and they always leave a 1x2 strip: 1 Hole at best.
    // The first filling the search reaches leaves 2.
    const grid = { columns: 3, rows: 3 };
    const shapes: Shape[] = [[span(1, 1)], [span(2, 1)], [span(2, 2)], [span(3, 1)]];

    const space = pack(shapes, grid).spaces[0] ?? [];

    expect(holes(space, grid)).toBe(1);
  });

  it("gives the same Packing when given the same input", () => {
    const grid = { columns: 4, rows: 3 };
    const shapes: Shape[] = [[span(2, 1)], [span(1, 2)], [span(2, 2)], [span(1, 1)], [span(3, 1)]];

    expect(pack(shapes, grid)).toEqual(pack(shapes, grid));
  });
});
