import {
  type Grid,
  type Packing,
  type PackOptions,
  pack,
  type Shape,
  validatePacking,
} from "@tilespace/core";
import { readShape, type ShapeOption, type Tile } from "./read-shape.ts";
import { validateOptions } from "./validate-options.ts";
import { createWriteLog } from "./write-log.ts";

/** How a Tilespace is mounted: the Grid, the gap in CSS pixels, the Shapes and the Packer's options. */
export type TilespaceOptions = PackOptions & {
  columns: number;
  rows: number;
  gap?: number;
  shape?: ShapeOption;
  /** Replaces the default Packer; its Packing is checked with `validatePacking`. */
  packer?: (shapes: readonly Shape[], grid: Grid) => Packing;
};

/** One mounted instance over a Stage. */
export type Tilespace = {
  /** Puts back every style and attribute the Tilespace wrote. */
  destroy(): void;
};

/**
 * Mounts a Tilespace over the Stage's children, as they are (DEC-06): packs their Shapes into the
 * Grid, places each Tile with CSS grid, and shows Space 0.
 */
export function createTilespace(stage: HTMLElement, options: TilespaceOptions): Tilespace {
  const { columns, rows, gap = 0, shape, packer, ...packOptions } = options;
  // Every check runs before the first write, so an invalid mount leaves the Stage as it was.
  validateOptions(stage, gap);
  const log = createWriteLog();
  const tiles = Array.from(stage.children) as Tile[];
  const shapes = tiles.map((tile, index) => readShape(tile, index, shape));
  const grid = { columns, rows };
  let packing: Packing;
  if (packer) {
    // Copies: a packer that changes what it gets cannot change the Shapes or Grid checked below.
    packing = packer(
      shapes.map((s) => s.map((span) => ({ ...span }))),
      { ...grid },
    );
    validatePacking(packing, shapes, grid);
  } else {
    packing = pack(shapes, grid, packOptions);
  }

  log.style(stage, "display", "grid");
  log.style(stage, "grid-template-columns", `repeat(${columns}, 1fr)`);
  log.style(stage, "grid-template-rows", `repeat(${rows}, 1fr)`);
  // Longhands only: a shorthand's undo would wipe the longhands the user set (Chrome expands it).
  log.style(stage, "row-gap", `${gap}px`);
  log.style(stage, "column-gap", `${gap}px`);
  log.style(stage, "position", "relative");
  log.style(stage, "overflow-x", "clip");
  log.style(stage, "overflow-y", "clip");
  packing.spaces.forEach((space, k) => {
    for (const { tile, col, row, span } of space) {
      const el = tiles[tile] as Tile;
      log.style(el, "grid-column-start", String(col + 1));
      log.style(el, "grid-column-end", `span ${span.cols}`);
      log.style(el, "grid-row-start", String(row + 1));
      log.style(el, "grid-row-end", `span ${span.rows}`);
      log.style(el, "--ts-cols", String(span.cols));
      log.style(el, "--ts-rows", String(span.rows));
      log.attribute(el, "data-ts-space", String(k));
      log.attribute(el, "data-ts-span", `${span.cols}x${span.rows}`);
      if (k === 0) log.attribute(el, "data-ts-current", "");
      else log.style(el, "visibility", "hidden");
    }
  });

  return { destroy: () => log.restore() };
}
