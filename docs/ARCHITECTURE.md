# tilespace architecture

A layered library in one npm workspace: a pure Packer at the bottom, a DOM engine on top of it, and
thin adapters on top of both. Behaviour is written and tested once, in the lower layers; adapters
only bind it to a UI layer (DEC-12, DEC-13).

## Stack
Exact versions are pinned in the root `package.json` (the same toolchain as `../curvesel` and
`../list-picker`): TypeScript 7.0.2, Vitest 5.1.1 with `@vitest/coverage-v8` 5.1.1, `fast-check`
4.11.0, Biome 2.6.8, Vite 8.3.8, happy-dom 21.0.4.
- **Language:** TypeScript 7, `strict` plus `noUncheckedIndexedAccess` and
  `exactOptionalPropertyTypes`, ES modules (`nodenext`), target ES2024. Node 26 (npm 11).
- **Workspace:** npm workspaces, packages under `packages/`. The root `tsconfig.json` type-checks
  every package's `src` and `test`; each package's `tsconfig.json` extends it to build its `src`.
  A package imports another by its name, through the other's `dist/`, so the gate builds first.
- **Tests:** Vitest 5 with V8 coverage. Added when first needed: `fast-check` 4 for property tests
  of the PRODUCT invariants (M1), `happy-dom` for engine unit tests (M2), Playwright for
  real-browser tests (M2; Web Animations and CSS grid need a real browser): `@playwright/test`
  1.65.0 with Chromium, `npm run e2e`, part of `npm run verify`. `playwright.config.ts` serves the
  demo with Vite on port 5181 (never a server already there) and runs `e2e/*.e2e.ts`.
- **Format and lint:** Biome 2.
- **Build:** `tsc` per package, to ESM plus type declarations in `dist/`. `core` builds with
  `"lib": ["es2024"]`, so a DOM name in its `src` fails the build (`npm run verify`), not the
  root typecheck.
- **Playground and demo:** Vite (dev server only), no config file: `vite playground` (`npm run dev`)
  and `vite demo` (`npm run demo`).

## Modules

| Package | Owns | May depend on |
|---|---|---|
| `packages/core` | The Grid, Shapes and Spans, the Packer and its Score, the Packing. No DOM. | nothing |
| `packages/vanilla` (M2) | `createTilespace(stage, options)`: adopts the Stage's children, reads their Shapes, derives the Grid from the Stage's size, packs, writes Placements, runs Transitions, handles input | `core` |
| `playground/` (T1.x) | A local page that draws Packings and exercises the Packer by hand; not a package, never published | `core` (source) |
| `demo/` (M2) | The demo page: a showcase, a gallery and a dashboard (`examples.ts`) with every input, Transition and axis, and the page the e2e flows drive; not a package | `vanilla` (source) |
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
- **Node budget:** a count of search steps per Space (default 100,000, chosen by the T1.9 benchmark,
  `docs/decisions/0001-node-budget.md`); every loop is bounded by it.
- **Last Space:** when every remaining Tile fits in one Space, it is packed with the same search;
  its Holes count but nothing is left to fill them.
- A custom `packer(shapes, grid) → Packing` or a custom `score` replaces the default; the engine
  validates every custom Packing with `validatePacking`. That checks the Grid and Shapes as `pack`
  does, then every invariant but the Holes, which would need a search. There is no development
  build to limit it to. The custom Packer gets copies of the Shapes and Grid. A custom `score` has no bound and no stop at a filling with no
  Hole: only the Node budget bounds it, and a filling that places no Tile never counts.

### The engine (`vanilla`)
- `createTilespace(stage, options)` (`create-tilespace.ts`) reads each child's Shape
  (`read-shape.ts`: `data-ts-shape`, else the `shape` option, else `1x1`), packs, and writes the
  Stage's grid and each Tile's Placement.
- The fill follows the axis (DEC-08): a vertical axis packs as `core` does, row by row; a
  horizontal one packs the Grid and Spans turned a quarter and turns the Placements back, so the
  Tiles fill column by column, as on the Xbox dashboard (`packAlong`). The Grid and Shapes are
  checked first as given (`validateGrid`, `validateShapes`), so an error names their own sides. A
  custom `score` sees the Placements and Shapes turned back, and a custom `packer` gets the real
  Shapes and Grid.
