// @vitest-environment happy-dom
import { pack } from "@tilespace/core";
import { describe, expect, it } from "vitest";
import { createTilespace } from "../src/index.ts";

/** A Stage with one child per Shape attribute (`null` leaves the attribute out). */
const stageOf = (shapes: (string | null)[]): HTMLElement => {
  const stage = document.createElement("div");
  for (const shape of shapes) {
    const tile = document.createElement("div");
    if (shape !== null) tile.setAttribute("data-ts-shape", shape);
    stage.append(tile);
  }
  document.body.append(stage);
  return stage;
};

const tilesOf = (stage: HTMLElement) => Array.from(stage.children) as HTMLElement[];

describe("createTilespace", () => {
  it("places every Tile where pack puts it and shows only Space 0", () => {
    const stage = stageOf(["2x2", "1x1", "1x1", "2x1 1x1", "1x1"]);
    const grid = { columns: 3, rows: 2 };
    const shapes = [
      [{ cols: 2, rows: 2 }],
      [{ cols: 1, rows: 1 }],
      [{ cols: 1, rows: 1 }],
      [
        { cols: 2, rows: 1 },
        { cols: 1, rows: 1 },
      ],
      [{ cols: 1, rows: 1 }],
    ];
    const packing = pack(shapes, grid);

    createTilespace(stage, { ...grid, gap: 8 });

    expect(stage.style.display).toBe("grid");
    expect(stage.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(stage.style.gridTemplateRows).toBe("repeat(2, 1fr)");
    // Longhands only, so destroy() never wipes a longhand the user set (Chrome expands shorthands).
    expect(stage.style.rowGap).toBe("8px");
    expect(stage.style.columnGap).toBe("8px");
    expect(stage.style.position).toBe("relative");
    expect(stage.style.overflowX).toBe("clip");
    expect(stage.style.overflowY).toBe("clip");
    const tiles = tilesOf(stage);
    packing.spaces.forEach((space, k) => {
      for (const { tile, col, row, span } of space) {
        const el = tiles[tile] as HTMLElement;
        expect(el.style.gridColumnStart).toBe(String(col + 1));
        expect(el.style.gridColumnEnd).toBe(`span ${span.cols}`);
        expect(el.style.gridRowStart).toBe(String(row + 1));
        expect(el.style.gridRowEnd).toBe(`span ${span.rows}`);
        expect(el.getAttribute("data-ts-space")).toBe(String(k));
        expect(el.getAttribute("data-ts-span")).toBe(`${span.cols}x${span.rows}`);
        expect(el.style.getPropertyValue("--ts-cols")).toBe(String(span.cols));
        expect(el.style.getPropertyValue("--ts-rows")).toBe(String(span.rows));
        expect(el.style.visibility).toBe(k === 0 ? "" : "hidden");
        expect(el.hasAttribute("data-ts-current")).toBe(k === 0);
      }
    });
    expect(packing.spaces.length).toBeGreaterThan(1);
  });

  it("reads a Shape from data-ts-shape, then the shape option, then 1x1", () => {
    const stage = stageOf(["2x1", null, null]);
    const tiles = tilesOf(stage);

    createTilespace(stage, {
      columns: 4,
      rows: 1,
      shape: (_, index) => (index === 1 ? [{ cols: 2, rows: 1 }] : undefined),
    });

    expect(tiles.map((t) => t.getAttribute("data-ts-span"))).toEqual(["2x1", "2x1", "1x1"]);
    // The attribute wins over the option.
    const other = stageOf(["1x1"]);
    createTilespace(other, { columns: 2, rows: 1, shape: () => [{ cols: 2, rows: 1 }] });
    expect(tilesOf(other)[0]?.getAttribute("data-ts-span")).toBe("1x1");
  });

  it("passes the Packer options through to pack", () => {
    const stage = stageOf(["1x1", "1x1", "2x2"]);
    const shapes = [[{ cols: 1, rows: 1 }], [{ cols: 1, rows: 1 }], [{ cols: 2, rows: 2 }]];
    const options = { order: "strict" as const, nodeBudget: 50 };
    const strict = pack(shapes, { columns: 3, rows: 2 }, options);
    expect(strict).not.toEqual(pack(shapes, { columns: 3, rows: 2 }));

    createTilespace(stage, { columns: 3, rows: 2, ...options });

    const tiles = tilesOf(stage);
    strict.spaces.forEach((space, k) => {
      for (const { tile } of space)
        expect(tiles[tile]?.getAttribute("data-ts-space")).toBe(String(k));
    });
  });

  it("restores the Stage and every Tile on destroy, keeping the same nodes", () => {
    const stage = stageOf(["2x2", "1x1", "1x1 2x1", null, "3x3"]);
    stage.style.setProperty("gap", "3px", "important");
    const first = tilesOf(stage)[0] as HTMLElement;
    first.setAttribute("data-ts-space", "mine");
    first.style.visibility = "collapse";
    first.style.setProperty("--ts-cols", "9");
    const nodes = tilesOf(stage);
    const before = stage.outerHTML;

    const tilespace = createTilespace(stage, { columns: 3, rows: 2 });
    expect(stage.outerHTML).not.toBe(before);
    tilespace.destroy();

    expect(stage.outerHTML).toBe(before);
    expect(tilesOf(stage)).toEqual(nodes);
    tilesOf(stage).forEach((tile, i) => {
      expect(tile).toBe(nodes[i]);
    });
  });
});
