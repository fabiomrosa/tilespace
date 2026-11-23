import {
  type Grid,
  type Packing,
  type PackOptions,
  pack,
  type Shape,
  validatePacking,
} from "@tilespace/core";
import { createEmitter } from "./emitter.ts";
import { readShape, type ShapeOption, type Tile } from "./read-shape.ts";
import { validateOptions } from "./validate-options.ts";
import { createWriteLog } from "./write-log.ts";

/** How a Tilespace is mounted: the Grid, the gap in CSS pixels, the Shapes and the Packer's options. */
export type TilespaceOptions = PackOptions & {
  columns: number;
  rows: number;
  gap?: number;
  shape?: ShapeOption;
  /** `next` from the last Space goes to the first, and `prev` from the first to the last. */
  loop?: boolean;
  /** Replaces the default Packer; its Packing is checked with `validatePacking`. */
  packer?: (shapes: readonly Shape[], grid: Grid) => Packing;
};

/** The events a Tilespace emits, with what each listener receives. */
export type TilespaceEvents = {
  /** The Current space changed. */
  change: { current: number };
};

/** One mounted instance over a Stage. */
export type Tilespace = {
  /** The Current space. */
  readonly current: number;
  next(): void;
  prev(): void;
  goTo(space: number): void;
  on<E extends keyof TilespaceEvents>(
    event: E,
    listener: (detail: TilespaceEvents[E]) => void,
  ): () => void;
  /** Puts back every style and attribute the Tilespace wrote and removes its listeners. */
  destroy(): void;
};

/**
 * Mounts a Tilespace over the Stage's children, as they are (DEC-06): packs their Shapes into the
 * Grid, places each Tile with CSS grid, and shows Space 0.
 */
export function createTilespace(stage: HTMLElement, options: TilespaceOptions): Tilespace {
  const { columns, rows, gap = 0, shape, packer, loop = false, ...packOptions } = options;
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
    }
  });

  const events = createEmitter<TilespaceEvents>();
  const last = packing.spaces.length - 1;
  let current = 0;
  let destroyed = false;
  /** Shows one Space's Tiles and hides the others': an instant swap, no Transition. */
  const show = (space: number) => {
    packing.spaces.forEach((placements, k) => {
      for (const { tile } of placements) {
        const el = tiles[tile] as Tile;
        if (k === space) {
          log.resetStyle(el, "visibility");
          log.attribute(el, "data-ts-current", "");
        } else {
          log.style(el, "visibility", "hidden");
          log.resetAttribute(el, "data-ts-current");
        }
      }
    });
  };
  const move = (space: number) => {
    if (destroyed || space === current || space < 0) return;
    current = space;
    show(space);
    events.emit("change", { current });
  };
  show(0);

  return {
    get current() {
      return current;
    },
    next: () => move(current < last ? current + 1 : loop ? 0 : current),
    prev: () => move(current > 0 ? current - 1 : loop ? last : current),
    goTo(space) {
      if (last < 0) throw new Error("tilespace: goTo needs a Space, but the Stage has no Tiles");
      if (!Number.isInteger(space) || space < 0 || space > last) {
        throw new Error(`tilespace: goTo needs a Space from 0 to ${last}, got ${space}`);
      }
      move(space);
    },
    on: (event, listener) => events.on(event, listener),
    destroy() {
      destroyed = true;
      events.clear();
      log.restore();
    },
  };
}
