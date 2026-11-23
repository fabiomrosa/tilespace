# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid)` fills one Space, choosing for each Tile a Span of its Shape (clamped to the
Grid), with the best Score `[holes, spanRank]` that the depth-first search of DEC-08 finds under an
internal Node budget (1,000,000 steps).
Tiles that do not fit in Space 0 stay unplaced until T1.4. A Grid or Span that is not a positive
integer, or an empty Shape, throws a `tilespace:` error naming the value.

## Modules
- `packages/core` (`@tilespace/core`): `pack` (`pack.ts`, clamps and calls the search), `packSpace`
  (`pack-space.ts`, one Space, internal), `validate` (`validate.ts`, the input checks, internal),
  and the types `Span`, `Shape`, `Grid`, `Placement`, `Packing` (`packing.ts`).

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T1.3 (flexible Shapes):** each Tile tries every Span of its Shape in order; the
  Score is `[holes, spanRank]`; a filling with no Hole still stops the search (DEC-08), so the span
  rank only breaks ties among fillings with Holes.
- **Next:** T1.4 (several Spaces and the last one).
