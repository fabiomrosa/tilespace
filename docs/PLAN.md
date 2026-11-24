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
- **Status:** next
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
- **Status:** waiting (T2.6)
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
- **Status:** waiting (T2.7)
- **Goal:** a developer replaces the Transition or turns it off, and reduced motion is respected.
- **Depends on:** T2.7.
- **In scope:**
  - `transition: (context) → Animation[]`, whose context holds the leaving and entering Tiles with
    their Placements, the direction and the Stage's size.
  - `transition: false` swaps instantly.
  - `prefers-reduced-motion` gives a short cross-fade.
  - A `transition` that is neither `false` nor a function throws a `tilespace:` error (moved here
    from T2.2, which had no such option yet).
- **Contract:** the `TransitionContext` type, exported.
- **Acceptance criteria:**
  1. A custom Transition's Animations are played, then cleaned up.
  2. `false` swaps with no Animation.
  3. Reduced motion uses the cross-fade.
- **Files:** ~5: `src/{create-tilespace.ts,index.ts,default-transition.ts}`,
  `test/custom-transition.test.ts`, PLAN, STATE.
- **References:** DEC-10.

### T2.9 · Keyboard and wheel
- **Status:** waiting (T2.7)
- **Goal:** a user moves between Spaces with the arrow keys, Page Up and Down, or one wheel gesture.
- **Depends on:** T2.7, DEC-11.
- **In scope:**
  - The keys, when focus is inside the Stage.
  - One Space per wheel gesture: trackpad momentum counts as one gesture, ended by a quiet gap.
  - `axis` picks the arrow keys. A value other than `horizontal` or `vertical` throws a
    `tilespace:` error (moved here from T2.2, which had no such option yet).
- **Contract:** the `axis` option.
- **Acceptance criteria:**
  1. Each key moves once, only with focus inside the Stage.
  2. A burst of wheel events moves one Space.
  3. `destroy()` removes the listeners.
- **Files:** ~5: `src/{create-tilespace.ts,keyboard.ts,wheel.ts}`, `test/input.test.ts`, PLAN, STATE.
- **References:** DEC-11.

### T2.10 · The Drag scrubs the Transition
- **Status:** waiting (T2.8)
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
- **Status:** waiting (T2.10)
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

## Later
- A guard for a derived Grid on a content-height Stage (GOTCHAS "DOM"), e.g. ignoring a resize the
  engine's own writes caused; T2.4 only documents that the Stage needs a height.
- T1.3 AC3 (two Tiles of one Shape never both tried at a Cell) has no test: a tie never replaces the
  best filling, so it is invisible at the public seam until `nodeBudget` exists. Proposal for T1.6:
  a budget that finds the optimum only with the Shape deduplication.
