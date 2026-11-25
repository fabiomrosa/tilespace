import {
  type Grid,
  type Packing,
  type PackOptions,
  type Placement,
  pack,
  type Shape,
  type Span,
  validateGrid,
  validatePacking,
  validateShapes,
} from "@tilespace/core";
import { type Axis, defaultTransition, type TransitionContext } from "./default-transition.ts";
import { deriveGrid, type GridFit } from "./derive-grid.ts";
import { type Grip, listenDrag } from "./drag.ts";
import { createEmitter } from "./emitter.ts";
import { listenKeys } from "./keyboard.ts";
import { readShape, type ShapeOption, type Tile } from "./read-shape.ts";
import { validateOptions } from "./validate-options.ts";
import { listenWheel } from "./wheel.ts";
import { createWriteLog } from "./write-log.ts";

/**
 * How a Tilespace is mounted: the Grid, fixed (`columns`, `rows`) or derived from the Stage's size
 * (`minCellWidth`, `cellAspect`, which win over `columns` and `rows`), the gap in CSS pixels, the
 * Shapes and the Packer's options.
 */
export type TilespaceOptions = PackOptions & {
  columns?: number;
  rows?: number;
  /**
   * The narrowest a Cell may be, in CSS pixels: the Grid then follows the Stage's size. The Stage's
   * height must not come from its content (set it, or stretch the Stage), or the rows chase it.
   */
  minCellWidth?: number;
  /** A Cell's width divided by its height, for a derived Grid; 1 by default. */
  cellAspect?: number;
  gap?: number;
  /**
   * The distance between two Spaces, in CSS pixels: where a neighbour rests with `peek`, and how
   * far beyond the Stage the default slide travels. `gap` by default.
   */
  spaceGap?: number;
  shape?: ShapeOption;
  /** The arrow keys and the default slide: `horizontal` (default) or `vertical`. */
  axis?: Axis;
  /**
   * The Spaces before and after the Current one show beside the Stage, one Stage size plus the `spaceGap`
   * away, `inert`: the Stage overflows, and a container of the user's clips how much shows.
   */
  peek?: boolean;
  /**
   * The Stage's accessible name, `aria-label` (`"Tiles"` by default); the Stage is also a region
   * with `aria-roledescription="carousel"` (DEC-14). An attribute the user set is kept.
   */
  label?: string;
  /** `next` from the last Space goes to the first, and `prev` from the first to the last. */
  loop?: boolean;
  /**
   * Replaces the default Transition (DEC-10): it returns Animations that are not finished, and the
   * engine cancels them at their end. `false` swaps at once.
   */
  transition?: false | ((context: TransitionContext) => Animation[]);
  /** Replaces the default Packer; its Packing is checked with `validatePacking`. */
  packer?: (shapes: readonly Shape[], grid: Grid) => Packing;
};

