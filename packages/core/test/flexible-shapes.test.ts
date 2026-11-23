import { describe, expect, it } from "vitest";
import { pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });

describe("pack with flexible Shapes", () => {
  it("takes a later Span of a Tile's Shape when only that leaves no Hole", () => {
    // As 2x2 the first Tile leaves a 1x2 strip that one 1x1 cannot fill; as 1x1 the Space is full.
    const shapes: Shape[] = [[span(2, 2), span(1, 1)], [span(2, 1)], [span(2, 1)], [span(1, 1)]];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces[0]).toEqual([
      { tile: 0, col: 0, row: 0, span: span(1, 1) },
      { tile: 1, col: 1, row: 0, span: span(2, 1) },
      { tile: 2, col: 0, row: 1, span: span(2, 1) },
      { tile: 3, col: 2, row: 1, span: span(1, 1) },
    ]);
  });

  it("keeps the lower span rank when two fillings leave the same Holes", () => {
    // Both fillings leave 2 Holes; the search reaches the second Tile as 1x2 (rank 1) first.
    const shapes: Shape[] = [[span(2, 1)], [span(2, 1), span(1, 2)]];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces[0]).toEqual([
      { tile: 0, col: 0, row: 0, span: span(2, 1) },
      { tile: 1, col: 0, row: 1, span: span(2, 1) },
    ]);
  });

  it("finds the fewest Holes when a Shape lists a small Span before a larger one", () => {
    // A bound on the smallest Spans cut this branch: as 2x1 the first Tile leaves 1 Hole, not 2.
    const shapes: Shape[] = [
      [span(1, 1), span(1, 2), span(2, 1)],
      [span(3, 1), span(1, 1)],
    ];

    const packing = pack(shapes, { columns: 3, rows: 2 });

    expect(packing.spaces[0]).toEqual([
      { tile: 0, col: 0, row: 0, span: span(2, 1) },
      { tile: 1, col: 0, row: 1, span: span(3, 1) },
    ]);
  });
});
