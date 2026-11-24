// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { type Axis, createTilespace } from "../src/index.ts";

/** Mounts Tiles of the given Shapes on a 2x2 Grid; returns each Tile's `col,row` and Span. */
const fill = (axis: Axis, shapes: string[], options = {}) => {
  const stage = document.createElement("div");
  for (const shape of shapes) {
    const tile = document.createElement("div");
    tile.setAttribute("data-ts-shape", shape);
    stage.append(tile);
  }
  createTilespace(stage, { columns: 2, rows: 2, axis, transition: false, ...options });
  return Array.from(stage.children as HTMLCollectionOf<HTMLElement>, (t) => [
    `${Number(t.style.gridColumnStart) - 1},${Number(t.style.gridRowStart) - 1}`,
    t.getAttribute("data-ts-span"),
  ]);
};

describe("the fill follows the axis (DEC-08)", () => {
  it("fills column by column on a horizontal axis, as on the Xbox dashboard", () => {
    expect(fill("horizontal", ["1x1", "1x1", "1x1", "1x1"]).map(([at]) => at)).toEqual([
      "0,0",
      "0,1",
      "1,0",
      "1,1",
    ]);
  });

  it("fills row by row on a vertical axis", () => {
    expect(fill("vertical", ["1x1", "1x1", "1x1", "1x1"]).map(([at]) => at)).toEqual([
      "0,0",
      "1,0",
      "0,1",
      "1,1",
    ]);
  });

  it("keeps each Tile's Span on either axis", () => {
    // A 2x1 first: on a horizontal axis it lies along the top, and the 1x1s fill the column below.
    expect(fill("horizontal", ["2x1", "1x1", "1x1"])).toEqual([
      ["0,0", "2x1"],
      ["0,1", "1x1"],
      ["1,1", "1x1"],
    ]);
    expect(fill("horizontal", ["1x2", "1x1", "1x1"])).toEqual([
      ["0,0", "1x2"],
      ["1,0", "1x1"],
      ["1,1", "1x1"],
    ]);
  });

  it("names the Grid's own sides in an error on a horizontal axis", () => {
    expect(() => fill("horizontal", ["1x1"], { columns: 0 })).toThrow(
      new Error("tilespace: grid.columns must be a positive integer, got 0"),
    );
  });
});
