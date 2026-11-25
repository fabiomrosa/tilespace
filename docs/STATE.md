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
custom fade, none), a card effect (none, cascade, 3-D cascade, pop: user code on `change`, each
Tile holding its card), the axis and `loop` to choose. `npm run e2e` (in the gate) drives it in Chromium with
Playwright: the rendered boxes match the Packing through `next` and a resize, and `destroy()`
leaves the Stage as the page wrote it.
`createTilespace(stage, { columns, rows | minCellWidth, cellAspect, gap, shape, order, nodeBudget,
score, packer, loop, transition, axis, peek, spaceGap, label, start })`
(`@tilespace/vanilla`) adopts the Stage's children as Tiles. It reads each Shape from
`data-ts-shape`, the `shape` option or `1x1`, packs them, and writes the Stage's CSS grid and each
Tile's Placement (DEC-06), and makes the Stage a carousel region named by `label` (DEC-14). Space 0 (or `start`, clamped to the last) is shown and the other Spaces are
`visibility: hidden` and `inert`. `destroy()` puts back every style and attribute it wrote. A custom
`packer(shapes, grid)` replaces `pack`: it gets copies, and its Packing is checked with
`validatePacking`. `next()`, `prev()`
and `goTo(space)` change the Current space (`loop` wraps at the ends), `current` reads it, and
`on('change', fn)` hears each move, with its `direction`. Each move runs the default Transition, with Web Animations
(`translate`): the Space slides as one block; at its end only the new Space shows and nothing stays written. A new move, a repack or `destroy()`
during a Transition ends it at once. With `prefers-reduced-motion` it is a short cross-fade.
The `transition` option replaces it with a function of a `TransitionContext` (exported) that
returns Animations; `false` swaps at once, and so does a function that returns none, returns
something else (then throws a `tilespace:` error) or throws. With focus inside the Stage, the
arrow keys of the `axis` (`horizontal` by default, or `vertical`) and Page Up and Down move one
Space. One wheel gesture (momentum included, ended by 200 ms of quiet) moves one Space; it lets
the page scroll when it moved nothing, and leaves a gesture to a scroller or handler in a Tile.
The Tiles fill column by column on a horizontal axis (as on the Xbox dashboard) and row by row on
a vertical one. A pointer Drag along the axis scrubs the Transition and commits past half or on a flick, else
plays it back; a press on a form control, an editable element or a scroller that can scroll that
way is theirs. `axis` also turns the default slide vertical. With `peek`, the Spaces before and after the
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
- `demo/` (not a package): `index.html`, `main.ts`, `examples.ts` and `card-effects.ts` (the
  cards' own motion as user code on `change`), over `vanilla`'s source;
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
- **2026-11-24, T3.8a (the site's hero text):** the eyebrow, the name, the tagline, the install
  line with Copy, and the GitHub and npm buttons. Split at 469 lines: the wall is T3.8b.
- **2026-11-24, T3.8b (the site's hero wall):** a live wall of 56 tiles on `@tilespace/vanilla`
  with `peek`: the Stage keeps the container's width, the next Space bleeds past the screen's right
  edge, and the Grid follows the breakpoint (10x4, 8x4, 4x4; mounted again on a change). Its
  "Space n of N" is a live region fed by `change` and `pack`. With JavaScript off the tiles fill a
  plain clipped grid.
- **2026-11-25, T3.8c:** the hero's wall bleeds both ways with `loop` (the owner), centred and
  narrower than the screen at every width. On Space 1 the left strip is the last Space's empty end,
  which the owner accepted.
- **2026-11-25, T3.13:** with `peek`, the Space beyond the entering one and the one behind the
  leaving one slide with the block (`TransitionContext.ahead`, `.behind`): no flick at the edges.
- **2026-11-25, T3.14:** the 2017 wall is in the repository as `reference/surface.js`, its layout
  formatted, its code and comments as they were.
- **2026-11-25, plan the home's sections:** like list-picker's home (the owner): the lab with its
  table (T3.11b), the packages with a page each (T3.15), install tabs (T3.16), links and the
  origin (T3.17).
- **2026-11-25, hotfix of T3.13:** with `peek`, an entering Tile lands at most the `spaceGap` short
  of its place (40 px otherwise), so the last column no longer covers the Space resting beyond.
- **2026-11-25, the owner:** the library moves only the Space; card effects are the user's (DEC-10
  amended), and a card that animates or places itself goes in a wrapper (DEC-06).
- **2026-11-25, T3.18:** the default Transition is the Space's slide only (no settle, no fade), and
  `change` says the move's `direction` for the cards' own motion.
- **2026-11-25, T3.19:** the demo's card effects: cascade, 3-D cascade and pop, written as user
  code on `change` that animates the card inside each Tile, from the move's side.
- **2026-11-25, the owner:** a favicon before the playground (T3.20); the hero's cards cascade
  again as the site's code (T3.21); the playground gets a Cards select (T3.9b, now T3.9c).
- **2026-11-25, T3.20:** the site's favicon is the logo mark (`site/public/favicon.svg`), with a
  180 px `apple-touch-icon.png` drawn from it, both under `/tilespace/`.
- **2026-11-25, T3.21:** the hero's cards cascade again, as the site's code on `change`
  (`site/src/demos/card-cascade.ts`): each card, inside its Tile, falls up to the space gap behind
  during the slide and settles column by column from the move's side; never after a Drag.
- **2026-11-25, T3.9a (the site's playground: the framed Showcase):** the Showcase in a framed
  Stage, 8x4 and 4x5 on a phone, with prev, next and its own live counter; static tiles with
  JavaScript off. Split at 542 lines: the tabs, the Gallery and the Dashboard are T3.22
  (`backup/T3.9a-full`). The menu's links now jump to a real section: the menu closes and the focus
  goes on from there.
- **2026-11-25, T3.22 (the playground's tabs):** a tablist (APG tabs, automatic activation, Home
  and End) mounts Showcase, Gallery (generated SVG photos, the default the owner left) or Dashboard
  (real inputs that keep their values through a move); hidden with JavaScript off.
- **2026-11-25, T3.9b (the playground's control bar):** axis and peek (off, inset, bleed) as
  segmented buttons, the Transition select (slide, a custom fade, none), the gap and space gap
  sliders with their readouts, loop; each change mounts the example again where the visitor is.
  On a phone, an Options button shows the same controls. The Cards select is T3.9c (split).
- **2026-11-25, T3.9c (the playground's Cards select):** none, cascade, 3-D cascade, pop: the
  demo's effects (`demo/card-effects.ts`, one source) as the site's code on `change`; peeking,
  only the site's cascade, which never fades (3-D and pop wait for Peek Off); none after a Drag or
  with reduced motion. The site's cascade follows the axis.
- **2026-11-25, the owner:** two library fixes before the publish: the Drag leaves a press on a
  form control or a scroller alone (T3.23), and a `start` option mounts at a chosen Space (T3.24).
- **2026-11-25, T3.23:** the Drag leaves a press on a form control (not a checkbox, radio or
  button), an editable element or a scroller that can still scroll along the axis to it; the
  site's dashboard dropped its own `pointerdown` guard.
- **2026-11-25, T3.24:** a `start` option mounts at a chosen Space (clamped to the last), with no
  Transition and no `change`; the site's hero and playground remount where the visitor was, at
  once.
- **2026-11-25, T3.10 (the site's first section):** "Bring your own tiles", static: the Headless,
  Flexible spans and Every input cards from the handoff, three in a row and one column on a phone.
- **Next:** T3.3.
