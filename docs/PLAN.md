# tilespace plan

This repository's track of `docs/shared/ROADMAP.md`, with entries in the template of
`docs/shared/SESSION.md` §0. Slice ids start with `T`.

---

### T0.1 · Runnable skeleton
- **Status:** done (2026-11-23)
- **Goal:** an empty project that builds, formats, tests and runs, with its gate in CI.
- **Depends on:** DEC-13 (accepted), P1.
- **In scope:**
  - The npm workspace (root `package.json`, `tsconfig` base, strict) with `packages/core` empty but
    building: its `package.json`, `tsconfig`, `src/index.ts`.
  - Vitest and Biome at the ARCHITECTURE versions, pinned.
  - The formatter and linter, wired into the gate.
  - One smoke test.
  - Coverage in the gate, failing below the floor of `docs/CONVENTIONS.md` §5 (80% of lines).
  - CI: the `gate` job in `.github/workflows/ci.yml` running `npm run verify`.
  - `README.md`: Tech references, Requirements, Running locally, Config (as far as the skeleton
    goes).
  - The gate as one command (`npm run verify`), the same one CI runs.
- **Out of scope:** any feature; `packages/vanilla` and the others; Playwright; publishing.
- **Contract:** none.
- **Acceptance criteria:**
  1. `npm run verify` passes from a clean clone.
  2. A badly formatted file fails the gate (seen once).
  3. The smoke test passes, and fails when broken (seen once).
  4. Coverage below the floor fails the gate (seen once).
  5. CI is green on the pull request.
- **Files:** ~14 (lockfile excluded): root `package.json`, `tsconfig.json`, `biome.json`,
  `packages/core/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`, `ci.yml`, `README.md`, PLAN,
  STATE, GOTCHAS. Coverage is set by CLI flags, with no Vitest config file.
- **References:** ARCHITECTURE "Stack", GOTCHAS; `../curvesel`'s root `package.json`,
  `tsconfig.json` and `biome.json`, the same toolchain already working.

---

## M1 · Core

### T1.1 · Pack one Space with fixed Spans
- **Status:** done (2026-11-23)
- **Goal:** `pack(shapes, grid)` fills one Space with Tiles of one Span each, with the fewest Holes.
- **Depends on:** T0.1, DEC-07, DEC-08.
- **In scope:**
  - The types `Span`, `Shape`, `Grid`, `Placement` and `Packing` (ARCHITECTURE "The packing").
  - Spans clamped to the Grid.
  - The depth-first search of DEC-08 for one Space: the first empty Cell row by row, the earliest
    remaining Tile of each distinct Shape as candidates, a Hole last, the Holes bound, stop at a
    Space with no Hole. The Score is Holes only.
  - One occupancy, undone on the way back; every loop bounded by an internal Node budget constant
    (T1.6 makes it an option, T1.9 chooses its value).
  - `packageName` and the smoke test removed: the new tests replace them.
- **Out of scope:** Shapes of several Spans (T1.3); Tiles that do not fit in Space 0 (left unplaced
  until T1.4); `order` and Displacement (T1.5); input validation (T1.2).
- **Contract:** `pack(shapes: readonly Shape[], grid: Grid): Packing`; `Packing.spaces` holds one
  Space.
- **Acceptance criteria:**
  1. Tiles whose area equals the Grid's fill it with no Hole, where first-fit in the Stage's order
     would leave one (a fixture of 1x2, 2x1 and 1x1 Tiles).
  2. A Span wider or taller than the Grid is clamped to it.
  3. When no filling is complete, the Packing has the fewest Holes possible (a small fixture checked
     by hand).
  4. The same input gives the same Packing.
- **Files:** ~7: `packages/core/src/{index.ts,packing.ts,pack.ts,pack-space.ts}`,
  `packages/core/test/pack.test.ts`, the smoke test removed, PLAN, STATE.
- **References:** DEC-07, DEC-08, ARCHITECTURE "The packing", GOTCHAS "Toolchain" (unbounded loops).

### T1.2 · Reject invalid input
- **Status:** done (2026-11-23)
- **Goal:** a bad Grid or Shape throws a plain `tilespace:` error instead of packing nonsense.
- **Depends on:** T1.1.
- **In scope:** `pack` throws an `Error` whose message starts with `tilespace:` and names the value
  (CONVENTIONS §4) for: `columns` or `rows` not a positive integer; an empty Shape; a Span whose
  `cols` or `rows` is not a positive integer.
- **Out of scope:** the engine's options (M2); `columns > 32` is not an error (the occupancy is a
  `Uint8Array`, ARCHITECTURE).
- **Contract:** `pack` as in T1.1, throwing on the inputs above.
- **Acceptance criteria:**
  1. Each invalid input above throws with a message naming the value.
  2. A Grid of 40 columns packs (the wide-Grid occupancy).
- **Files:** ~5: `packages/core/src/{pack.ts,validate.ts}`, `packages/core/test/validate.test.ts`,
  PLAN, STATE.
- **References:** CONVENTIONS §4, ARCHITECTURE "Configuration".

