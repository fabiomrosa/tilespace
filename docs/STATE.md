# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid, { order, nodeBudget, score })` places every Tile, Space after Space with the
Tiles left (the last Space holds what remains). In each Space every Tile gets a Span of its Shape
(clamped to the Grid), with the best Score `[holes, spanRank, displacement]` that the depth-first
search of DEC-08 finds under the Node budget (`nodeBudget` steps per Space, 1,000,000 by default
until T1.9). `order: 'fill'` (default) may reorder Tiles at a Displacement cost; `'strict'` keeps
the Stage's order. A Grid or Span that is not a positive integer, an empty Shape, an unknown order
or a `nodeBudget` that is not a positive integer throws a `tilespace:` error naming the value. A
custom `score` replaces the default Score, with no cut and no stop at a filling with no Hole; a
filling that places no Tile never counts, so every Tile is still placed. `validatePacking(packing,
shapes, grid)` throws a `tilespace:` error naming the first broken invariant (for the engine to
check a custom Packer, M2). `npm run bench` compares `pack` with a first-fit baseline (`bench/`).
Property tests (`fast-check`, 500 runs) check the PRODUCT packing invariants on random Shapes and
Grids up to 4x4, and every Space's Holes against an exhaustive search (`test/exhaustive.ts`).

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), `validate` (`validate.ts`, the input checks, internal),
  `validatePacking` (`validate-packing.ts`), `PackOptions` (`pack.ts`), and the types `Span`,
  `Shape`, `Grid`, `Placement`, `Packing`, `Order`, `Score` (`packing.ts`).

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T1.9 (benchmark):** `npm run bench` (Node runs `bench/pack.bench.ts` directly);
  the default Node budget is 100,000 (`docs/decisions/0001-node-budget.md`). On the mix without 1x1
  Tiles the search leaves 0.50 Holes per Space on 12x8 against first-fit's 4.90. A larger budget can
  leave more Holes in later Spaces (the Space-by-Space priority).
- **Next:** T1.10 (the playground draws Packings), the last M1 slice and the owner's check.
