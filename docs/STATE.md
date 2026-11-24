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
Tile's Placement (DEC-06), and makes the Stage a carousel region named by `label` (DEC-14). Space 0 is shown and the other Spaces are
`visibility: hidden` and `inert`. `destroy()` puts back every style and attribute it wrote. A custom
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
- **2026-11-24, close M2:** the owner checked the demo (T2.11 and the follow-ups T2.12–T2.14d) and
  every M2 slice is done; `ROADMAP.md` marks M2 done. The unapplied retro proposals are listed in
  the close pull request.
- **2026-11-24, plan M3:** seven slices (T3.1–T3.6) and DEC-14 and DEC-15 accepted by the owner;
  the demo will be hosted on GitHub Pages in the owner's site.
- **2026-11-24, plan the site:** the owner's Claude Design handoff is in `docs/site/`; eight slices
  (T3.7a–T3.12) after the publish, and DEC-16 accepted by the owner.
- **2026-11-24, T3.1 (hidden Spaces are inert):** every Tile outside the Current space is `inert`,
  and the leaving Tiles from the start of a move. Checked in Chromium: Tab never reaches a child
  that sets `visibility: visible` inside a hidden Tile.
- **2026-11-24, T3.2 (the Stage is a labelled carousel region):** `role="region"`,
  `aria-roledescription="carousel"` and `aria-label` from the `label` option, each only where the
  user set none. The demo names each example and keeps its live "Space n of N" (DEC-14's recipe).
  Not checked in VoiceOver: the agent can't drive it.
- **2026-11-24, the owner:** no v1 without the site, so the site comes before the packages' slices
  and the publish (T3.7a next).
- **2026-11-24, T3.7a (the site's pipeline):** `site/` (`tilespace-site`) builds after the packages
  and mounts a Tilespace from the vanilla build; `pages.yml` deploys it on each push to `main`
  once the owner turns Pages on (P4). Playwright runs a `site` project against `vite preview`.
- **2026-11-24, T3.7b (the site's look):** the handoff's tokens, the fonts from Google Fonts, the
  theme (the system's until the toggle saves one) and the header. Split at 533 lines: the phone
  menu and the footer are T3.7c. Not live yet: Pages is off until the owner does P4.
- **2026-11-24, T3.7c (the site's phone menu and footer):** the menu button opens the header's
  links as a sheet on a phone (Escape and a link close it); the footer has the about text, the
  packages and the links. Pages is still off (P4).
- **2026-11-24, T3.8 (the site's hero wall):** the hero's text, install line with Copy, GitHub and
  npm buttons, and a live wall of 56 tiles on `@tilespace/vanilla` with `peek`: the Stage keeps the
  container's width, the next Space bleeds past the screen's right edge, and the Grid follows the
  breakpoint (10x4, 8x4, 4x4; mounted again on a change). Its "Space n of N" is a live region fed
  by `change` and `pack`. With JavaScript off the tiles fill a plain clipped grid.
- **Next:** T3.9a.
