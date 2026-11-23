import { describe, expect, it } from "vitest";
import { deriveGrid } from "../src/derive-grid.ts";

describe("deriveGrid", () => {
  it.each([
    ["cells that fit exactly", 300, 250, { minCellWidth: 100, cellAspect: 1, gap: 0 }, 3, 2],
    ["a gap between the cells", 320, 200, { minCellWidth: 100, cellAspect: 2, gap: 10 }, 3, 3],
    [
      "a width just short of one more cell",
      299,
      100,
      { minCellWidth: 100, cellAspect: 1, gap: 0 },
      2,
      1,
    ],
    [
      "a Stage of no width (hidden at mount)",
      0,
      100,
      { minCellWidth: 100, cellAspect: 1, gap: 0 },
      1,
      1,
    ],
    ["a Stage narrower than one cell", 50, 0, { minCellWidth: 100, cellAspect: 1, gap: 8 }, 1, 1],
  ])("derives the Grid for %s", (_, width, height, options, columns, rows) => {
    expect(deriveGrid({ width, height }, options)).toEqual({ columns, rows });
  });

  it("keeps a row that fits exactly despite floating point", () => {
    // 2 columns of 190 px at 0.75 make Cells 253.33 px tall: 3 rows and 2 gaps fill exactly 768 px.
    const fit = { minCellWidth: 190, cellAspect: 0.75, gap: 4 };
    expect(deriveGrid({ width: 384, height: 768 }, fit)).toEqual({ columns: 2, rows: 3 });
  });
});
