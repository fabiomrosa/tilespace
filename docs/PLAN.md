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
- **Status:** waiting (T1.5)
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
- **Status:** waiting (T1.6)
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
- **Status:** waiting (T1.7)
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
- **Status:** waiting (T1.6)
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
- **Status:** waiting (T1.8)
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

## Later
- T1.3 AC3 (two Tiles of one Shape never both tried at a Cell) has no test: a tie never replaces the
  best filling, so it is invisible at the public seam until `nodeBudget` exists. Proposal for T1.6:
  a budget that finds the optimum only with the Shape deduplication.
