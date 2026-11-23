# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid, { order, nodeBudget, score })` places every Tile, Space after Space with the
Tiles left (the last Space holds what remains). In each Space every Tile gets a Span of its Shape
(clamped to the Grid), with the best Score `[holes, spanRank, displacement]` that the depth-first
search of DEC-08 finds under the Node budget (`nodeBudget` steps per Space, 100,000 by default,
`docs/decisions/0001-node-budget.md`). `order: 'fill'` (default) may reorder Tiles at a Displacement
cost; `'strict'` keeps the Stage's order. A Grid or Span that is not a positive integer, an empty
Shape, an unknown order or a `nodeBudget` that is not a positive integer throws a `tilespace:` error
naming the value. A custom `score` replaces the default Score, with no cut and no stop at a filling
with no Hole; a filling that places no Tile never counts, so every Tile is still placed.
`validatePacking(packing, shapes, grid)` throws `pack`'s error for an invalid Grid or Shape, then a
`tilespace:` error naming the first broken invariant (for the engine to check a custom Packer, M2). `npm run dev` serves the playground
(`playground/`, Vite): type a Grid and Shapes and see every Space drawn with its Holes and Score.
`createTilespace(stage, { columns, rows | minCellWidth, cellAspect, gap, shape, order, nodeBudget,
score, packer, loop })`
(`@tilespace/vanilla`) adopts the Stage's children as Tiles. It reads each Shape from
`data-ts-shape`, the `shape` option or `1x1`, packs them, and writes the Stage's CSS grid and each
Tile's Placement (DEC-06, without ARIA or `touch-action`). Space 0 is shown and the other Spaces are
`visibility: hidden`. `destroy()` puts back every style and attribute it wrote. A custom
`packer(shapes, grid)` replaces `pack`: it gets copies, and its Packing is checked with
`validatePacking`. `next()`, `prev()`
and `goTo(space)` change the Current space at once (`loop` wraps at the ends), `current` reads it,
and `on('change', fn)` hears each move. With `minCellWidth` (and `cellAspect`, 1 by default) the
Grid is derived from the Stage's content size and follows it through a `ResizeObserver`; a new Grid
repacks, fires `pack` (`{ spaces }`) and keeps the first Tile on screen in view. A missing
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
  `TilespaceEvents` (`create-tilespace.ts`). Its tests run in happy-dom.
- `playground/` (not a package): `index.html` and `main.ts`, over `core`'s source.

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T2.4 (a responsive Grid):** `minCellWidth`, `cellAspect`, the `ResizeObserver`
  and the `pack` event. Checked in a real-time headless Chrome over the DevTools protocol, since
  `--dump-dom` renders no frame and so fires no `ResizeObserver` (GOTCHAS "Browser checks").
- **Next:** T2.5 (repack when Tiles are added or removed).
