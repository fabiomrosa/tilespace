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

## M2 · Vanilla engine and demo · done (2026-11-24)
`packages/vanilla` over the Stage's children, its inputs and Transitions, and a demo page. The owner
checks the demo in the browser midway (T2.6) and at the end (T2.11).

| Repository | Slices |
|---|---|
| `tilespace` | T2.1 mount a Stage and place its Tiles, T2.2 reject invalid options, T2.3 move between Spaces by API, T2.4 a responsive Grid, T2.5 repack when Tiles are added or removed, T2.6 the demo page in a real browser, T2.7 the default Transition, T2.8 custom, none and reduced-motion Transitions, T2.9 keyboard and wheel, T2.10 the Drag scrubs the Transition, T2.11 the demo: showcase, gallery and dashboard; split for size: T2.9b the wheel, T2.10a a move is begin then end; from the owner's end check: T2.12 the fill follows the axis, T2.12b Holes at the end of the flow, T2.13 the Space moves then the cards settle, T2.13b the owner's pace, T2.13c the cards settle in reverse going back, T2.14 peek, T2.14b `spaceGap`, T2.14c and T2.14d the demo's peek |

## M3 · v1 release
Hidden Spaces `inert`, ARIA on the Stage, the project's site on GitHub Pages from the owner's design
handoff, publishable packages with their READMEs, the lab write-up, then the first npm publish:
no v1 without the site (the owner). The owner pushes the release tag (T3.6).

| Repository | Slices |
|---|---|
| `tilespace` | T3.1 hidden Spaces are inert, T3.2 the Stage is a labelled carousel region, T3.3 the packages are publishable, T3.4a the README of `core`, T3.4b the README of `vanilla`, T3.5 the lab write-up, T3.7a the site's pipeline to GitHub Pages, T3.7b its tokens, theme and header, T3.7c its phone menu and footer, T3.8a its hero text, T3.8b its hero wall, T3.8c both ways, T3.13 the neighbours move with the slide, T3.14 the 2017 wall as a reference, T3.18 the default Transition is the Space's slide, T3.19 the demo's card effects, T3.20 the site's favicon, T3.21 the hero's cards cascade, T3.9a its playground's framed Showcase, T3.22 its tabs, Gallery and Dashboard, T3.9b its control bar, T3.9c its Cards select, T3.10 its first section, T3.11a its quick start, T3.11b its lab section, T3.15 its packages and their pages, T3.16 its install tabs, T3.17 its links and origin, T3.12 its accessibility and motion checks, T3.6 the first publish |

## Prerequisites (only the owner can do these)
- **P1** · The GitHub repository `tilespace`, `main` pushed, labels and squash settings
  (OWNER_PLAN §0). Needed by T0.1.
- **P2** · The npm organization `@tilespace` (or the unscoped fallback names, DEC-13), on an account
  with 2FA. Needed by the first publish (T3.6).
- **P3** · A granular npm access token with publish rights to `@tilespace` and "bypass 2FA" (npm has
  no classic automation tokens; a granular one lasts at most 90 days), as the repository secret
  `NPM_TOKEN`. Needed by T3.6; after it, trusted publishing can replace it.
- **P4** · GitHub Pages turned on for `tilespace`, with "GitHub Actions" as the source. Needed by
  T3.7a.

## Later milestones (split when they start)
- **M4 · React adapter** (a Tile component renders each child's wrapper, DEC-06). **M5 · Angular
  adapter.**

## Recommended order (one session at a time)
M0, M1 and M2 (done), then T3.1 → T3.2 → T3.7a → T3.7b → T3.7c → T3.8a → T3.8b → T3.8c → T3.13 → T3.14 → T3.18 → T3.19 → T3.20 → T3.21 → T3.9a → T3.22 → T3.9b → T3.9c → T3.10 → T3.3 → T3.4a → T3.4b → T3.5 → T3.11a → T3.11b → T3.15 → T3.16 → T3.17 → T3.12 → T3.6 (the owner tags v1.0.0), then
"close M3" and "plan M4".

## Open decisions (see DECISIONS.md)
| Id | Question | Status | Needed by |
|---|---|---|---|
| DEC-14 | ARIA on the Stage, and who announces the Current space | Accepted | T3.2 |
| DEC-15 | License, versions and how a release publishes | Accepted | T3.3, T3.6 |
| DEC-16 | The site in this repository, on GitHub Pages | Accepted | T3.7a |
