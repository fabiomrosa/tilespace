# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid, { order, nodeBudget, score, holes })` places every Tile, Space after Space with the
Tiles left (the last Space holds what remains). In each Space every Tile gets a Span of its Shape
(clamped to the Grid), with the best Score `[holes, spanRank, early, displacement]` (`early`: the
Holes gather at the end of the flow; `holes: "order"` puts the Displacement first) that the depth-first
search of DEC-08 finds under the Node budget (`nodeBudget` steps per Space, 100,000 by default,
`docs/decisions/0001-node-budget.md`). `order: 'fill'` (default) may reorder Tiles at a Displacement
cost; `'strict'` keeps the Stage's order. A Grid or Span that is not a positive integer, an empty
Shape, an unknown order or a `nodeBudget` that is not a positive integer throws a `tilespace:` error
naming the value. A custom `score` replaces the default Score, with no cut and no stop at a filling
with no Hole; a filling that places no Tile never counts, so every Tile is still placed.
`validateGrid` and `validateShapes` throw `pack`'s errors for a Grid or Shapes.
`validatePacking(packing, shapes, grid)` throws `pack`'s error for an invalid Grid or Shape, then a
`tilespace:` error naming the first broken invariant (for the engine to check a custom Packer, M2). `npm run dev` serves the playground
(`playground/`, Vite): type a Grid and Shapes and see every Space drawn with its Holes and Score.
`npm run demo` serves the demo (`demo/`, Vite): a showcase of mixed Shapes, a gallery and a
dashboard whose widgets keep their state, with Prev, Next, Destroy, and the Transition (slide, a
custom fade, none), the axis and `loop` to choose. `npm run e2e` (in the gate) drives it in Chromium with
Playwright: the rendered boxes match the Packing through `next` and a resize, and `destroy()`
leaves the Stage as the page wrote it.
`createTilespace(stage, { columns, rows | minCellWidth, cellAspect, gap, shape, order, nodeBudget,
score, packer, loop, transition, axis, peek, spaceGap })`
(`@tilespace/vanilla`) adopts the Stage's children as Tiles. It reads each Shape from
`data-ts-shape`, the `shape` option or `1x1`, packs them, and writes the Stage's CSS grid and each
Tile's Placement (DEC-06, without ARIA or `touch-action`). Space 0 is shown and the other Spaces are
`visibility: hidden`. `destroy()` puts back every style and attribute it wrote. A custom
`packer(shapes, grid)` replaces `pack`: it gets copies, and its Packing is checked with
`validatePacking`. `next()`, `prev()`
and `goTo(space)` change the Current space (`loop` wraps at the ends), `current` reads it, and
`on('change', fn)` hears each move. Each move runs the default Transition, with Web Animations
(`translate`, `opacity`): the Space slides as one block, then its Tiles settle in their order
within it; at its end only the new Space shows and nothing stays written. A new move, a repack or `destroy()`
during a Transition ends it at once. With `prefers-reduced-motion` it is a short cross-fade.
The `transition` option replaces it with a function of a `TransitionContext` (exported) that
returns Animations; `false` swaps at once, and so does a function that returns none, returns
something else (then throws a `tilespace:` error) or throws. With focus inside the Stage, the
arrow keys of the `axis` (`horizontal` by default, or `vertical`) and Page Up and Down move one
Space. One wheel gesture (momentum included, ended by 200 ms of quiet) moves one Space; it lets
the page scroll when it moved nothing, and leaves a gesture to a scroller or handler in a Tile.
The Tiles fill column by column on a horizontal axis (as on the Xbox dashboard) and row by row on
a vertical one. A pointer Drag along the axis scrubs the Transition and commits past half or on a flick, else
plays it back. `axis` also turns the default slide vertical. With `peek`, the Spaces before and after the
Current one show beside the Stage, `inert`, for a container of the user's to clip. With `minCellWidth` (and `cellAspect`, 1 by default) the
Grid is derived from the Stage's content size and follows it through a `ResizeObserver`; a new Grid
repacks, fires `pack` (`{ spaces }`) and keeps the first Tile on screen in view. Adding or
removing a child repacks the same way, and a removed child gets back what the library wrote. A missing
Stage, a malformed `data-ts-shape` or an invalid `gap` throws a `tilespace:` error before anything
is written.
`npm run bench` compares `pack` with a first-fit baseline (`bench/`). Property tests (`fast-check`,
500 runs) check the PRODUCT packing invariants on random Shapes and Grids up to 4x4, and every
Space's Holes against an exhaustive search (`test/exhaustive.ts`).

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), `validate` (`validate.ts`, the input checks, internal),
  `validatePacking` (`validate-packing.ts`), `PackOptions` (`pack.ts`), and the types `Span`,
  `Shape`, `Grid`, `Placement`, `Packing`, `Order`, `Score` (`packing.ts`).
