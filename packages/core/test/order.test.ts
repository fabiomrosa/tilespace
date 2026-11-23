import { describe, expect, it } from "vitest";
import { type PackOptions, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

describe("pack order modes", () => {
  it("keeps the filling that moves Tiles least in fill mode when Holes and span ranks tie", () => {
    // Both fillings leave 1 Hole; the search reaches the 1x1 ahead of the second 2x1 first.
    const shapes: Shape[] = [[span(2, 1)], [span(2, 1)], [span(1, 1)]];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(2, 1) },
        { tile: 1, col: 0, row: 1, span: span(2, 1) },
        { tile: 2, col: 2, row: 1, span: span(1, 1) },
      ],
    ]);
  });

  it("keeps the Stage's order in strict mode even when fill would leave fewer Holes", () => {
    // In fill mode the 2x2 moves ahead of the second 1x1 and the first Space has no Hole.
    const shapes: Shape[] = [[span(1, 1)], [span(1, 1)], [span(2, 2)]];

    const packing = pack(shapes, { columns: 3, rows: 2 }, { order: "strict" });

    expect(packing.spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(1, 1) },
        { tile: 1, col: 1, row: 0, span: span(1, 1) },
      ],
      [{ tile: 2, col: 0, row: 0, span: span(2, 2) }],
    ]);
  });

  it("throws when the order is neither fill nor strict", () => {
    const options = { order: "random" } as unknown as PackOptions;

    expect(() => pack([[span(1, 1)]], { columns: 1, rows: 1 }, options)).toThrow(
      new Error("tilespace: order must be 'fill' or 'strict', got random"),
    );
  });
});