### T1.3 · Flexible Shapes
- **Status:** done (2026-11-23)
- **Goal:** a Tile with several Spans gets the one that fills best, preferring its earlier Spans.
- **Depends on:** T1.1, DEC-07.
- **In scope:** each candidate tries each Span of its Shape that fits, in Shape order; the Score
  becomes `[holes, spanRank]` (the sum of the chosen Spans' indexes); the bound uses each remaining
  Tile's largest Span (the most it can cover); candidates are the earliest remaining Tile of each
  distinct Shape (a Shape is its list of Spans).
- **Out of scope:** Displacement (T1.5).
- **Contract:** `pack` as in T1.1.
- **Acceptance criteria:**
  1. A Tile of Shape `2x2 1x1` takes `1x1` when only that leaves no Hole.
  2. Among fillings with equal Holes, the one with the lower span rank wins.
  3. Two Tiles of the same Shape are never both tried at the same Cell (a node count on a fixture).
- **Files:** ~5: `packages/core/src/pack-space.ts`, `packages/core/test/pack.test.ts`,
  `packages/core/test/flexible-shapes.test.ts`, PLAN, STATE.
- **References:** DEC-07, DEC-08.

### T1.4 · Several Spaces and the last one
- **Status:** done (2026-11-23)
- **Goal:** every Tile is placed: Space after Space with the Tiles left, the last Space holding what
  remains.
- **Depends on:** T1.3.
- **In scope:** `pack` repeats the one-Space search with the Tiles left until none remains; when
  every remaining Tile fits in one Space it is the last one, packed with the same search, its Holes
  counting with nothing left to fill them; no Tiles gives `{ spaces: [] }`.
- **Out of scope:** order modes (T1.5).
- **Contract:** `pack` as in T1.1; `Packing.spaces` holds every Space.
- **Acceptance criteria:**
  1. Every Tile is placed exactly once, across as many Spaces as needed.
  2. Every Space but the last has no Hole when the Tiles allow it (a fixture).
  3. No Tiles give no Spaces.
- **Files:** ~4: `packages/core/src/pack.ts`, `packages/core/test/pack.test.ts`, PLAN, STATE.
- **References:** DEC-08, ARCHITECTURE "Last Space".

### T1.5 · Order modes and Displacement
- **Status:** done (2026-11-23)
- **Goal:** `fill` may reorder Tiles at a Displacement cost; `strict` keeps the Stage's order.
- **Depends on:** T1.4, DEC-09.
- **In scope:** `pack(shapes, grid, { order })`, `'fill'` by default; the Score becomes
  `[holes, spanRank, displacement]`, the Displacement being how many places each Tile moved from
  its order in the Stage; in `strict` the only candidate is the next Tile.
- **Out of scope:** exposing the visual order in the DOM (M2).
- **Contract:** `pack(shapes, grid, options?: PackOptions)`, `PackOptions = { order?: 'fill' |
  'strict' }`.
- **Acceptance criteria:**
  1. In `fill`, among equal Holes and span ranks, the filling that moves Tiles least wins.
  2. In `strict`, reading the Spaces and their Placements in order gives the Stage's order, even
     when `fill` would leave fewer Holes.
- **Files:** ~5: `packages/core/src/{pack.ts,pack-space.ts,index.ts}`,
  `packages/core/test/order.test.ts`, PLAN, STATE.
- **References:** DEC-09, PRODUCT "Engineering-critical invariants".

### T1.6 · The Node budget option
- **Status:** done (2026-11-23)
- **Goal:** the user bounds the search per Space and still gets a complete, valid Packing.
- **Depends on:** T1.5.
- **In scope:** `nodeBudget` in `PackOptions` (a positive integer, `tilespace:` error otherwise);
  the search stops after that many steps per Space and keeps the best filling found; when it has
  found none yet, the rest of the Space is completed greedily (each remaining Cell takes the first
  candidate that fits, or a Hole) so every Tile is still placed.
- **Out of scope:** choosing the default (T1.9).
- **Contract:** `PackOptions.nodeBudget?: number`.
- **Acceptance criteria:**
  1. A budget of 1 still places every Tile exactly once, with no overlap.
  2. A larger budget never gives a worse Score on the same input (a fixture).
  3. A 32x32 Grid with 500 Tiles returns (the test does not hang).
- **Files:** ~5: `packages/core/src/{pack.ts,pack-space.ts}`, `packages/core/test/node-budget.test.ts`,
  PLAN, STATE.
- **References:** DEC-08, GOTCHAS "Toolchain".

### T1.7 · The PRODUCT invariants as property tests
- **Status:** done (2026-11-23)
- **Goal:** the packing invariants hold for random Shapes and Grids, not only the fixtures.
- **Depends on:** T1.6.
- **In scope:** `fast-check` 4.11.0 pinned; properties for: no overlap and every Tile in bounds;
  every Tile placed once with a Span of its (clamped) Shape; no Space but the last has more Holes
  than an exhaustive search of that Space with the same Tiles left (Grids up to 4x4); `strict`
  keeps the order; determinism. Each property asserts a minimum count of its interesting cases
  (CONVENTIONS §5).
- **Out of scope:** benchmarks (T1.9).
- **Contract:** none.
- **Acceptance criteria:**
  1. Each property passes, and fails once when the rule it checks is broken in the code.
  2. A weak generator fails the minimum-count assertion (seen once).
- **Files:** ~6: root `package.json`, lockfile, `packages/core/test/{invariants.property.test.ts,
  exhaustive.ts}`, PLAN, STATE.
- **References:** PRODUCT "Engineering-critical invariants", CONVENTIONS §5.

### T1.8 · Custom Score and Packing validation
- **Status:** done (2026-11-23)
- **Goal:** a user can rank fillings their own way, and a custom Packing can be checked against the
  invariants.
- **Depends on:** T1.7.
- **In scope:**
  - `score` in `PackOptions`: `(placements, shapes) → number[]`, compared in order, lower first; it
    replaces the default Score. The Holes bound applies only to the default Score; with a custom one
    the Node budget alone bounds the search.
  - `validatePacking(packing, shapes, grid)`: throws a `tilespace:` error naming the first broken
    invariant (overlap, out of bounds, a Tile missing or placed twice, a Span not in its Shape). The
    engine calls it on a custom Packer's result in development builds (M2).
- **Out of scope:** the `packer` option itself, which lives in the engine (M2).
- **Contract:** `PackOptions.score?: (placements: readonly Placement[], shapes: readonly Shape[]) =>
  number[]`; `validatePacking(packing: Packing, shapes: readonly Shape[], grid: Grid): void`.
- **Acceptance criteria:**
  1. A custom Score that prefers the largest Spans changes the chosen Spans on a fixture.
  2. `validatePacking` accepts every Packing `pack` returns (property) and rejects each broken
     invariant with its message.
- **Files:** ~7: `packages/core/src/{pack-space.ts,validate-packing.ts,index.ts}`,
  `packages/core/test/{score.test.ts,validate-packing.test.ts}`, PLAN, STATE.
- **References:** PRODUCT "Replaceable strategy", ARCHITECTURE "The packing".

### T1.9 · Benchmark against first-fit and the default Node budget
- **Status:** done (2026-11-23)
- **Goal:** the lab's first answer: Holes and time of the search against first-fit, and the default
  Node budget chosen from them.
- **Depends on:** T1.6.
- **In scope:** a first-fit baseline in the benchmark (the 2017 wall's greedy, without its bugs); a
  script `npm run bench` over seeded random Tiles on a few Grids (e.g. 4x3, 6x4, 12x8), reporting
  per Space the median time and the Holes of each side, per CONVENTIONS §5; the default Node budget
  set to the largest value whose median time fits a frame budget (4 ms on this machine) on the
  largest Grid; a decision record with the method and the numbers.
- **Out of scope:** the engine's timing (M2); the write-up (M3).
- **Contract:** none (the default value changes; `PackOptions` does not).
- **Acceptance criteria:**
  1. `npm run bench` prints the table, the same seeds giving the same Holes.
  2. The decision record states the method, the machine, the numbers and the chosen default.
- **Files:** ~8: `bench/pack.bench.ts`, `bench/first-fit.ts`, root `package.json` and
  `tsconfig.json` (`bench` type-checked), `packages/core/src/pack.ts` (the default), `docs/decisions/0001-node-budget.md`, PLAN, STATE.
- **References:** PRODUCT "Measured, not assumed", CONVENTIONS §5 "Benchmarks", ROADMAP "The end
  goal".

### T1.10 · The playground draws Packings
- **Status:** done (2026-11-23)
- **Goal:** the owner checks Packings in the browser: type Shapes and a Grid, see every Space drawn.
- **Depends on:** T1.8.
- **In scope:** Vite 8.3.8 pinned and `npm run dev` (`vite playground`, no config file); one page
  with inputs for the Grid, the Shapes (`2x2 1x1, 1x2, …`), the order and the Node budget, a seeded
  random fill, and each Space drawn as a CSS grid with each Tile labelled with its index and Span,
  and its Holes and Score shown; `playground` type-checked by the root `tsconfig.json`. Built with
  DOM APIs, no `innerHTML` with user values.
- **Out of scope:** the engine, Transitions and input (M2); the demo page (M2).
- **Contract:** consumes `pack` and `PackOptions` from `core` (source).
- **Acceptance criteria:**
  1. `npm run dev` serves the page and it draws the Packing of the default input on load.
  2. Changing an input redraws; an invalid Shape shows the `tilespace:` message.
  3. The owner checks the Packings in the browser (the M1 end check).
- **Files:** ~6: root `package.json`, lockfile, `tsconfig.json`,
  `playground/{index.html,main.ts}`, README "Running locally", PLAN, STATE.
- **References:** ARCHITECTURE "Modules" (`playground/`), ROADMAP M1.

---

## M2 · Vanilla engine and demo

### T2.1 · Mount a Stage and place its Tiles
- **Status:** done (2026-11-23)
- **Goal:** a developer mounts `createTilespace(stage, { columns, rows })` over their own elements
  and sees Space 0 laid out as a CSS grid, the other Spaces hidden.
- **Depends on:** M1 (done), DEC-06, DEC-07, DEC-13.
- **In scope:**
  - `packages/vanilla` (`@tilespace/vanilla`), with `happy-dom` pinned for its tests.
  - Read each child's Shape from `data-ts-shape`, else the `shape(tile, index)` option, else `1x1`.
  - Pack with `core`, passing `order`, `nodeBudget` and `score` through.
  - Write what DEC-06 lists except ARIA and `touch-action`:
    - on the Stage, the grid and its `gap`;
    - on each Tile, `grid-column`, `grid-row`, `data-ts-space`, `data-ts-span`, `--ts-cols` and
      `--ts-rows`;
    - `visibility: hidden` on the Tiles outside Space 0, and `data-ts-current` on those inside it.
  - `destroy()` restores every property and attribute it wrote, to its earlier value.
- **Out of scope:** invalid options (T2.2), navigation (T2.3), a derived Grid (T2.4), `inert` and
  ARIA (M3).
- **Contract:** `createTilespace(stage, options) → Tilespace` with `destroy()`; consumes `pack`.
- **Acceptance criteria:**
  1. The Tiles get the Placements `pack` returns, Space 0 is shown, and the others are hidden.
  2. `data-ts-shape`, the `shape` option and the `1x1` default each give the Tile's Shape.
  3. After `destroy()`, the Stage and every Tile are as before mounting, including styles the user
     had set; the Tiles are the same nodes in the same order.
- **Files:** ~10: `packages/vanilla/{package.json,tsconfig.json,src/index.ts,src/create-tilespace.ts,
  src/read-shape.ts,test/mount.test.ts}`, root `package.json`, lockfile, ARCHITECTURE (the files),
  PLAN, STATE.
- **References:** ARCHITECTURE "Request flow" 1 and 5, CONVENTIONS §2–§5.

### T2.2 · Reject invalid options
- **Status:** done (2026-11-23)
- **Goal:** a wrong mount fails at once with a message naming the value.
- **Depends on:** T2.1.
- **In scope:**
  - A `tilespace:` error for a missing Stage, a malformed `data-ts-shape` (`2y1`, `0x1`), a
    negative or non-finite `gap`, and an unknown `axis` or `transition`.
  - The Grid and Packer options rely on `core`'s own errors.
  - A custom `packer(shapes, grid)` option, its Packing checked with `validatePacking` on every
    pack. ARCHITECTURE's "in development builds" becomes "always": there is no build flag.
- **Out of scope:** the options' behaviour beyond the packer (later slices).
- **Contract:** consumes `validatePacking`.
- **Acceptance criteria:**
  1. Each invalid option throws its `tilespace:` message, and nothing is written to the Stage.
  2. A custom `packer` places the Tiles, and a broken one throws `validatePacking`'s message.
- **Files:** ~6: `src/{create-tilespace.ts,read-shape.ts,validate-options.ts}`,
  `test/options.test.ts`, ARCHITECTURE "Configuration", PLAN, STATE.
- **References:** CONVENTIONS §4, ARCHITECTURE "Configuration".

### T2.3 · Move between Spaces by API
- **Status:** done (2026-11-23)
- **Goal:** a developer moves between Spaces with `next()`, `prev()` and `goTo(space)` and hears
  `change`.
- **Depends on:** T2.1, DEC-11.
- **In scope:**
  - `next`, `prev`, `goTo`, and a `current` getter.
  - The `loop` option.
  - An instant swap: `visibility` and `data-ts-current` move to the new Space's Tiles.
  - The `change` event (`{ current }`) and `on(event, listener)`, which returns an unsubscribe
    function; `destroy()` removes the listeners.
- **Out of scope:** Transitions (T2.7), input devices (T2.9, T2.10).
- **Contract:** `next()`, `prev()`, `goTo(space)`, `current`, `on('change', fn)`.
- **Acceptance criteria:**
  1. `next` and `prev` move by one Space and stop at the ends, or wrap with `loop`.
  2. `goTo` moves to the Space; out of range, it throws a `tilespace:` error.
  3. `change` fires once per move and never for a move to the Current space.
- **Files:** ~5: `src/create-tilespace.ts`, `src/emitter.ts`, `test/navigation.test.ts`, PLAN, STATE.
- **References:** ARCHITECTURE "Request flow" 4, CONVENTIONS §3 (events).

### T2.4 · A responsive Grid
- **Status:** done (2026-11-23)
- **Goal:** the Grid follows the Stage's size, and the Tiles repack when it changes.
- **Depends on:** T2.3.
- **In scope:**
  - `minCellWidth` and `cellAspect`:
    - `columns = max(1, floor((width + gap) / (minCellWidth + gap)))`;
    - the Cell height is the Cell width divided by `cellAspect`;
    - the rows fill the Stage's height in the same way.
  - A `ResizeObserver` on the Stage. A changed Grid repacks, and the Current space becomes the one
    holding the Tile that was first on screen.
  - The `pack` event (`{ spaces }`).
- **Out of scope:** child mutations (T2.5).
- **Contract:** `on('pack', fn)`; the options `minCellWidth`, `cellAspect`.
- **Acceptance criteria:**
  1. A Stage of a given size derives the expected `columns` and `rows`.
  2. A resize that changes the Grid repacks, keeps the first visible Tile on screen and fires
     `pack`; one that doesn't change it does nothing.
  3. `destroy()` disconnects the observer.
- **Files:** ~6: `src/{create-tilespace.ts,derive-grid.ts}`, `test/{derive-grid.test.ts,resize.test.ts}`,
  PLAN, STATE.
- **References:** ARCHITECTURE "Request flow" 2.

### T2.5 · Repack when Tiles are added or removed
- **Status:** done (2026-11-23)
- **Goal:** a developer adds or removes children and the Tilespace follows.
- **Depends on:** T2.4, DEC-12.
- **In scope:**
  - A `MutationObserver` on the Stage's child list.
  - An added child is adopted. A removed one gets back what the library wrote.
  - Repack, keeping the first visible Tile on screen when it remains.
- **Out of scope:** attribute changes to `data-ts-shape` after mount (Later, if needed).
- **Contract:** none new.
- **Acceptance criteria:**
  1. Adding a child places it and fires `pack`.
  2. Removing a child leaves it as it was before mounting and repacks the rest.
  3. `destroy()` disconnects the observer.
- **Files:** ~4: `src/create-tilespace.ts`, `test/mutation.test.ts`, PLAN, STATE.
- **References:** ARCHITECTURE "Request flow" 2.

### T2.6 · The demo page in a real browser
- **Status:** done (2026-11-23)
- **Goal:** the owner sees the engine on a real page, midway through M2.
- **Depends on:** T2.5.
- **In scope:**
  - `demo/` (Vite, like the playground) with a showcase of mixed Shapes and `prev` and `next`
    buttons.
  - Playwright pinned, with Chromium, and `npm run e2e` in the gate and in CI.
  - One e2e flow: mount, check that CSS grid places the Tiles where the Packing says, then
    `next`, then a resize.
- **Out of scope:** Transitions; the gallery and dashboard examples (T2.11).
- **Contract:** consumes the engine's public API.
- **Acceptance criteria:**
  1. The e2e test passes in CI: the Tiles' rendered boxes match their Placements.
  2. The owner checks the demo in the browser (the M2 midway check).
- **Files:** ~10: `demo/{index.html,main.ts}`, `e2e/mount.e2e.ts`, `playwright.config.ts`, root
  `package.json`, lockfile, `ci.yml`, README, ARCHITECTURE (the demo), PLAN, STATE.
- **References:** ARCHITECTURE "Stack" (Playwright), CONVENTIONS §5.

### T2.7 · The default Transition
- **Status:** done (2026-11-24)
- **Goal:** changing Space slides the Tiles, staggered, instead of swapping.
- **Depends on:** T2.6, DEC-10.
- **In scope:**
  - The default Transition: Web Animations on `translate` and `opacity`, along the axis, staggered
    by each Tile's Cell distance from the edge it enters from.
  - Visibility is handed over at the end, and nothing stays written.
  - A new request during a Transition finishes it at once and starts the next.
  - `destroy()` cancels it.
- **Out of scope:** custom, none and reduced motion (T2.8); the Drag (T2.10).
- **Contract:** none new.
- **Acceptance criteria:**
  1. `next()` runs Animations on the leaving and entering Tiles, and at the end only the new Space
     is visible, with no inline `translate` or `opacity` left.
  2. A second `next()` mid-Transition ends on the Space after.
  3. In the browser, the e2e flow sees the Animation run and finish.
- **Files:** ~6: `src/{create-tilespace.ts,default-transition.ts}`, `test/transition.test.ts`,
  `e2e/transition.e2e.ts`, PLAN, STATE.
- **References:** ARCHITECTURE "Request flow" 4, the 2017 stagger (ARCHITECTURE "Lessons").

### T2.8 · Custom, none and reduced-motion Transitions
- **Status:** done (2026-11-24)
- **Goal:** a developer replaces the Transition or turns it off, and reduced motion is respected.
- **Depends on:** T2.7.
- **In scope:**
  - `transition: (context) → Animation[]`, whose context holds the leaving and entering Tiles with
    their Placements, the direction and the Stage's size.
  - `transition: false` swaps instantly.
  - `prefers-reduced-motion` gives a short cross-fade.
  - A `transition` that is neither `false` nor a function throws a `tilespace:` error (moved here
    from T2.2, which had no such option yet).
  - The context holds copies of the Placements and the Grid (a user callback gets copies), and a
    Transition that throws leaves the move swapped instantly, not both Spaces showing (T2.7 review).
- **Contract:** the `TransitionContext` type, exported.
- **Acceptance criteria:**
  1. A custom Transition's Animations are played, then cleaned up.
  2. `false` swaps with no Animation.
  3. Reduced motion uses the cross-fade.
- **Files:** ~5: `src/{create-tilespace.ts,index.ts,default-transition.ts}`,
  `test/custom-transition.test.ts`, PLAN, STATE.
- **References:** DEC-10.

### T2.9 · The keyboard
- **Status:** done (2026-11-24)
- **Goal:** a user moves between Spaces with the arrow keys or Page Up and Down.
- **Depends on:** T2.7, DEC-11.
- **In scope:**
  - The keys, when focus is inside the Stage.
  - `axis` picks the arrow keys and the default slide's direction. A value other than
    `horizontal` or `vertical` throws a `tilespace:` error (moved here from T2.2, which had no such
    option yet).
- **Contract:** the `axis` option.
- **Acceptance criteria:**
  1. Each key moves once, only with focus inside the Stage.
  2. `destroy()` removes the listener.
- **Files:** ~10: `src/{create-tilespace.ts,keyboard.ts,default-transition.ts}`, `test/input.test.ts`,
  `e2e/input.e2e.ts`, the demo, PLAN, STATE, ARCHITECTURE.
- **References:** DEC-11.
- **Split:** the first version (keyboard and wheel) came to 458 lines; the wheel is T2.9b.

### T2.9b · The wheel
- **Status:** done (2026-11-24)
- **Goal:** one wheel gesture moves one Space.
- **Depends on:** T2.9, DEC-11.
- **In scope:**
  - One Space per wheel gesture, along the larger delta: trackpad momentum counts as one gesture,
    ended by a quiet gap. A gesture that moved nothing lets the page scroll.
  - A gesture that starts on something in a Tile that scrolls along it or handles it, and a pinch
    zoom, are left alone (T2.9 review).
- **Contract:** none new.
- **Acceptance criteria:**
  1. A burst of wheel events moves one Space.
  2. `destroy()` removes the listener and the gesture's timer.
- **Files:** ~8: `src/{create-tilespace.ts,wheel.ts}`, `test/wheel.test.ts`, `e2e/input.e2e.ts`,
  ARCHITECTURE, GOTCHAS, PLAN, STATE.
- **References:** DEC-11.

### T2.10a · A move is begin, then end
- **Status:** done (2026-11-24)
- **Goal:** the engine can build a Transition before deciding it, as the Drag needs.
- **Depends on:** T2.9b.
- **In scope:** a refactor of `create-tilespace.ts`: a move is `begin` (both Spaces showing, the
  Transition built) then `end` (the Current space, `data-ts-current` and `change`); `neighbour`
  out of `step`. No behaviour changes; the existing tests cover it.
- **Contract:** none.
- **Acceptance criteria:** 1. Every test passes unchanged.
- **Files:** ~3: `src/create-tilespace.ts`, ARCHITECTURE, PLAN.
- **Split:** from T2.10, whose first version came to 473 lines.

### T2.10 · The Drag scrubs the Transition
- **Status:** done (2026-11-24)
- **Goal:** a user drags a Space under the finger and lets go to commit or cancel.
- **Depends on:** T2.8, T2.9, DEC-10, DEC-11.
- **In scope:**
  - Pointer events past a threshold along the axis.
  - The Transition paused, with its `currentTime` following the distance.
  - On release, play forward past half the distance or on a flick, otherwise in reverse.
  - The click after a Drag is stopped in the capture phase.
  - `touch-action` for the other axis, restored on `destroy()`.
- **Contract:** none new.
- **Acceptance criteria:**
  1. A drag past half the distance commits, and a short slow one cancels.
  2. A flick commits.
  3. A click below the threshold reaches the Tile, and the one after a Drag doesn't.
  4. In the browser, the e2e flow drags with the mouse and commits.
- **Files:** ~5: `src/{create-tilespace.ts,drag.ts}`, `test/drag.test.ts`, `e2e/drag.e2e.ts`, PLAN,
  STATE.
- **References:** DEC-10, DEC-11, ARCHITECTURE "Request flow" 3.

### T2.11 · The demo: showcase, gallery and dashboard
- **Status:** done (2026-11-24)
- **Goal:** the owner checks the whole engine on the demo page (the M2 end check).
- **Depends on:** T2.10.
- **In scope:**
  - Three examples on the demo page: a showcase, a gallery of images, and a dashboard of widgets
    with their own inputs and state, which survive navigation.
  - Every input and Transition reachable from the page.
- **Contract:** consumes the engine.
- **Acceptance criteria:**
  1. An e2e flow types into a dashboard widget, moves away and back, and finds its value kept.
  2. The owner checks the demo in the browser (the M2 end check).
- **Files:** ~6: `demo/{index.html,main.ts,examples.ts}`, `e2e/demo.e2e.ts`, README, PLAN, STATE.
- **References:** PRODUCT "Headless, children keep their behaviour", ROADMAP M2.

### T2.12 · The fill direction follows the axis
- **Status:** done (2026-11-24)
- **Goal:** the Tiles gather at the edge the flow starts from, masonry included: column by column
  on a horizontal axis, as on the Xbox dashboard; row by row on a vertical one (the owner's M2 end
  check).
- **Depends on:** T2.11, DEC-08 (amended).
- **In scope:** the engine packs a horizontal axis transposed (columns and rows, and every Span,
  swapped) and transposes the Placements back; a vertical axis packs as `core` does today. `core`
  is unchanged. A custom `packer` gets the real Shapes and Grid.
- **Contract:** none new.
- **Acceptance criteria:**
  1. On a horizontal axis, 1x1 Tiles on a 2x2 Grid fill (0,0), (0,1), (1,0), (1,1) by column; on
     a vertical axis, by row.
  2. A `2x1` Tile keeps its Span on either axis.
  3. In the demo, the last Space's Holes are checked: at the end of the flow, or a follow-up slice
     adds a Score tie-break that puts them there.
- **Files:** ~6: `src/create-tilespace.ts`, `test/fill.test.ts`, ARCHITECTURE, PLAN, STATE, e2e.

### T2.13b · The owner's pace
- **Status:** done (2026-11-24)
- **Goal:** the default Transition reads clearly: slower, with a settle that visibly slides (the
  owner, after T2.13: "accelerated, and the translates don't show").
- **Depends on:** T2.13, DEC-10 (its numbers, as the owner chose).
- **In scope:** a 500 ms slide; each card settles in 450 ms from 40 px short, at most 80 ms apart
  and about 600 ms in all.
- **Contract:** none.
- **Acceptance criteria:** 1. The Transition's timings and distances are those numbers.
- **Files:** ~7: `src/default-transition.ts`, two tests, DECISIONS, ARCHITECTURE, PLAN, STATE.

### T2.12b · Holes at the end of the flow
- **Status:** done (2026-11-24)
- **Goal:** the last Space's Holes gather at the end of the fill's flow (the right on a horizontal
  axis), so a partly filled Space still looks balanced.
- **Depends on:** T2.12.
- **In scope:** found in T2.12's AC3: on the demo's second Spaces some Holes sit mid-flow (under
  Music in the showcase, under Delta and Reef in the gallery). A Score term that puts the Holes as
  late in the flow as it can; where it ranks against the Displacement is the slice's question.
- **Contract:** none new, or a fourth Score term.
- **Acceptance criteria:** 1. On the demo's second Spaces, no Hole comes before a Tile in the flow
  where a filling with the same Holes and Spans puts them all at the end.
- **Files:** ~5: `core/src/{pack-space.ts,score}`, its tests, PLAN, STATE.

### T2.13 · The Space moves, then the cards settle
- **Status:** done (2026-11-24)
- **Goal:** the default Transition reads as a page turn: the Space moves as one block, then its
  cards arrive (the owner's M2 end check).
- **Depends on:** T2.12, DEC-10 (amended).
- **In scope:** the default Transition in two phases: both Spaces slide by the Stage's size as one
  block (~300 ms, no stagger), then each entering Tile fades in with an 8 px slide (~200 ms), in
  its order within the Space along the fill's flow, at most 40 ms apart and ~300 ms for the whole
  cascade. The Drag scrubs the whole timeline as before.
  Reduced motion keeps the cross-fade.
- **Contract:** none new.
- **Acceptance criteria:**
  1. The leaving and entering Tiles slide the same distance in the same time, with no stagger.
  2. The entering Tiles settle after the slide, in their order within the Space.
  3. In the browser, the Transition runs and ends with nothing written.
- **Files:** ~6: `src/default-transition.ts`, `test/transition.test.ts`, `test/input.test.ts`,
  ARCHITECTURE, PLAN, STATE.

### T2.13c · The cards settle in reverse going back, and the demo's Holes and Gap
- **Status:** done (2026-11-24)
- **Goal:** going back, the Space's last card settles first (the owner); the demo lets the owner
  try `holes` and `gap`.
- **Depends on:** T2.12b (the `holes` option).
- **In scope:** the default Transition's settle order reversed when the direction is -1; Holes
  (`end`, `order`) and Gap controls in the demo. Split from T2.12b (17 files).
- **Contract:** none new.
- **Acceptance criteria:** 1. Going back, the Space's last Tile settles first. 2. The demo's Holes
  and Gap controls remount the Tilespace with those options.
- **Files:** ~6: `src/default-transition.ts`, `test/transition.test.ts`, the demo, PLAN, STATE.

### T2.14 · Peek: the neighbouring Spaces show beside the Stage
- **Status:** done (2026-11-24)
- **Goal:** like the Netflix rows, the edges of the Spaces before and after the Current one show
  beside the Stage, inside a container of the user's that clips (the owner, 2026-11-24).
- **Depends on:** T2.13c, DEC-06 and DEC-10 (amended).
- **In scope:**
  - `peek?: boolean` (default `false`). With it, the Stage doesn't clip (`overflow: visible`), and
    the Spaces just before and after the Current one (wrapping with `loop`) show at rest one Stage
    size plus the gap away along the axis (an inline `translate`), `inert`. The user's container
    clips how much of them shows. They are visual only in this first version (no click).
  - The default slide travels the Stage's size plus the gap, with or without `peek`, so the next
    Space arrives from where it rests; `TransitionContext` gains `gap`.
  - During a Transition, the Space beyond the entering one appears only at its end (first
    version).
  - The demo: a Peek checkbox; the Stages sit in a frame that clips, with room beside them.
- **Contract:** the `peek` option; `TransitionContext.gap`.
- **Acceptance criteria:**
  1. With `peek`, the neighbouring Spaces' Tiles are visible, `inert` and one Stage size plus the
     gap away; the others are hidden; `destroy()` puts everything back.
  2. After a move, the neighbours are the new Current space's.
  3. In Chromium, a neighbour Tile's box starts one Stage width plus the gap to the right, and the
     demo's frame clips it.
- **Files:** ~9: `src/{create-tilespace.ts,default-transition.ts,validate-options.ts}`,
  `test/peek.test.ts`, `e2e/peek.e2e.ts`, the demo, ARCHITECTURE, PLAN, STATE.

### T2.14b · The gap between Spaces
- **Status:** done (2026-11-24)
- **Goal:** the Spaces can sit farther apart than the Tiles (the owner, after T2.14).
- **Depends on:** T2.14, DEC-10 (amended).
- **In scope:** `spaceGap` (CSS pixels, `gap` by default): where a neighbour rests with `peek`, and
  how far beyond the Stage the default slide travels; `TransitionContext.gap` becomes `spaceGap`.
  The demo's Space gap field.
- **Contract:** the `spaceGap` option.
- **Acceptance criteria:** 1. With `spaceGap: 50`, a neighbour rests and the slide starts a Stage
  size plus 50 px away. 2. An invalid `spaceGap` throws before any write.
- **Files:** ~12: `src/{create-tilespace.ts,default-transition.ts,validate-options.ts}`, three
  tests, two e2e flows, the demo, DECISIONS, ARCHITECTURE, PLAN, STATE.

### T2.14c · The demo peeks inset or bleeding
- **Status:** done (2026-11-24)
- **Goal:** the owner sees both ways a page can clip `peek` (the owner, after T2.14b).
- **Depends on:** T2.14b.
- **In scope:** the demo's Peek becomes off / inset (the frame makes room inside the site's width,
  so the Stage shrinks) / bleed (the frame spans the screen and the Stage keeps a 1040 px site's
  width, so the neighbours fill the margins; on a vertical axis it leaves room above and below).
  The library is unchanged: both are the page's CSS. The demo's `minCellWidth` also caps the rows,
  so a tall Stage still has several Spaces.
- **Contract:** none.
- **Acceptance criteria:** 1. In Chromium at 1440 px, with bleed the Stage is 1040 px wide, the
  frame spans the screen, and the next Space starts a `spaceGap` past the Stage.
- **Files:** ~6: the demo, `e2e/peek.e2e.ts`, `e2e/input.e2e.ts`, PLAN, STATE.

### T2.14d · The demo bleeds past its container
- **Status:** done (2026-11-24)
- **Goal:** bleed keeps the container's width, whatever it is (the owner, after T2.14c).
- **Depends on:** T2.14c.
- **In scope:** the demo's Peek becomes off / inset / bleed (the Stage keeps its container's width
  and the neighbours spill past it, clipped by the screen; the nav covers the one above) / bleed,
  centred (T2.14c's bleed). The library is unchanged.
- **Contract:** none.
- **Acceptance criteria:** 1. In Chromium at 1440 px, with bleed the Stage is the container's width,
  the next Space starts a `spaceGap` past it, and the page does not scroll sideways.
- **Files:** ~5: the demo, `e2e/peek.e2e.ts`, PLAN, STATE.

## M3 · v1 release

### T3.1 · Hidden Spaces are inert
- **Status:** done (2026-11-24)
- **Goal:** at rest, a keyboard or screen-reader user reaches only the Current space's Tiles, even
  through a descendant that sets `visibility: visible` inside a hidden Tile (PRODUCT invariant
  "hidden and inert").
- **Depends on:** M2 (done), DEC-06.
- **In scope:**
  - `inert` on every Tile outside the Current space (the peeking neighbours already have it),
    removed when its Space becomes current, restored on `destroy()`.
  - During a move: the entering Tiles lose it in `begin`; the leaving Tiles get it in `begin` and
    lose it again if the move is cancelled; the `peek` branch of `begin` keeps the other Spaces'
    Tiles `inert`.
- **Out of scope:** ARIA attributes (T3.2).
- **Contract:** none (DEC-06 already lists `inert`).
- **Acceptance criteria:**
  1. At rest every Tile outside the Current space is `inert`, and none inside it the library made
     `inert` (a user's own stays), after mount and after each move, with and without `peek`.
  2. During a move only the entering Tiles are not `inert`; a cancelled Drag leaves the same Tiles
     `inert` as before it, and gives the focus back to where it was.
  3. In Chromium, a focusable child with `visibility: visible` inside a Tile of another Space is
     never reached by Tab (red today: it shows and takes focus).
  4. `destroy()` restores each Tile's own `inert`, set or not.
- **Files:** ~6, ~150 lines: `create-tilespace.ts`, `test/inert.test.ts` (new), `e2e/input.e2e.ts`,
  ARCHITECTURE, PLAN, STATE.
- **References:** PRODUCT "Engineering-critical invariants", DEC-06.

### T3.2 · The Stage is a labelled carousel region
- **Status:** done (2026-11-24)
- **Goal:** a screen reader names the Stage, and the demo shows how to announce the Current space.
- **Depends on:** T3.1, DEC-14.
- **In scope:** what DEC-14 decides: the Stage's `role`, `aria-roledescription` and an `aria-label`
  from a `label` option, each only where the user set none, restored on `destroy()`; the demo's
  live region, fed by the `change` event, as the recipe. A manual check in VoiceOver.
- **Out of scope:** ARIA on the Tiles (they are the user's, DEC-06); a live region of the library's.
- **Contract:** the `label` option (a string, `"Tiles"` by default), validated at mount.
- **Acceptance criteria:**
  1. After mount the Stage has DEC-14's attributes with `aria-label` `"Tiles"`, or the `label`
     given; an attribute the user set is kept.
  2. In Chromium, `getByRole("region", { name })` finds the Stage.
  3. A non-string `label` throws at mount.
  4. `destroy()` restores the Stage's ARIA attributes.
- **Files:** ~8, ~200 lines: `create-tilespace.ts`, `validate-options.ts`, `test/aria.test.ts`
  (new), `test/options.test.ts`, `e2e/aria.e2e.ts` (new), the demo, ARCHITECTURE, PLAN, STATE.
- **References:** DEC-06, DEC-14, the WAI-ARIA APG carousel pattern.

### T3.3 · The packages are publishable
- **Status:** waiting (T3.10)
- **Goal:** `npm pack` gives two tarballs a fresh project installs and imports, with types.
- **Depends on:** T3.10 (the order of M3: the site first), DEC-13, DEC-15.
- **In scope:** a `LICENSE` in each package folder (npm packs only the package's own) and at the
  root; in both `package.json`: version `1.0.0`, no `private`, `license`, `repository` (with
  `directory`, matching the GitHub repository for provenance), `description`, `keywords`,
  `sideEffects: false`, the `core` dependency as `^1.0.0`; a `scripts/check-pack.sh`, run by the
  gate, that packs both, installs them in a scratch project and imports each export, type-checked.
- **Out of scope:** the README of each package (T3.4a, T3.4b); publishing (T3.6).
- **Contract:** none.
- **Acceptance criteria:**
  1. Each tarball holds `dist`, `package.json` and `LICENSE` only (seen red with a test file left
     in `files`).
  2. The scratch project type-checks and runs an import of `createTilespace` and `pack`.
- **Files:** ~9, ~150 lines: three `LICENSE`, both `package.json`, the root `package.json`,
  `scripts/check-pack.sh`, ARCHITECTURE, PLAN, STATE.
- **References:** DEC-13, DEC-15.

### T3.4a · The README of `core`
- **Status:** waiting (T3.3)
- **Goal:** a developer packs Tiles with `@tilespace/core` from its README alone.
- **Depends on:** T3.3.
- **In scope:** `packages/core/README.md`: install, `pack`, every option, a custom Packer and Score,
  `validatePacking`, the errors; the root README points to it.
- **Out of scope:** the engine (T3.4b).
- **Contract:** none.
- **Acceptance criteria:**
  1. Every export of `core`'s `index.ts` and every `PackOptions` field is in the README (a test
     lists them, seen red with one removed).
  2. Each snippet runs as a test (`test/readme.test.ts`).
- **Files:** ~5, ~200 lines: the README, `test/readme.test.ts`, root `README.md`, PLAN, STATE.
- **References:** `packages/core/src/index.ts`, DEC-07, DEC-08, DEC-09.

### T3.4b · The README of `vanilla`
- **Status:** waiting (T3.2, T3.4a)
- **Goal:** a developer mounts a Tilespace from `@tilespace/vanilla`'s README alone.
- **Depends on:** T3.2, T3.4a.
- **In scope:** `packages/vanilla/README.md`: install, a first Stage, every option and event,
  `data-ts-shape`, a custom Transition, `peek` and clipping, ARIA, `label` and the announcing
  recipe, what the library writes, `destroy()`; the root README points to it.
- **Out of scope:** a docs site; the lab write-up (T3.5).
- **Contract:** none.
- **Acceptance criteria:**
  1. Every `TilespaceOptions` field and every event is in the README (a test lists them, seen red
     with one removed).
  2. The quick-start snippet, as a page, mounts in Chromium (`e2e/readme.e2e.ts`).
- **Files:** ~6, ~300 lines: the README, the listing test, `e2e/readme.e2e.ts`, root `README.md`,
  PLAN, STATE.
- **References:** `packages/vanilla/src/index.ts`, DEC-06, DEC-10, DEC-11, DEC-14.

### T3.5 · The lab write-up
- **Status:** waiting (T3.4b)
- **Goal:** the written answer to the lab's question: does a bounded depth-first search fill the
  Spaces better than first-fit, fast enough to repack on every resize?
- **Depends on:** T3.4b (the README links it).
- **In scope:** `npm run bench` again with today's Score (the `early` term costs ~32%); one timing in
  Chromium of a repack on resize on the demo; `docs/LAB.md` with the question, the method, the
  numbers, what the 2017 wall did, and the answer; the root README links it.
- **Out of scope:** changing the default Node budget (a new decision and slice if the numbers ask
  for it).
- **Contract:** none.
- **Acceptance criteria:**
  1. Each claim in `docs/LAB.md` names the table rows it rests on, pasted from the script's output.
  2. The resize timing is a median of repeated runs, with the machine named.
- **Files:** ~5, ~250 lines: `docs/LAB.md`, a timing script (`e2e/` or `bench/`), README, PLAN,
  STATE.
- **References:** decision 0001, CONVENTIONS §5 "Benchmarks", ROADMAP "The end goal".

### T3.6 · The first publish
- **Status:** waiting (T3.12, P2, P3)
- **Goal:** `npm install @tilespace/vanilla` works for anyone.
- **Depends on:** T3.12 (no v1 without the site, the owner 2026-11-24), DEC-15, P2, P3.
- **In scope:** `.github/workflows/release.yml`: on a `v*` tag, check that the tag matches both
  packages' version and that the tagged commit is on `main` (an ancestor of `origin/main`), run
  the gate, then `npm publish --provenance --access public` for `core`, then `vanilla`
  (`permissions: id-token: write`); `CHANGELOG.md` with 1.0.0. The owner pushes the tag `v1.0.0`;
  the agent then installs both from npm in a scratch project.
- **Out of scope:** automated versioning; trusted publishing (after the first publish, if the owner
  wants to drop the token); the site (T3.7a–T3.12), which follows.
- **Contract:** none.
- **Acceptance criteria:**
  1. Before publishing, a tag on a commit outside `main` or with a different version fails (seen
     red on a test tag with the publish step as `--dry-run`).
  2. After the owner's tag, both packages are on npm at 1.0.0 with provenance, and a scratch
     project installs and imports them.
- **Files:** ~5, ~120 lines: `release.yml`, `CHANGELOG.md`, README, PLAN, STATE.
- **References:** DEC-15.

### T3.7a · The site's pipeline to GitHub Pages
- **Status:** done (2026-11-24)
- **Goal:** an empty `site/` page builds in the gate and deploys to GitHub Pages from `main`.
- **Depends on:** T3.2, DEC-16; P4 for the deploy (T3.7c's AC3).
- **In scope:** `site/` as the private workspace package `tilespace-site` (root `workspaces`
  `["packages/*", "site"]`, so it builds after the packages; root `tsconfig.json` includes it),
  Vite with `base: '/tilespace/'`, importing `@tilespace/vanilla` by name (its `dist`: the site's
  dev server needs `npm run build` first); `.github/workflows/pages.yml` (on a push to `main`:
  `permissions: pages: write, id-token: write`, the `github-pages` environment,
  `configure-pages`, `upload-pages-artifact`, `deploy-pages`); Playwright gets a second
  `webServer`, `vite preview` of the site's build, and a project per page with its own `testMatch`
  and `baseURL` (the site's with `/tilespace/`).
- **Out of scope:** any styling or section (T3.7b on).
- **Contract:** none.
- **Acceptance criteria:**
  1. `npm run verify` builds `site/dist`, and `e2e/site.e2e.ts` loads it under `/tilespace/` with
     a mounted Tilespace (seen red with the base path wrong).
  2. Checked in T3.7c: after this merge the page is live at the Pages URL.
- **Files:** ~11, ~150 lines: `site/{package.json,tsconfig.json,vite.config.ts,index.html,src/main.ts}`,
  root `package.json`, `tsconfig.json`, `package-lock.json`, `pages.yml`, `playwright.config.ts`,
  `e2e/site.e2e.ts` (new), ARCHITECTURE, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` "Stack", DEC-16.

### T3.7b · The site's tokens, theme and header
- **Status:** done (2026-11-24)
- **Goal:** the page has the handoff's look in light and dark, with its header.
- **Depends on:** T3.7a.
- **In scope:** `tokens.css`, `base.css` (reset, type, the focus ring), `layout.css` (container,
  12 columns, sections, the three breakpoints); the fonts from Google Fonts with `display=swap`;
  the theme (system default, a toggle saved in `localStorage` in try/catch); the header's links,
  with the real GitHub URL. Split from the footer and the phone menu (T3.7c) at 533 lines.
- **Out of scope:** the phone menu and the footer (T3.7c); the sections (T3.8 on).
- **Contract:** none.
- **Acceptance criteria:**
  1. In Chromium the toggle switches the theme and the choice survives a reload; with no choice,
     `prefers-color-scheme: dark` gives the dark tokens.
  2. The header's GitHub link is the real repository.
- **Files:** 10, ~395 lines: `index.html`, `src/{main.ts,theme.ts}`, three style files,
  `e2e/site.e2e.ts`, PLAN, ROADMAP, STATE.
- **References:** `docs/site/HANDOFF.md` "Design tokens", row 0.

### T3.7c · The site's phone menu and footer
- **Status:** done (2026-11-24)
- **Goal:** the header works on a phone, and the page ends with the handoff's footer.
- **Depends on:** T3.7b.
- **In scope:** the phone's menu button opening the header's links as a sheet (`aria-expanded`,
  Escape closes it), and the footer (about, packages, links: GitHub, npm, the license).
- **Out of scope:** the sections (T3.8 on).
- **Contract:** none.
- **Acceptance criteria:**
  1. At 390 px the menu button opens the sheet with the same links, and Escape closes it.
  2. The footer links the real repository and its license.
  3. After the owner's P4, the page is live at the Pages URL (the PR links it).
- **Files:** ~7, ~250 lines: `index.html`, `src/{main.ts,menu.ts}`, `layout.css`,
  `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` rows 0 and 6.

### T3.8 · The site's hero wall
- **Status:** done (2026-11-24)
- **Goal:** the hero shows a live wall that bleeds past the screen's right edge and moves by
  buttons, keys, wheel and drag.
- **Depends on:** T3.7c.
- **In scope:** the hero's text, the install pill with Copy, the GitHub and npm buttons; the wall on
  `@tilespace/vanilla` with `peek` and the handoff's bleed, its Grid per breakpoint (10x4 at
  436 px, 8x4 on a tablet, 4x4 at 312 px on a phone; mounted again when a `matchMedia` breakpoint
  changes); the Stage is the region (`tabindex="0"`, `label` naming the keys), with no wrapper
  region; prev/next and one live "Space n of N" counter from the `change` and `pack` events
  (`ui/live-counter.ts`, DEC-14), updated when a move ends; static fallback tiles with JavaScript
  off.
- **Out of scope:** the playground (T3.9a on).
- **Contract:** none.
- **Acceptance criteria:**
  1. In Chromium at 1440 px the next Space shows past the container and the page does not scroll
     sideways; Next and the arrow keys move it, and the counter shows the packed count.
  2. Resizing from 1440 to 390 px mounts the 4x4 Grid.
  3. With JavaScript off the hero shows its fallback tiles with no broken layout.
- **Files:** ~8, ~300 lines: `index.html`, `demos/hero.ts`, `demos/tiles.ts` (new, the site's own
  factories in its tile colours; the demo keeps its own), `ui/live-counter.ts`, `components.css`,
  `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` row 1, "Motion and accessibility", DEC-14.

### T3.9a · The site's playground: the examples
- **Status:** waiting (T3.8)
- **Goal:** a visitor switches between Showcase, Gallery and Dashboard in a framed demo.
- **Depends on:** T3.8.
- **In scope:** the tablist (APG tabs: roving focus, `aria-selected`), the Showcase, Gallery and
  Dashboard factories in `demos/tiles.ts` (the Gallery's images as the owner decides), the framed
  Stage (8x4 at 480 px; 4x5 at 360 px on a phone, mounted again across breakpoints), prev/next and
  the counter, a note per tab, fallback tiles with JavaScript off.
- **Out of scope:** the control bar (T3.9b).
- **Contract:** none.
- **Acceptance criteria:**
  1. In Chromium, arrow keys move focus along the tabs and each tab mounts its example.
  2. A dashboard value survives a move away and back.
- **Files:** ~7, ~300 lines: `index.html`, `demos/playground.ts`, `demos/tiles.ts`,
  `components.css`, `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` row 3 and "Playground tabs".

### T3.9b · The site's playground: the control bar
- **Status:** waiting (T3.9a)
- **Goal:** a visitor tries every option on the examples.
- **Depends on:** T3.9a.
- **In scope:** the bar wired to the options (axis and peek off / inset / bleed as segmented
  buttons with `aria-pressed`, Transition select, gap and space gap sliders with a px readout,
  loop); the bar wraps below ~1100 px; on a phone it collapses to prev / counter / next and an
  Options disclosure (`aria-expanded`) with the same controls.
- **Out of scope:** the first section, the quick start, the lab (T3.10, T3.11).
- **Contract:** none.
- **Acceptance criteria:**
  1. In Chromium each control changes the mounted Tilespace (checked as in `e2e/demo.e2e.ts`).
  2. At 390 px the Options button reveals the same controls, and a swipe moves a Space.
- **Files:** ~6, ~300 lines: `index.html`, `demos/playground.ts`, `ui/segmented.ts`,
  `components.css`, `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` row 3.

### T3.10 · The site's first section
- **Status:** waiting (T3.9b)
- **Goal:** "Bring your own tiles" explains the idea.
- **Depends on:** T3.9b.
- **In scope:** the section's static markup and visuals (three columns; one on a phone).
- **Out of scope:** the quick start and the lab (T3.11).
- **Contract:** none.
- **Acceptance criteria:**
  1. No sideways page scroll at 360, 768, 1024 and 1440 px (beyond the hero's bleed).
- **Files:** ~4, ~150 lines: `index.html`, `components.css`, `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` row 2.

### T3.11 · The site's quick start and lab
- **Status:** waiting (T3.10, T3.5)
- **Goal:** the code shown is the code run, and the lab's answer is on the page.
- **Depends on:** T3.10, T3.5 (the lab card's numbers).
- **In scope:** one snippet source (the real API: `peek: true` with the page's CSS, DEC-16) that
  `demos/quickstart.ts` runs and the page prints; its live result with a counter, moving by keys,
  wheel and drag, and fallback tiles; the lab card in HTML/SVG with `docs/LAB.md`'s numbers (the
  first-fit time from its table, or the bar dropped), `role="img"` labels, and the link to
  `docs/LAB.md`.
- **Out of scope:** new benchmark numbers.
- **Contract:** none.
- **Acceptance criteria:**
  1. The printed snippet and the run one are the same string (a test compares them).
  2. Each number on the lab card is a row of `docs/LAB.md`.
  3. The result's counter shows the packed count and follows a move.
- **Files:** ~6, ~250 lines: `index.html`, `demos/quickstart.ts`, `components.css`,
  `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` rows 4 and 5, "Lab chart".

### T3.12 · The site's accessibility and motion checks
- **Status:** waiting (T3.11)
- **Goal:** the site meets the handoff's "Done when".
- **Depends on:** T3.11.
- **In scope:** `npx lighthouse` (accessibility) against `vite preview`; reduced motion, keyboard
  only and VoiceOver checked by hand and written in the PR; the fixes these find, within the size
  limit (more goes to a new slice).
- **Out of scope:** analytics, a backend.
- **Contract:** none.
- **Acceptance criteria:**
  1. Lighthouse accessibility is 100 on the preview build (the score in the PR).
  2. With `prefers-reduced-motion: reduce` every demo cross-fades (Playwright media emulation).
  3. Tab never lands in a hidden Space of any demo.
- **Files:** ~5, up to ~200 lines: the fixes, `e2e/site.e2e.ts`, PLAN, STATE.
- **References:** `docs/site/HANDOFF.md` "Done when", "Motion and accessibility".

## Later
- The Score's `early` term (T2.12b) has one example test, and the exhaustive oracle checks only the
  Holes: a property against an uncut oracle of the whole `[holes, spanRank, early, displacement]`.
  It costs ~32% per Space at 12x8 with 1x1 Tiles (1.7 → 2.3 ms at the default budget).
- The Drag (T2.10 review): tests for `pointercancel`, a second pointer and `transition: false`;
  leave a press to a Tile's handler or slider, and a touch to a Tile's scroller (as the wheel does).
- A guard for a derived Grid on a content-height Stage (GOTCHAS "DOM"), e.g. ignoring a resize the
  engine's own writes caused; T2.4 only documents that the Stage needs a height.
- T1.3 AC3 (two Tiles of one Shape never both tried at a Cell) has no test: a tie never replaces the
  best filling, so it is invisible at the public seam until `nodeBudget` exists. Proposal for T1.6:
  a budget that finds the optimum only with the Shape deduplication.
