import { describe, expect, it } from "vitest";
import { type Grid, pack, type Shape } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });
const grid: Grid = { columns: 3, rows: 2 };

describe("pack input", () => {
  it.each([
    [{ columns: 0, rows: 2 }, "tilespace: grid.columns must be a positive integer, got 0"],
    [{ columns: 1.5, rows: 2 }, "tilespace: grid.columns must be a positive integer, got 1.5"],
    [{ columns: 3, rows: -1 }, "tilespace: grid.rows must be a positive integer, got -1"],
    [{ columns: 3, rows: Number.NaN }, "tilespace: grid.rows must be a positive integer, got NaN"],
  ])("throws when the Grid is %o", (badGrid, message) => {
    expect(() => pack([[span(1, 1)]], badGrid)).toThrow(new Error(message));
  });

  it("throws when a Shape is empty", () => {
    expect(() => pack([[span(1, 1)], []], grid)).toThrow(
      new Error("tilespace: shapes[1] must have at least one Span"),
    );
  });

  it.each([
    [[[span(0, 1)]], "tilespace: shapes[0][0].cols must be a positive integer, got 0"],
    [
      [[span(1, 1), span(2, 0.5)]],
      "tilespace: shapes[0][1].rows must be a positive integer, got 0.5",
    ],
  ])("throws when a Span is not whole Cells (%#)", (shapes: Shape[], message) => {
    expect(() => pack(shapes, grid)).toThrow(new Error(message));
  });

  it("throws when holes is neither 'end' nor 'order'", () => {
    expect(() => pack([[span(1, 1)]], grid, { holes: "spread" as "end" })).toThrow(
      new Error("tilespace: holes must be 'end' or 'order', got spread"),
    );
  });

  it("packs when the Grid is wider than 32 columns", () => {
    const space = pack([[span(40, 1)], [span(39, 1)], [span(1, 1)]], { columns: 40, rows: 2 })
      .spaces[0];

    expect(space).toEqual([
      { tile: 0, col: 0, row: 0, span: span(40, 1) },
      { tile: 1, col: 0, row: 1, span: span(39, 1) },
      { tile: 2, col: 39, row: 1, span: span(1, 1) },
    ]);
  });
});
