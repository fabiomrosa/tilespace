import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type Packing, pack, type Shape, validatePacking } from "../src/index.ts";

const span = (cols: number, rows: number) => ({ cols, rows });
const shapes: Shape[] = [[span(2, 1)], [span(1, 1), span(3, 3)]];
const grid = { columns: 2, rows: 2 };
const at = (tile: number, col: number, row: number, cols: number, rows: number) => ({
  tile,
  col,
  row,
  span: span(cols, rows),
});

describe("validatePacking", () => {
  it("accepts every Packing pack returns", () => {
    const spanArb = fc.record({
      cols: fc.integer({ min: 1, max: 3 }),
      rows: fc.integer({ min: 1, max: 3 }),
    });
    const gridArb = fc.record({
      columns: fc.integer({ min: 1, max: 4 }),
      rows: fc.integer({ min: 1, max: 4 }),
    });
    fc.assert(
      fc.property(
        fc.array(fc.array(spanArb, { minLength: 1, maxLength: 3 }), { maxLength: 8 }),
        gridArb,
        (given, g) => {
          validatePacking(pack(given, g), given, g);
        },
      ),
      { numRuns: 300 },
    );
  });

  it("accepts a Span clamped to the Grid", () => {
    validatePacking({ spaces: [[at(0, 0, 0, 2, 1)], [at(1, 0, 0, 2, 2)]] }, shapes, grid);
  });

  it.each<[string, Packing, string]>([
    ["a Tile twice", { spaces: [[at(0, 0, 0, 2, 1)], [at(0, 0, 0, 2, 1)]] }, "places tile 0 twice"],
    ["a Tile missing", { spaces: [[at(0, 0, 0, 2, 1)]] }, "leaves tile 1 unplaced"],
    [
      "an unknown Tile",
      { spaces: [[at(0, 0, 0, 2, 1), at(1, 0, 1, 1, 1), at(2, 1, 1, 1, 1)]] },
      "places unknown tile 2",
    ],
    [
      "a Span not in the Shape",
      { spaces: [[at(0, 0, 0, 1, 1), at(1, 0, 1, 1, 1)]] },
      "gives tile 0 the Span 1x1, not in its Shape",
    ],
    [
      "a Tile out of the Grid",
      { spaces: [[at(0, 1, 0, 2, 1), at(1, 0, 1, 1, 1)]] },
      "places tile 0 out of the Grid at col 1, row 0",
    ],
    [
      "two Tiles overlapping",
      { spaces: [[at(0, 0, 0, 2, 1), at(1, 1, 0, 1, 1)]] },
      "overlaps tiles 1 and 0 in space 0 at col 1, row 0",
    ],
  ])("rejects %s", (_, packing, message) => {
    expect(() => validatePacking(packing, shapes, grid)).toThrow(
      new Error(`tilespace: packing ${message}`),
    );
  });
});
