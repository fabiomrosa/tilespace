import type { Shape } from "@tilespace/core";

/** One of the Stage's children: an HTML or an SVG element. */
export type Tile = HTMLElement | SVGElement;

/** Gives a Tile its Shape when it has no `data-ts-shape`; `undefined` falls back to `1x1`. */
export type ShapeOption = (tile: Tile, index: number) => Shape | undefined;

const ONE_BY_ONE: Shape = [{ cols: 1, rows: 1 }];

/** A Tile's Shape (DEC-07): its `data-ts-shape` (`"2x2 2x1 1x1"`), else the option, else `1x1`. */
export function readShape(tile: Tile, index: number, option?: ShapeOption): Shape {
  const attribute = tile.getAttribute("data-ts-shape");
  if (attribute !== null) {
    return attribute
      .trim()
      .split(/\s+/)
      .map((span) => {
        const [cols, rows] = span.split("x").map(Number);
        return { cols: cols as number, rows: rows as number };
      });
  }
  return option?.(tile, index) ?? ONE_BY_ONE;
}
