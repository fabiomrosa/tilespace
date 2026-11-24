// @vitest-environment happy-dom
import type { Packing, Shape } from "@tilespace/core";
import { describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

const stageOf = (shapes: (string | null)[]): HTMLElement => {
  const stage = document.createElement("div");
  for (const shape of shapes) {
    const tile = document.createElement("div");
    if (shape !== null) tile.setAttribute("data-ts-shape", shape);
    stage.append(tile);
  }
  return stage;
};

const grid = { columns: 2, rows: 2 };

describe("createTilespace options", () => {
  it.each<[string, (string | null)[], Partial<TilespaceOptions>, string]>([
    ["a malformed data-ts-shape", [null, "2y1"], {}, 'tile 1 has data-ts-shape "2y1"'],
    ["a data-ts-shape of 0 Cells", ["1x1 0x1"], {}, 'tile 0 has data-ts-shape "1x1 0x1"'],
    ["an empty data-ts-shape", [" "], {}, 'tile 0 has data-ts-shape " "'],
    ["a Span with units", ["2x1px"], {}, 'tile 0 has data-ts-shape "2x1px"'],
    ["a Span after a letter", ["a2x1"], {}, 'tile 0 has data-ts-shape "a2x1"'],
    ["a Span of 0 rows", ["1x0"], {}, 'tile 0 has data-ts-shape "1x0"'],
    [
      "a label that is not a string",
      [null],
      { label: 3 as unknown as string },
      "label must be a non-empty string, got 3",
    ],
    ["an empty label", [null], { label: "" }, 'label must be a non-empty string, got ""'],
    ["a blank label", [null], { label: " " }, 'label must be a non-empty string, got " "'],
    [
      "a BigInt label",
      [null],
      { label: 1n as unknown as string },
      "label must be a non-empty string, got 1",
    ],
    [
      "a gap of Infinity",
      [null],
      { gap: Number.POSITIVE_INFINITY },
      "gap must be a finite number of pixels ≥ 0, got Infinity",
    ],
    [
      "a minCellWidth of 0",
      [null],
      { minCellWidth: 0 },
      "minCellWidth must be a finite number of pixels > 0, got 0",
    ],
    [
      "a cellAspect below 0",
      [null],
      { minCellWidth: 100, cellAspect: -1 },
      "cellAspect must be a finite number > 0, got -1",
    ],
    [
      "a cellAspect of Infinity",
      [null],
      { minCellWidth: 100, cellAspect: Number.POSITIVE_INFINITY },
      "cellAspect must be a finite number > 0, got Infinity",
    ],
    ["a negative gap", [null], { gap: -1 }, "gap must be a finite number of pixels ≥ 0, got -1"],
    [
      "a negative spaceGap",
      [null],
      { spaceGap: -1 },
      "spaceGap must be a finite number of pixels ≥ 0, got -1",
    ],
    [
      "a spaceGap of NaN",
      [null],
      { spaceGap: Number.NaN },
      "spaceGap must be a finite number of pixels ≥ 0, got NaN",
    ],
    [
      "a gap of NaN",
      [null],
      { gap: Number.NaN },
      "gap must be a finite number of pixels ≥ 0, got NaN",
    ],
    [
      "a transition that is not a function or false",
      [null],
      { transition: true as unknown as false },
      "transition must be a function or false, got true",
    ],
    [
      "a Grid of 0 columns",
      [null],
      { columns: 0 },
      "grid.columns must be a positive integer, got 0",
    ],
  ])("throws for %s and writes nothing", (_, shapes, options, message) => {
    const stage = stageOf(shapes);
    const before = stage.outerHTML;

    expect(() => createTilespace(stage, { ...grid, ...options })).toThrow(
      new Error(
        message.startsWith("tile")
          ? `tilespace: ${message}, not Spans like "2x1 1x1"`
          : `tilespace: ${message}`,
      ),
    );
    expect(stage.outerHTML).toBe(before);
  });

  it("throws when the Stage is missing or not an element", () => {
    const missing = null as unknown as HTMLElement;
    expect(() => createTilespace(missing, grid)).toThrow(
      new Error("tilespace: stage must be an element, got null"),
    );
    const plain = {} as unknown as HTMLElement;
    expect(() => createTilespace(plain, grid)).toThrow(
      new Error("tilespace: stage must be an element, got [object Object]"),
    );
  });

  it("checks the Grid with a custom packer too, before writing", () => {
    const stage = stageOf([null]);
    const before = stage.outerHTML;
    const packer = (): Packing => ({
      spaces: [[{ tile: 0, col: 0, row: 0, span: { cols: 1, rows: 1 } }]],
    });

    expect(() => createTilespace(stage, { columns: 0, rows: 1, packer })).toThrow(
      new Error("tilespace: grid.columns must be a positive integer, got 0"),
    );
    expect(stage.outerHTML).toBe(before);
  });

  it("gives a custom packer copies, so changing them changes no Tile or later mount", () => {
    const vandal = (shapes: readonly Shape[], g: { columns: number; rows: number }): Packing => {
      (shapes[0]?.[0] as { cols: number }).cols = 2;
      g.columns = 5;
      return { spaces: [[{ tile: 0, col: 0, row: 0, span: { cols: 1, rows: 1 } }]] };
    };
    const stage = stageOf([null]);

    createTilespace(stage, { columns: 1, rows: 1, packer: vandal });
    const later = stageOf([null]);
    createTilespace(later, { columns: 2, rows: 1 });

    expect(stage.firstElementChild?.getAttribute("data-ts-span")).toBe("1x1");
    expect(later.firstElementChild?.getAttribute("data-ts-span")).toBe("1x1");
  });

  it("throws for a child that is neither an HTML nor an SVG element", () => {
    const stage = stageOf([null]);
    stage.append(document.createElementNS("http://example.com/x", "x"));
    const before = stage.outerHTML;

    expect(() => createTilespace(stage, grid)).toThrow(
      new Error("tilespace: tile 1 is <x>, not an HTML or SVG element"),
    );
    expect(stage.outerHTML).toBe(before);
  });

  it("places the Tiles with a custom packer", () => {
    const stage = stageOf([null, null]);
    const calls: [readonly Shape[], unknown][] = [];
    const reversed = (shapes: readonly Shape[], g: typeof grid): Packing => {
      calls.push([shapes, g]);
      return {
        spaces: [
          [{ tile: 1, col: 0, row: 0, span: { cols: 1, rows: 1 } }],
          [{ tile: 0, col: 1, row: 1, span: { cols: 1, rows: 1 } }],
        ],
      };
    };

    createTilespace(stage, { ...grid, packer: reversed });

    const [first, second] = Array.from(stage.children) as HTMLElement[];
    expect(calls).toEqual([[[[{ cols: 1, rows: 1 }], [{ cols: 1, rows: 1 }]], grid]]);
    expect(second?.getAttribute("data-ts-space")).toBe("0");
    expect(first?.getAttribute("data-ts-space")).toBe("1");
    expect(first?.style.gridColumnStart).toBe("2");
  });

  it("throws validatePacking's message for a broken custom packer and writes nothing", () => {
    const stage = stageOf([null, null]);
    const before = stage.outerHTML;
    const dropsOne = (): Packing => ({
      spaces: [[{ tile: 0, col: 0, row: 0, span: { cols: 1, rows: 1 } }]],
    });

    expect(() => createTilespace(stage, { ...grid, packer: dropsOne })).toThrow(
      new Error("tilespace: packing leaves tile 1 unplaced"),
    );
    expect(stage.outerHTML).toBe(before);
  });
});
