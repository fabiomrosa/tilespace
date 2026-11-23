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

## M0 · Foundations · done (2026-11-23)
The npm workspace with `packages/core` empty, TypeScript strict, format, lint, tests with coverage,
build, and the gate in CI.

| Repository | Slices |
|---|---|
| `tilespace` | T0.1 runnable skeleton |

## M1 · Core · done (2026-11-23)
Everything in `packages/core`, pure and DOM-free, and a playground that draws Packings. The owner
checks the Packings in the browser at the end (T1.10).

| Repository | Slices |
|---|---|
| `tilespace` | T1.1 pack one Space with fixed Spans, T1.2 reject invalid input, T1.3 flexible Shapes, T1.4 several Spaces and the last one, T1.5 order modes and Displacement, T1.6 the Node budget option, T1.7 the PRODUCT invariants as property tests, T1.8 custom Score and Packing validation, T1.9 benchmark against first-fit and the default Node budget, T1.10 the playground draws Packings |

## M2 · Vanilla engine and demo
`packages/vanilla` over the Stage's children, its inputs and Transitions, and a demo page. The owner
checks the demo in the browser midway (T2.6) and at the end (T2.11).

| Repository | Slices |
|---|---|
| `tilespace` | T2.1 mount a Stage and place its Tiles, T2.2 reject invalid options, T2.3 move between Spaces by API, T2.4 a responsive Grid, T2.5 repack when Tiles are added or removed, T2.6 the demo page in a real browser, T2.7 the default Transition, T2.8 custom, none and reduced-motion Transitions, T2.9 keyboard and wheel, T2.10 the Drag scrubs the Transition, T2.11 the demo: showcase, gallery and dashboard |

## Prerequisites (only the owner can do these)
- **P1** · The GitHub repository `tilespace`, `main` pushed, labels and squash settings
  (OWNER_PLAN §0). Needed by T0.1.
- **P2** · The npm scope `@tilespace` (or the unscoped fallback names, DEC-13). Needed by the first
  publish (M3).

## Later milestones (split when they start)
- **M3 · v1 release.** ARIA (a labelled region, the Current space announced, `inert` on the hidden
  Spaces), the docs, the lab write-up, the first npm publish.
- **M4 · React adapter.** **M5 · Angular adapter.**

## Recommended order (one session at a time)
M0 and M1 (done), then T2.1 → T2.2 → T2.3 → T2.4 → T2.5 → T2.6 (the owner's midway check) → T2.7 →
T2.8 → T2.9 → T2.10 → T2.11, then "close M2" and "plan M3" with the owner.

## Open decisions (see DECISIONS.md)
| Id | Question | Status | Needed by |
|---|---|---|---|
| – | None open | – | – |