- `packages/vanilla` (`@tilespace/vanilla`): `createTilespace`, `Tilespace`, `TilespaceOptions`
  (`create-tilespace.ts`), `ShapeOption` and `Tile` (`read-shape.ts`, with `readShape`, internal),
  the write log (`write-log.ts`, internal), `validateOptions` (`validate-options.ts`, internal), `deriveGrid` (`derive-grid.ts`, internal), the emitter (`emitter.ts`, internal),
  `defaultTransition` (`default-transition.ts`, internal), `TransitionContext` and `Axis` (exported
  there), `listenKeys` (`keyboard.ts`, internal), `listenWheel` (`wheel.ts`, internal),
  `listenDrag` and `Grip` (`drag.ts`, internal),
  `TilespaceEvents` (`create-tilespace.ts`). Its tests run in happy-dom.
- `playground/` (not a package): `index.html` and `main.ts`, over `core`'s source.
- `demo/` (not a package): `index.html`, `main.ts` and `examples.ts`, over `vanilla`'s source;
  `e2e/*.e2e.ts` and `playwright.config.ts` drive it.

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-24, T2.6 merged** after the owner's midway check; the demo now numbers each Tile by its
  place in the HTML (the owner asked which way the Tiles fill: row by row, DEC-08).
- **2026-11-24, T2.7 (the default Transition):** merged (#28).
- **2026-11-24, T2.8 (custom, none and reduced-motion Transitions):** the `transition` option, a
  function of an exported `TransitionContext` or `false`; reduced motion cross-fades (checked in
  Chromium with Playwright's media emulation). A Transition that throws swaps at once, then throws.
- **2026-11-24, T2.8:** merged (#29).
- **2026-11-24, T2.9 (the keyboard):** `keyboard.ts` and the `axis` option, which also turns the
  default slide vertical. Checked in Chromium: each key moves once, and a field in a shadow root
  keeps its arrows. The slice was split: the wheel is T2.9b.
- **2026-11-24, T2.9b (the wheel):** `wheel.ts`, written with T2.9 and split out for size, with
  the T2.9 review's fixes (scrollers, handlers, pinch zoom). Checked in Chromium: a burst of six
  wheel events moves one Space.
- **2026-11-24, T2.10a:** merged (#32), a refactor split from T2.10.
- **2026-11-24, T2.10 (the Drag):** `drag.ts` on `begin`/`end`. Checked in Chromium with the
  mouse: the Animations stay paused under the pointer, a full Drag finishes, no text is selected.
- **2026-11-24, T2.11 (the demo):** a gallery and a dashboard beside the showcase, and the
  Transition, axis and `loop` controls. Checked in Chromium: a dashboard note and counter survive a
  move away and back, and the examples and Transitions switch from the page.
- **2026-11-24, the owner's end check of M2:** two changes asked for, planned as T2.12 (the fill
  follows the axis: columns on a horizontal one, as on the Xbox dashboard) and T2.13 (the Space moves, then the cards settle).
- **2026-11-24, T2.12 (the fill follows the axis):** column by column on a horizontal axis, by a
  quarter turn in the engine; `core` exports `validateGrid` and `validateShapes`. On the demo,
  some Holes of the second Spaces sit mid-flow: T2.12b.
- **2026-11-24, T2.13 (the Space moves, then the cards settle):** the default Transition in two
  phases; the Drag scrubs the whole timeline. Checked in Chromium.
- **2026-11-24, T2.13b (the owner's pace):** a 500 ms slide, then each card settles from 40 px in
  450 ms, 80 ms apart.
- **2026-11-24, T2.12b (Holes at the end of the flow):** a Score term after the Span ranks and
  before the Displacement, with its bound, and the `holes` option (`"end"` or `"order"`).
- **2026-11-24, T2.13c:** going back, the cards settle in reverse; the demo has Holes and Gap
  controls.
- **2026-11-24, T2.14 (peek):** the neighbouring Spaces rest beside the Stage, `inert`, in the
  user's clipping container; the default slide travels a Stage size plus the gap. The demo has a
  Peek checkbox. Checked in Chromium.
- **2026-11-24, T2.14b:** `spaceGap`, the distance between Spaces (`gap` by default).
- **Next:** the owner's look at the demo, then closing M2.