- Every style and attribute goes through one write log (`write-log.ts`). It saves each property's
  and attribute's value from before the first write. `resetStyle` and `resetAttribute` put one back
  (showing a Space puts back the user's own `visibility`), and `destroy()` puts back all of them,
  with their priority. It writes longhands only (`grid-column-start`, `row-gap`, `overflow-x`…):
  undoing a shorthand would wipe the longhands the user had set.
- `next`, `prev` and `goTo` set the Current space, move `data-ts-current` and emit `change` at
  once, then run the Transition (DEC-10). The default (`default-transition.ts`) uses Web Animations
  on `translate` and `opacity`, in two phases: the Space slides 300 ms along the axis as one block
  (the leaving Tiles out, the entering ones in from the Stage's size away, faint, landing 8 px
  short); then each entering Tile settles in 200 ms (the 8 px and the fade), in its order within
  the Space (the fill's flow), at most 40 ms apart and about 300 ms in all. One Animation per
  Tile. With `prefers-reduced-motion` it is a 150 ms cross-fade in place.
- Both Spaces show while a Transition runs. At its end (its Animations finish, or one is cancelled)
  the Animations are cancelled and the old Space gets `visibility: hidden`, so nothing stays
  written. A move, a repack or `destroy()` during a Transition first ends it at once.
- The `transition` option replaces the default: a function of a `TransitionContext` (the leaving
  and entering Tiles with copies of their Placements, the direction, the `axis`, a copy of the
  Grid, the
  Stage's client `width` and `height`) returning an array of Animations; reduced motion is then
  the function's to handle. `false`, an empty array, a throw, or anything but an array of
  Animations swaps at once; the error (a `tilespace:` one for a wrong return) is thrown after the
  swap and `change`, unless a `change` listener throws first. Animations a Transition made before
  throwing are its own to cancel, and a Transition must not move the Tilespace itself.
- Input (DEC-11): `keyboard.ts` listens for `keydown` on the Stage, so a key moves only with focus
  inside it. The arrows of the `axis` (`horizontal` by default: Left and Right; `vertical`: Up and
  Down) and Page Up and Down move one Space and stop the page scrolling. A held key (`repeat`), a
  modifier, a key typed in a field (in a shadow root too) or one already handled is left alone.
  The engine makes nothing focusable: a focused element in a Tile loses the focus when its Tile
  hides, so a page that wants the keys to keep moving makes the Stage focusable (the demo does).
- `wheel.ts` moves one Space per wheel gesture, along the larger delta: a gesture ends after 200 ms
  with no wheel event, so trackpad momentum is one gesture. A gesture that moved stops the page
  scrolling; one that moved nothing (at an end) lets the page scroll, so with `loop` the wheel
  over the Stage never scrolls the page. A gesture that starts on something in a Tile that can
  still scroll along the gesture's axis (shadow trees and reversed scrollers included), or that
  handles it (`preventDefault`), and a pinch zoom (`ctrlKey`), are left alone. Chrome lets only a
  scroll sequence's first event be cancelled, so a gesture that starts mid-sequence may also
  scroll the page.
- `drag.ts`: a press on the Stage becomes a Drag 10 px along the axis (across it first, it is the
  page's). The Drag captures the pointer and scrubs the paused Transition to the neighbouring Space
  by the distance over the Stage's size, up to the shortest Animation's end (the default's slide;
  its settle plays on release). Released past half or on a flick (0.5 px/ms over 100 ms)
  it commits; otherwise it plays back. Its click is stopped in the capture phase; a click below the
  threshold reaches the Tile. It clears the text selection it would make. A move, a repack or
  `destroy()` drops a Drag. The Stage gets `touch-action: pan-y pinch-zoom` (`pan-x` if vertical).
- In the engine, a move is `begin` (both Spaces showing, the Transition built) then `end`, which
  commits (the Current space, `data-ts-current` and `change`) or cancels, playing it back. A Transition runs inside `begin`, so it still
  sees the old `current` and `data-ts-current`.
- `axis` also turns the default slide and its stagger vertical. `destroy()` removes the key, wheel
  and pointer listeners and the gesture's timer.
- A move reads the Stage's size before its own writes; a move made from a `pack` or `change`
  listener, after the engine's writes in the same task, forces a layout. Events go through
  `emitter.ts` (`on` returns the unsubscribe function). After `destroy()` a move does nothing. As
  with DOM events, a listener removed during an emit (or by `destroy()`) is skipped; a move made
  inside a `change` listener reaches the later listeners first; a listener that throws stops the
  ones after it, after the move is done.
- A derived Grid (`minCellWidth`, `cellAspect`; `derive-grid.ts`) is measured from the Stage's
  content box at mount, before any write, and a `ResizeObserver` on the Stage measures it again.
  A changed Grid repacks, emits `pack` (`{ spaces }`), and moves the Current space to the one now
  holding the Tile that was first on screen, emitting `change` if its index changed. A fixed Grid
  observes nothing. The Stage's height must not come from its content (the rows derive from it).
- A `MutationObserver` on the Stage's child list repacks with its children as they now are: a
  Tile that left gets back what was written on it (`release` in the write log), and an added child
  is adopted. The Current space follows the Tile first on screen, or stays the nearest Space if
  that Tile left. The engine writes only attributes, so its writes never trigger it. Text, comments
  or a child put back where it was change nothing. A repack that throws (a malformed
  `data-ts-shape`) keeps the old Packing, and a Tile that left is never written again.

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
`Error` with a plain message at mount, never fails silently. Every check runs before the first
write, so an invalid mount leaves the Stage untouched: the engine checks the Stage, the `gap` and
each `data-ts-shape` (`validate-options.ts`, `read-shape.ts`), and `core` checks the Grid and the
Packer's options.

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