/** The events a Tilespace emits, with what each listener receives. */
export type TilespaceEvents = {
  /**
   * The Current space changed. `direction`: 1 towards the next Space (its cards come in from the
   * right, or from below), -1 towards the previous one, at the loop's wrap too; on a repack, the
   * sign of the change.
   */
  change: { current: number; direction: 1 | -1 };
  /** The Tiles were packed again (a new Grid, or children added or removed): the number of Spaces. */
  pack: { spaces: number };
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
 * Grid, places each Tile with CSS grid, and shows Space 0. A derived Grid follows the Stage's size,
 * and added or removed children repack.
 */
export function createTilespace(stage: HTMLElement, options: TilespaceOptions): Tilespace {
  const {
    columns,
    rows,
    minCellWidth,
    cellAspect = 1,
    gap = 0,
    spaceGap = gap,
    shape,
    packer,
    loop = false,
    transition = defaultTransition,
    axis = "horizontal",
    peek = false,
    label = "Tiles",
    ...packOptions
  } = options;
  const fit: GridFit | undefined =
    minCellWidth === undefined ? undefined : { minCellWidth, cellAspect, gap };
  // Every check runs before the first write, so an invalid mount leaves the Stage as it was.
  validateOptions(stage, gap, fit, transition, axis, peek, spaceGap, label);
  const log = createWriteLog();
  let tiles = Array.from(stage.children) as Tile[];
  const shapesOf = (children: Tile[]) =>
    children.map((tile, index) => readShape(tile, index, shape));
  const gridNow = (): Grid =>
    fit ? deriveGrid(contentSize(stage), fit) : ({ columns, rows } as Grid);
  const packFor = (grid: Grid, shapes: Shape[]): Packing => {
    if (!packer) return packAlong(axis, shapes, grid, packOptions);
    // Copies: a packer that changes what it gets cannot change the Shapes or Grid checked below.
    const packing = packer(
      shapes.map((s) => s.map((span) => ({ ...span }))),
      { ...grid },
    );
    validatePacking(packing, shapes, grid);
    return packing;
  };
  let grid = gridNow();
  let packing = packFor(grid, shapesOf(tiles));

  /** Writes the Grid and every Tile's Placement. */
  const place = () => {
    log.style(stage, "grid-template-columns", `repeat(${grid.columns}, 1fr)`);
    log.style(stage, "grid-template-rows", `repeat(${grid.rows}, 1fr)`);
    packing.spaces.forEach((space, k) => {
      for (const { tile, col, row, span } of space) {
        const el = tiles[tile] as Tile;
        // A Tile that left the Stage (and a repack that then failed) is the user's again.
        if (el.parentNode !== stage) continue;
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
  };
  const last = () => packing.spaces.length - 1;
  const size = () => (axis === "horizontal" ? stage.clientWidth : stage.clientHeight);
  /** How far a neighbouring Space rests from the Stage: read before any write of the same task. */
  let reach = peek ? size() + spaceGap : 0;
  const at = (distance: number) =>
    axis === "horizontal" ? `${distance}px 0px` : `0px ${distance}px`;
  /**
   * Shows one Space's Tiles and hides the others', `inert`; with `peek`, its neighbours rest beside
   * it, `inert` too.
   */
  const show = (space: number) => {
    const before = space > 0 ? space - 1 : loop ? last() : -1;
    const after = space < last() ? space + 1 : loop ? 0 : -1;
    packing.spaces.forEach((placements, k) => {
      const side = !peek || k === space ? 0 : k === after ? 1 : k === before ? -1 : 0;
      for (const { tile } of placements) {
        const el = tiles[tile] as Tile;
        if (el.parentNode !== stage) continue;
        if (k === space || side !== 0) log.resetStyle(el, "visibility");
        else log.style(el, "visibility", "hidden");
        if (k === space) log.attribute(el, "data-ts-current", "");
        else log.resetAttribute(el, "data-ts-current");
        if (side !== 0) log.style(el, "translate", at(side * reach));
        else log.resetStyle(el, "translate");
        if (k === space) log.resetAttribute(el, "inert");
        else log.attribute(el, "inert", "");
      }
    });
  };

  // A carousel region (DEC-14), named by the user's own label if they gave one: an empty one would
  // leave the region with no name.
  const named = !!stage.getAttribute("aria-label")?.trim() || stage.hasAttribute("aria-labelledby");
  if (!stage.hasAttribute("role")) log.attribute(stage, "role", "region");
  if (!stage.hasAttribute("aria-roledescription")) {
    log.attribute(stage, "aria-roledescription", "carousel");
  }
  if (!named) log.attribute(stage, "aria-label", label);
  log.style(stage, "display", "grid");
  // Longhands only: a shorthand's undo would wipe the longhands the user set (Chrome expands it).
  log.style(stage, "row-gap", `${gap}px`);
  log.style(stage, "column-gap", `${gap}px`);
  log.style(stage, "position", "relative");
  log.style(stage, "overflow-x", peek ? "visible" : "clip");
  log.style(stage, "overflow-y", peek ? "visible" : "clip");
  // The Drag takes the axis; the page keeps the other one, and pinch zoom.
  log.style(stage, "touch-action", `${axis === "horizontal" ? "pan-y" : "pan-x"} pinch-zoom`);
  place();
  show(0);

  const events = createEmitter<TilespaceEvents>();
  let current = 0;
  let destroyed = false;
  /** A Transition between two Spaces; `space` is the one shown when it is settled. */
  /** `focus`: the element focused in a leaving Tile, focused again if the move is cancelled. */
  type Run = {
    animations: Animation[];
    space: number;
    to: number;
    direction: 1 | -1;
    focus?: HTMLOrSVGElement;
    error?: unknown;
  };
  let running: Run | undefined;
  /** Ends the running Transition at once: its Animations are cancelled and its Space shown. */
  const settle = () => {
    if (!running) return;
    const { animations, space, to, focus } = running;
    running = undefined;
    for (const animation of animations) animation.cancel();
    show(space);
    // Cancelled: `inert` blurred the focus out of the Space that stays. Unless the user has put it
    // somewhere since, it goes back.
    const now = stage.ownerDocument.activeElement;
    if (focus && space !== to && (now === null || now === stage.ownerDocument.body)) {
      focus.focus({ preventScroll: true });
    }
  };
  // Copies: a Transition that changes its Placements cannot change the Packing.
  const tilesIn = (space: number) =>
    (packing.spaces[space] ?? []).flatMap((placement) => {
      const tile = tiles[placement.tile] as Tile;
      const copy = { ...placement, span: { ...placement.span } };
      return tile.parentNode === stage ? [{ tile, placement: copy }] : [];
    });
  /**
   * Builds the Transition to a Space, with both Spaces showing, and leaves it undecided: `end`
   * commits or cancels it. A Transition that throws or returns something else is kept as `error`.
   */
  const begin = (to: number, direction: 1 | -1): Run => {
    // Read before any write, so the move forces no layout.
    const [width, height] = [stage.clientWidth, stage.clientHeight];
    if (peek) reach = (axis === "horizontal" ? width : height) + spaceGap;
    settle();
    const leaving = tilesIn(current);
    const entering = tilesIn(to);
    // Only the entering Tiles can be reached while it runs; `show` puts back the cancelled ones.
    const active = stage.ownerDocument.activeElement;
    // The element itself, inside any shadow roots: their host can't take the focus back.
    let focus = leaving.some(({ tile }) => tile.contains(active)) ? active : null;
    while (focus?.shadowRoot?.activeElement) focus = focus.shadowRoot.activeElement;
    for (const { tile } of leaving) log.attribute(tile, "inert", "");
    for (const { tile } of entering) {
      log.resetStyle(tile, "visibility");
      // A peeking Space comes into the Stage; the Transition moves it from there.
      log.resetStyle(tile, "translate");
      log.resetAttribute(tile, "inert");
    }
    // With `peek`, the Space beyond the entering one rests where it will be a neighbour, and the
    // one behind the leaving one where it was: the Transition moves them with the block. Any
    // other Space hides while it runs.
    const past = (space: number, d: 1 | -1) =>
      d === 1
        ? space < last()
          ? space + 1
          : loop
            ? 0
            : -1
        : space > 0
          ? space - 1
          : loop
            ? last()
            : -1;
    const aheadOf = peek ? past(to, direction) : -1;
    const ahead = aheadOf === current || aheadOf === to ? -1 : aheadOf;
    const behindOf = peek ? past(current, -direction as 1 | -1) : -1;
    const behind = behindOf === to || behindOf === ahead || behindOf === current ? -1 : behindOf;
    if (peek) {
      packing.spaces.forEach((placements, k) => {
        if (k === current || k === to) return;
        const side = k === ahead ? direction : k === behind ? -direction : 0;
        for (const { tile } of placements) {
          const el = tiles[tile] as Tile;
          if (el.parentNode !== stage) continue;
          if (side === 0) {
            log.style(el, "visibility", "hidden");
            log.resetStyle(el, "translate");
          } else {
            log.resetStyle(el, "visibility");
            log.style(el, "translate", at(side * reach));
            log.attribute(el, "inert", "");
          }
        }
      });
    }
    const run: Run = { animations: [], space: current, to, direction };
    if (focus && "focus" in focus) run.focus = focus as Element & HTMLOrSVGElement;
    running = run;
    try {
      if (transition) {
        const context = {
          leaving,
          entering,
          ahead: ahead < 0 ? [] : tilesIn(ahead),
          behind: behind < 0 ? [] : tilesIn(behind),
          direction,
          axis,
          grid: { ...grid },
          width,
          height,
          spaceGap,
          peek,
        };
        const out = transition(context);
        if (!Array.isArray(out) || !out.every((a) => typeof a?.cancel === "function")) {
          throw new Error(`tilespace: transition must return an array of Animations, got ${out}`);
        }
        run.animations = out;
        // A Drag's Run can be cancelled before `end` watches it.
        for (const animation of out) animation.finished.catch(() => {});
      }
    } catch (error) {
      run.error = error;
    }
    // Nothing to watch: the entering Space stays hidden until the Run ends.
    if (run.animations.length === 0) show(run.space);
    return run;
  };
  /**
   * Commits a Run (the Current space becomes its target, and `change` fires) or cancels it, playing
   * it back. With no Animation it ends at once. Throws the Transition's error last.
   */
  const end = (run: Run, commit: boolean) => {
    if (commit) {
      for (const { tile } of tilesIn(current)) log.resetAttribute(tile, "data-ts-current");
      for (const { tile } of tilesIn(run.to)) log.attribute(tile, "data-ts-current", "");
      current = run.space = run.to;
    }
    if (run.animations.length === 0) settle();
    else {
      for (const animation of run.animations) {
        const [at, stop] = [animation.currentTime, animation.effect?.getComputedTiming().endTime];
        if (!commit) animation.playbackRate = -1;
        // Already where it heads (a custom Transition's shorter Animation, scrubbed past its end):
        // play() would rewind it and replay.
        if (commit ? Number(at) >= Number(stop) : Number(at) <= 0) animation.finish();
        else animation.play();
      }
      Promise.all(run.animations.map((a) => a.finished)).then(
        () => running === run && settle(),
        // Cancelled: by the engine, which has settled, or by someone else.
        () => running === run && settle(),
      );
    }
    if (commit) events.emit("change", { current, direction: run.direction });
    if ("error" in run) throw run.error;
  };
  const move = (space: number, direction: 1 | -1) => {
    if (destroyed || space === current || space < 0) return;
    end(begin(space, direction), true);
  };
  /**
   * Packs again for a Grid and the Stage's children; the Current space becomes the one holding the
   * Tile first on screen, or the nearest one if it left.
   */
  const repack = (next: Grid, children: Tile[]) => {
    settle();
    const first = tiles[packing.spaces[current]?.[0]?.tile ?? -1];
    const before = current;
    // Packed first: a packer that throws leaves the old state, so the next change tries again.
    packing = packFor(next, shapesOf(children));
    [tiles, grid] = [children, next];
    const index = packing.spaces.findIndex((space) => space.some((p) => tiles[p.tile] === first));
    current = index >= 0 ? index : Math.max(0, Math.min(before, last()));
    place();
    show(current);
    events.emit("pack", { spaces: packing.spaces.length });
    if (current !== before)
      events.emit("change", { current, direction: current > before ? 1 : -1 });
  };
  const resized = () => {
    // Read before any write: the neighbours rest one Stage size plus the `spaceGap` away.
    if (peek) reach = size() + spaceGap;
    const next = gridNow();
    if (next.columns !== grid.columns || next.rows !== grid.rows) repack(next, tiles);
    // The same Grid on a new size: the neighbours move to rest beside it, once nothing moves.
    else if (peek && !running) show(current);
  };
  // With `peek` the neighbours follow the Stage's size, on a fixed Grid too.
  const resizes = fit || peek ? new ResizeObserver(resized) : undefined;
  resizes?.observe(stage);
  // A Tile that left gets back what was written on it; an added child is adopted.
  const mutations = new MutationObserver(() => {
    const children = Array.from(stage.children) as Tile[];
    // Text, comments, or a child put back where it was: the Tiles are the same.
    if (children.length === tiles.length && children.every((c, i) => c === tiles[i])) return;
    for (const tile of tiles) if (!children.includes(tile)) log.release(tile);
    repack(grid, children);
  });
  mutations.observe(stage, { childList: true });
  /** The Space one step towards the direction, wrapping with `loop`; the Current space at an end. */
  const neighbour = (direction: 1 | -1) => {
    if (direction === 1) return current < last() ? current + 1 : loop ? 0 : current;
    return current > 0 ? current - 1 : loop ? last() : current;
  };
  /** One Space towards the direction; whether the Current space changed. */
  const step = (direction: 1 | -1) => {
    const before = current;
    move(neighbour(direction), direction);
    return current !== before;
  };
  /** Starts a Drag's Transition, paused; nothing when there is no Space that way. */
  const grab = (direction: 1 | -1): Grip | undefined => {
    const to = neighbour(direction);
    if (destroyed || to === current || to < 0) return undefined;
    const run = begin(to, direction);
    if ("error" in run) end(run, false);
    for (const animation of run.animations) animation.pause();
    // The Drag scrubs the whole timeline (DEC-10): the longest Animation's end.
    const length = Math.max(
      0,
      ...run.animations.map((a) => Number(a.effect?.getComputedTiming().endTime ?? 0)),
    );
    // A move, a repack or destroy() that ended the Run drops the rest of the Drag.
    return {
      seek(progress) {
        if (running === run) for (const a of run.animations) a.currentTime = progress * length;
      },
      release(commit) {
        if (running === run) end(run, commit);
      },
    };
  };
  const removeKeys = listenKeys(stage, axis, step);
  const removeWheel = listenWheel(stage, step);
  const removeDrag = listenDrag(stage, axis, grab);

  return {
    get current() {
      return current;
    },
    next: () => {
      step(1);
    },
    prev: () => {
      step(-1);
    },
    goTo(space) {
      if (last() < 0) throw new Error("tilespace: goTo needs a Space, but the Stage has no Tiles");
      if (!Number.isInteger(space) || space < 0 || space > last()) {
        throw new Error(`tilespace: goTo needs a Space from 0 to ${last()}, got ${space}`);
      }
      move(space, space > current ? 1 : -1);
    },
    on: (event, listener) => events.on(event, listener),
    destroy() {
      destroyed = true;
      resizes?.disconnect();
      mutations.disconnect();
      removeKeys();
      removeWheel();
      removeDrag();
      events.clear();
      settle();
      log.restore();
    },
  };
}

/** The Stage's content box: its client size without its padding, as CSS grid lays it out. */
function contentSize(stage: HTMLElement): { width: number; height: number } {
  const style = getComputedStyle(stage);
  const px = (value: string) => Number.parseFloat(value) || 0;
  return {
    width: stage.clientWidth - px(style.paddingLeft) - px(style.paddingRight),
    height: stage.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
  };
}

const turn = (span: Span): Span => ({ cols: span.rows, rows: span.cols });

/**
 * `pack` along the fill's flow (DEC-08): row by row on a vertical axis, as `core` packs; column by
 * column on a horizontal one, as on the Xbox dashboard, by packing the Grid and Spans turned a
 * quarter and turning the Placements back.
 */
function packAlong(axis: Axis, shapes: Shape[], grid: Grid, options: PackOptions): Packing {
  if (axis === "vertical") return pack(shapes, grid, options);
  // Checked as given, so an error names the Grid's own sides.
  validateGrid(grid);
  validateShapes(shapes);
  const back = ({ tile, col, row, span }: Placement): Placement => ({
    tile,
    col: row,
    row: col,
    span: turn(span),
  });
  const { score } = options;
  const turned = pack(
    shapes.map((shape) => shape.map(turn)),
    { columns: grid.rows, rows: grid.columns },
    // A custom Score sees the Placements and Shapes as they are, never turned.
    score
      ? {
          ...options,
          score: (p, s) =>
            score(
              p.map(back),
              s.map((x) => x.map(turn)),
            ),
        }
      : options,
  );
  return { spaces: turned.spaces.map((space) => space.map(back)) };
}
