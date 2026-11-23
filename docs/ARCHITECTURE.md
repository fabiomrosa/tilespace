# tilespace architecture

A layered library in one npm workspace: a pure Packer at the bottom, a DOM engine on top of it, and
thin adapters on top of both. Behaviour is written and tested once, in the lower layers; adapters
only bind it to a UI layer (DEC-12, DEC-13).

## Stack
Exact versions are pinned in the root `package.json` (the same toolchain as `../curvesel` and
`../list-picker`): TypeScript 7.0.2, Vitest 5.1.1 with `@vitest/coverage-v8` 5.1.1, `fast-check`
4.11.0, Biome 2.6.8, Vite 8.3.8.
- **Language:** TypeScript 7, `strict` plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`, ES modules (`nodenext`), target ES2024. Node 26 (npm 11).
- **Workspace:** npm workspaces, packages under `packages/`. The root `tsconfig.json` type-checks
  every package's `src` and `test`; each package's `tsconfig.json` extends it to build its `src`.
- **Tests:** Vitest 5 with V8 coverage. Added when first needed: `fast-check` 4 for property tests
  of the PRODUCT invariants (M1), `happy-dom` for engine unit tests (M2), Playwright for
  real-browser tests (M2; Web Animations and CSS grid need a real browser).
- **Format and lint:** Biome 2.
- **Build:** `tsc` per package, to ESM plus type declarations in `dist/`.
- **Playground:** Vite (dev server only, `npm run dev`), no config file: `vite playground`.

## Modules

| Package | Owns | May depend on |
|---|---|---|
| `packages/core` | The Grid, Shapes and Spans, the Packer and its Score, the Packing. No DOM. | nothing |
| `packages/vanilla` (M2) | `createTilespace(stage, options)`: adopts the Stage's children, reads their Shapes, derives the Grid from the Stage's size, packs, writes Placements, runs Transitions, handles input | `core` |
| `playground/` (T1.x) | A local page that draws Packings and exercises the Packer by hand; not a package, never published | `core` (source) |
| `packages/react` (M4) | `<Tilespace>` and a hook over the engine | `core`, `vanilla` |
| `packages/angular` (M5) | A component with `<ng-content>` over the engine | `core`, `vanilla` |

Each package is created by the first slice that needs it.

### The packing (`core`)
- `pack(shapes, grid, options) → Packing`. `shapes[i]` is Tile `i`'s Shape, a non-empty list of
  Spans `{ cols, rows }`; `grid` is `{ columns, rows }`. A Packing is `{ spaces: Placement[][] }`,
  a Placement `{ tile, col, row, span }` (0-based Cells). Spans are clamped to the Grid first.
- One Space at a time (DEC-08): the occupancy of a Space is one `Uint8Array` of its Cells, for any
  width (T1.1); the search keeps one occupancy and undoes each step on the way back, so its memory
  is its depth.
- **Search order:** first empty Cell row by row; candidates per DEC-09; Spans in Shape order; a Hole
  last. The Score is a tuple compared in order: `[holes, spanRank, displacement]`.
- **Bound:** `holesSoFar + max(0, freeCells − areaLeft)` (areaLeft is the area of the remaining
  candidates at their largest Span, so the bound never overstates the Holes to come) against the
  best tuple's Holes; equal Holes go on only while the lower terms can still improve.
- **Node budget:** a count of search steps per Space (default chosen by the M1 benchmark); every
  loop is bounded by it.
- **Last Space:** when every remaining Tile fits in one Space, it is packed with the same search;
  its Holes count but nothing is left to fill them.
- A custom `packer(shapes, grid) → Packing` or a custom `score` replaces the default; the engine
  validates a custom Packing with `validatePacking` in development builds (every invariant but the
  Holes, which would need a search). A custom `score` has no bound and no stop at a filling with no
  Hole: only the Node budget bounds it, and a filling that places no Tile never counts.

## Request flow
Mount and one Drag through the engine (M2):
1. `createTilespace(stage, options)`: read each child's Shape (DEC-07), measure the Stage, derive
   the Grid (`columns`/`rows`, or from `minCellWidth`, the Cell aspect and the gap), `pack`, write
   the Stage's grid and each Tile's Placement (DEC-06), show Space 0.
2. A `ResizeObserver` on the Stage re-derives the Grid; a changed Grid repacks, and the Current
   space becomes the one holding the Tile that was first on screen. A `MutationObserver` on the
   Stage's child list repacks when Tiles are added or removed.
3. `pointerdown` past the threshold along the axis: build the Transition to the neighbouring Space,
   pause it; `pointermove` sets its `currentTime` from the distance; `pointerup` plays it forward
   past half the distance or a flick, otherwise in reverse. The next `click` is stopped if it was a
   Drag.
4. `next()`, a key or a wheel gesture: build the Transition and play it. A new request during a
   Transition finishes the current one at once and starts the next.
5. `destroy()`: cancel the Animations, disconnect the observers, remove the listeners, restore what
   DEC-06 lists.

## Persistence
None. The library emits `change` (the Current space) and `pack` (a new Packing, with its number of
Spaces); the user persists.

## Configuration
Options passed to `createTilespace` or the adapter: the Grid (`columns`, `rows`, or `minCellWidth`
and `cellAspect`), `gap`, `shape`, `order`, `nodeBudget`, `packer`, `score`, `transition`, `axis`,
`loop`. No environment. An invalid option (a missing Stage, a Span of 0, a negative gap) throws an
`Error` with a plain message at mount, never fails silently.

## Security
The library never reads or writes the Tiles' content and never uses `innerHTML`. No network access.

## External providers
None. GitHub for the code and CI; npm for publishing (from M3).

## Design references
None for the library: it is headless (DEC-06). The demo's look lives in the demo only.

## Lessons from the 2017 wall (`../surface/chosen.surface.js`)
What it got right and returns here:
- A Tile declares its size in Cells (`data-type="2x1"`), and the Grid repeats page after page.
- One page on screen at a time, `prev`/`next`, and the Tiles entering staggered
  (`delay: (i % 4) / 10 + i / 50`), which inspires the default Transition.
What does not return: greedy first-fit with no backtracking (an early choice leaves Holes it never
fixes), its bugs (`cc > columns` let a Tile at the last column wrap into the next row; the `break`
when nothing fits left only the row; the page size fixed at 32 Cells; `hasNextPage` inverted),
silent reordering, absolute pixel positions, the global state, jQuery and TweenMax, the coupling to
ajax, filters, history and the session, and the image loading inside the panels.
