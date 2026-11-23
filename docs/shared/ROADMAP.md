# Roadmap

## The end goal
v1 is a published vanilla library and a demo page: `core` with the Packer (flexible Spans, both
Order modes, the Node budget, a custom Packer and Score), the vanilla engine over the user's own
elements with responsive Grids, every input and replaceable Transitions, accessibility basics, and a
written answer to the lab's question (does a bounded depth-first search fill the Spaces better than
first-fit, fast enough to repack on every resize?). React and Angular adapters follow v1.

## How to use this plan
- `docs/PLAN.md` holds the full entries of the slices and their status. Slice ids start with the
  repository's prefix: `T` (tilespace). This file is the map, the prerequisites and the
  order.
- Only the current milestones have slices. A later milestone is split into slices with the owner before its first slice starts: ordered by feature, with its
  prerequisites, and every entry with its expected files.
- A slice is one session and one small pull request (SESSION §0).
- The plan changes only with the owner, through a docs pull request.
- A milestone is planned before its first slice and closed after its last (SESSION §7); its heading
  then reads `M<n> · Name · done (YYYY-MM-DD)`.

## M0 · Foundations
The npm workspace with `packages/core` empty, TypeScript strict, format, lint, tests with coverage,
build, and the gate in CI.

| Repository | Slices |
|---|---|
| `tilespace` | T0.1 runnable skeleton |

## Prerequisites (only the owner can do these)
- **P1** · The GitHub repository `tilespace`, `main` pushed, labels and squash settings
  (OWNER_PLAN §0). Needed by T0.1.
- **P2** · The npm scope `@tilespace` (or the unscoped fallback names, DEC-13). Needed by the first
  publish (M3).

## Later milestones (split when they start)
- **M1 · Core.** Everything in `packages/core`, pure and DOM-free: the Grid and Shapes, one Space
  packed by the search with fixed Spans, then flexible Shapes, several Spaces and the last one, the
  Order modes and Displacement, the Node budget, a custom Packer and Score, the PRODUCT invariants
  as property tests, a benchmark against first-fit, and a playground that draws Packings. The owner
  checks the Packings in the browser at the end.
- **M2 · Vanilla engine and demo.** Mount over the Stage's children, the CSS grid and Placements,
  responsive Grids with `ResizeObserver`, repacking on added and removed children, `next`/`prev`/
  `goTo` and events, the default Transition, custom and no Transition, reduced motion, keyboard,
  wheel, the Drag scrubbing the Transition, the click guard, `loop`, `destroy()`, browser tests. A
  demo page (a showcase, a gallery, a dashboard). The owner checks it in the browser midway and at
  the end.
- **M3 · v1 release.** ARIA (a labelled region, the Current space announced, `inert` on the hidden
  Spaces), the docs, the lab write-up, the first npm publish.
- **M4 · React adapter.** **M5 · Angular adapter.**

## Recommended order (one session at a time)
T0.1, then "plan M1" with the owner.

## Open decisions (see DECISIONS.md)
| Id | Question | Status | Needed by |
|---|---|---|---|
| – | None open | – | – |
