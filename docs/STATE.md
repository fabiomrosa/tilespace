# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid)` fills one Space with each Tile's first Span (clamped to the Grid) with the
fewest Holes, by the depth-first search of DEC-08 under an internal Node budget (1,000,000 steps).
Tiles that do not fit in Space 0 stay unplaced until T1.4. A Grid or Span that is not a positive
integer, or an empty Shape, throws a `tilespace:` error naming the value.

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), `validate` (`validate.ts`, the input checks, internal),
  and the types `Span`, `Shape`, `Grid`, `Placement`,
  `Packing` (`packing.ts`).

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T1.2 (reject invalid input):** `pack` validates the Grid and the Shapes before
  packing; a Grid wider than 32 columns packs.
- **Next:** T1.3 (flexible Shapes).
