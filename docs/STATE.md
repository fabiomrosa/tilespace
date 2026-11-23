# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid)` fills one Space with each Tile's first Span (clamped to the Grid) with the
fewest Holes, by the depth-first search of DEC-08 under an internal Node budget (1,000,000 steps).
Tiles that do not fit in Space 0 stay unplaced until T1.4.

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), and the types `Span`, `Shape`, `Grid`, `Placement`,
  `Packing` (`packing.ts`).

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T0.1 (runnable skeleton):** the workspace, `packages/core`, Biome, Vitest with the
  80% line floor (CLI flags), and the CI `gate` job. No `vite` or `dev` script yet: the playground
  (T1.x) adds them.
- **2026-11-23, T1.1 (pack one Space with fixed Spans):** `pack` and the one-Space search; the
  occupancy is always a `Uint8Array` (no per-row bitmask: simpler, and fine for any width).
- **Next:** T1.2 (reject invalid input) or T1.3 (flexible Shapes); both depend only on T1.1.
