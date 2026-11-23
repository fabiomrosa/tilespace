# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid, { order, nodeBudget })` places every Tile, Space after Space with the Tiles left
(the last Space holds what remains). In each Space every Tile gets a Span of its Shape (clamped to
the Grid), with the best Score `[holes, spanRank, displacement]` that the depth-first search of
DEC-08 finds under the Node budget (`nodeBudget` steps per Space, 1,000,000 by default until T1.9).
`order: 'fill'` (default) may reorder Tiles at a Displacement cost; `'strict'` keeps the Stage's
order. A Grid or Span that is not a positive integer, an empty Shape, an unknown order or a
`nodeBudget` that is not a positive integer throws a `tilespace:` error naming the value.
Property tests (`fast-check`, 500 runs) check the PRODUCT packing invariants on random Shapes and
Grids up to 4x4, and every Space's Holes against an exhaustive search (`test/exhaustive.ts`).

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), `validate` (`validate.ts`, the input checks, internal),
  `PackOptions` (`pack.ts`), and the types `Span`, `Shape`, `Grid`, `Placement`, `Packing`, `Order`
  (`packing.ts`).

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T1.7 (property tests):** five properties in `invariants.property.test.ts`, each with
  minimum counts about a third of the lowest seen over 8 runs. The Holes property checks every
  Space, the last too (stronger than PRODUCT): only that caught the T1.3 smallest-Span bound bug.
  The generator (Spans up to 3, up to 4 per Shape, Grids 2 to 4) was tuned until that bug failed
  every run.
- **Next:** T1.8 (custom Score and Packing validation) or T1.9 (benchmark).
