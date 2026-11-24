import { describe, expect, it } from "vitest";
import { type PackOptions, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

describe("pack order modes", () => {
  it("puts the Holes at the end of the flow when Holes and span ranks tie, moving Tiles if it must", () => {
    // Both fillings leave 1 Hole. In the Stage's order the second 2x1 drops below the first and
    // leaves the Hole mid-flow, at (2,0); the 1x1 moves up so the Hole is the last Cell (DEC-08).
    const shapes: Shape[] = [[span(2, 1)], [span(2, 1)], [span(1, 1)]];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(2, 1) },
        { tile: 2, col: 2, row: 0, span: span(1, 1) },
        { tile: 1, col: 0, row: 1, span: span(2, 1) },
      ],
    ]);
  });

  it("puts a 1x2 first so the Holes fall at the end of the flow", () => {
    const shapes: Shape[] = [[span(1, 1)], [span(1, 2)], [span(1, 1)]];

    const [space] = pack(shapes, { columns: 3, rows: 2 }).spaces;

    // Cells 0 to 3 taken, the Holes at 4 and 5: the end of the flow.
    const taken = (space ?? []).flatMap(({ col, row, span: { cols, rows } }) =>
      Array.from(
        { length: cols * rows },
        (_, k) => (row + Math.floor(k / cols)) * 3 + col + (k % cols),
      ),
    );
    expect(taken.toSorted((a, b) => a - b)).toEqual([0, 1, 2, 3]);
  });

  it("keeps the filling that moves Tiles least when the Holes fall alike", () => {
    const shapes: Shape[] = [[span(1, 1)], [span(1, 1)]];

    const packing = pack(shapes, { columns: 3, rows: 1 });

    expect(packing.spaces).toEqual([
      [
        { tile: 0, col: 0, row: 0, span: span(1, 1) },
        { tile: 1, col: 1, row: 0, span: span(1, 1) },
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
