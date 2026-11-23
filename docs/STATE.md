# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks.
`pack(shapes, grid, { order })` places every Tile, Space after Space with the Tiles left (the last
Space holds what remains). In each Space every Tile gets a Span of its Shape (clamped to the Grid),
with the best Score `[holes, spanRank, displacement]` that the depth-first search of DEC-08 finds
under an internal Node budget (1,000,000 steps). `order: 'fill'` (default) may reorder Tiles at a
Displacement cost; `'strict'` keeps the Stage's order. A Grid or Span that is not a positive
integer, an empty Shape or an unknown order throws a `tilespace:` error naming the value.

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
- **2026-11-23, T1.5 (order modes and Displacement):** Displacement is the sum over Tiles of
  |reading position − Stage index|, the reading position counting across Spaces in Placement order;
  `strict` tries only the next Tile at each Cell. Like the span rank, it only breaks ties among
  fillings with Holes (DEC-08 stops at a filling with none).
- **Next:** T1.6 (the Node budget option).
