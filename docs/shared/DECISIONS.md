# Decisions

The register of product and cross-project decisions. **Accepted** entries are binding for every
repository. **Proposed** entries are the agent's recommendations waiting for the owner; until
accepted, a slice that depends on one must stop and ask.

To add a decision: append an entry with the next number, status Proposed, the decision, why, and
consequences. Only the owner changes a status to Accepted. Never edit an accepted decision; supersede
it with a new entry and mark the old one "Superseded by DEC-nn".

---

## DEC-01 · Small slices, merged by pull request — Accepted (owner, 2026-11-23)
Every change is one slice from a `docs/PLAN.md`, one session, one pull request of at most 15 files and
400 lines (SESSION §0). The agent squash-merges it once CI is green and its review is clean (SESSION
§4); the owner can stop any merge with the `hold` label and reads the result in `git log main`.
- **Why:** small diffs stay reviewable, the plan keeps sessions from drifting, and every merge leaves
  one titled commit on `main`.
- **Consequences:** CI enforces the size and the title; a slice that won't fit is split before coding.

## DEC-02 · Any coding agent can work on the project — Accepted (owner, 2026-11-23)
The instructions live in agent-neutral files: `AGENTS.md` (`CLAUDE.md` imports it), skills in
`.agents/skills/`, and the rules that must always hold as CI checks. `.claude/hooks/` repeat them
earlier for Claude Code only.
- **Why:** the workflow must not depend on one tool.
- **Consequences:** a rule that matters gets a CI check, not only a hook or a sentence.

## DEC-03 · YAGNI, KISS and test-first — Accepted (owner, 2026-11-23)
Build only what the current slice needs, test first, and add a mechanical check only when a real
mistake shows it is needed.

## DEC-04 · Nothing reaches main except a merged pull request — Accepted (owner, 2026-11-23)
No agent commits or pushes to `main`, force-pushes a branch under review, or merges around a red
check.
- **Why:** with merges automated, the pull request is the only record of what changed and why.
- **Consequences:** protect `main` (pull requests only, CI required) when the GitHub plan allows it;
  GitHub Free cannot protect a private repository's branches, so `guard-git.py` blocks it in Claude
  Code and the CI job `main-via-pr` flags it for any agent.

## DEC-05 · One name per component, `tilespace-<role>`, in every tool — Accepted (owner, 2026-11-23)
Each repository's name (`tilespace`) is also its local folder and the name of its project in every
provider (hosting, error tracking, analytics, builds) and in alerts. A new component is
`tilespace-<role>`, with a role noun that will not need renaming (`site` for a public site, `web`
only for a web version of an app).
- **Why:** outside the code host the organization is not shown, so a bare `site` or `admin` says
  nothing in a terminal tab, an alert or a provider's project list, and global names are often taken,
  which would give a component a second name.
- **Consequences:** a hostname or slug a provider forces differently is noted in that repository's
  README "Config".

## DEC-06 · The Tiles are the user's and stay the Stage's direct children — Accepted (owner, 2026-11-23)
The Stage's direct children are the Tiles, adopted as they are: never created, cloned, moved,
re-parented or changed inside. The library writes, and restores on `destroy()`:
- on the Stage: `display: grid`, the Grid's `grid-template-columns`, `grid-template-rows` and `gap`,
  `position: relative`, `overflow: clip` (`visible` with `peek`), `touch-action` for the Drag axis,
  and ARIA attributes;
- on each Tile: `grid-column`, `grid-row`, `visibility`, `inert`, the attributes `data-ts-space`,
  `data-ts-span` (`3x2`) and `data-ts-current`, and the CSS variables `--ts-cols` and `--ts-rows`
  (the chosen Span); with `peek`, a neighbouring Space's Tiles also get a resting `translate`
  (amended by the owner 2026-11-24).

Transitions run as Web Animations on the Tiles (DEC-10) and leave nothing written when they end.
- **Why:** the owner's core requirement: only the container is the library's, the content is the
  children's. A framework renders the Stage's children itself; moving them into wrappers would break
  React's and Angular's ownership of those nodes. The 2017 wall styled and loaded the panels' images
  itself, which tied it to one page.
- **Consequences:** all Spaces share one CSS grid on the Stage: Tiles of different Spaces overlap in
  the same Cells, and only the Current space's Tiles are visible. The user animates inside a Tile,
  not the Tile's own `translate` and `opacity` during a Transition. No default theme.

## DEC-07 · A Tile's Shape is a list of Spans of any size, in order of preference — Accepted (owner, 2026-11-23)
A Shape is one or more Spans `{ cols, rows }` of whole Cells. The engine reads it from the Tile's
`data-ts-shape` attribute (`"2x2 2x1 1x1"`) or from a `shape(tile, index)` option; without either a
Tile is `1x1`. A Span wider or taller than the Grid is clamped to it.
- **Why:** the 2017 wall had fixed types, so any Tile that did not fit left a Hole. Letting a Tile
  shrink or grow is what makes full Spaces the rule. Clamping keeps responsive Grids working when the
  columns drop below a Tile's width.
- **Consequences:** constraints by aspect ratio or area come later as a function that returns a
  Shape for the current Grid; the Packer only ever sees Spans.

## DEC-08 · The Packer: depth-first branch and bound, Space by Space — Accepted (owner, 2026-11-23)
The Packer fills one Space at a time, in order, with the Tiles left. For each Space it searches
depth-first: take the first empty Cell along the flow (column by column on a horizontal axis, as
on the Xbox dashboard, so the Tiles gather at the left and Holes fall at the end; row by row on a
vertical axis; DEC-11, amended by the owner 2026-11-24), try each candidate Tile with each Span of its
Shape that fits there, then a Hole; recurse; keep the best complete filling by the Score, compared
in order: Holes, then the sum of Span preference ranks, then how early in the flow the Holes sit
(so they gather at its end; amended by the owner 2026-11-24), then the Displacement. The option
`holes: "order"` puts the Displacement before the Holes' place instead (`"end"` is the default). A branch is cut when
its Holes so far plus the Cells the remaining Tiles cannot cover already reach the best; a Space
with no Hole stops the search. The search stops after the Node budget and keeps the best filling
found. Candidates: in `fill` mode (the default) the earliest remaining Tile of each distinct Shape;
in `strict` mode only the next Tile. The Packer and the Score are options; a custom Packer is any
pure `(shapes, grid) → Packing`.
- **Why:** the problem is packing rectangles in a grid, an exact-cover search, and the priority is
  Space by Space, so solving each Space with what is left is the priority itself. Breadth-first
  search keeps every partial Grid of a level in memory; Dijkstra and A* are shortest-path searches
  over a state space too large to keep a frontier; depth-first search with a bound needs memory only
  for its depth. Taking the first empty Cell removes duplicate fillings, and branching by Shape
  rather than by Tile keeps the branching factor at the number of distinct Shapes.
- **Consequences:** the Packer is pure and deterministic, tested with property tests and
  benchmarked against first-fit (the lab's question). The Node budget bounds every run, so a large
  Grid never blocks a frame; the Packing may then be good, not optimal.

## DEC-09 · Fill by default; reorder at a Displacement cost — Accepted (owner, 2026-11-23)
`order: 'fill'` (default) lets the Packer move a Tile to another place or Space when that fills
better, preferring, among equal Holes and Span ranks, the filling that moves Tiles least.
`order: 'strict'` keeps the Stage's order, so the Packer only chooses Spans and Holes.
- **Why:** full Spaces are the product's point; the Displacement cost keeps the result close to the
  order the user wrote, and the strict mode covers lists whose order matters (a ranking, a timeline).
- **Consequences:** in `fill` mode the reading order on screen may differ from the DOM order;
  keyboard focus follows the DOM, so the engine exposes the visual order (`data-ts-*`) for the user
  who wants it.

## DEC-10 · Transitions are Web Animations on the Tiles, scrubbed by the Drag — Accepted (owner, 2026-11-23)
Changing Space runs a Transition: a function `(context) → Animation[]` given the leaving and
entering Tiles with their Placements, the direction and the Stage's size. The default moves in two
phases (amended by the owner 2026-11-24): the Space slides along the axis as one block, the leaving
Tiles out and the entering ones in, one Stage size plus the `spaceGap` apart (`gap` by default;
the owner, 2026-11-24); then each entering Tile
settles with a fade and a short slide,
in its order within the Space along the fill's flow (CSS `translate` and `opacity`). The owner's
pace (2026-11-24): a 500 ms slide, then each Tile settles in 450 ms from 40 px short, at most 80 ms
apart and about 600 ms in all. `transition: false` swaps instantly; `prefers-reduced-motion` uses a short cross-fade. During a Drag the Animations are paused
and their `currentTime` follows the pointer; on release they play forward (commit) or in reverse
(cancel). No animation library.
- **Why:** the 2017 wall needed TweenMax. Web Animations can be paused, scrubbed, reversed and
  cancelled, so the same Transition serves a button, a key and a finger, and a custom one gets the
  Drag for free. Animating `translate`, not `transform`, leaves the user's own transform alone.
- **Consequences:** a custom Transition must return Animations that are not finished; the engine
  owns their playback and cancels them on `destroy()`.

## DEC-11 · Input: API, keyboard, wheel and pointer drag; a drag swallows only its own click — Accepted (owner, 2026-11-23)
`next()`, `prev()` and `goTo(space)`; arrow keys and Page Up/Down when focus is inside the Stage;
one Space per wheel gesture (trackpad momentum is one gesture); a pointer Drag along the axis
(`horizontal` by default, or `vertical`) that commits past a distance or a flick velocity. A `loop`
option wraps from the last Space to the first. Past the drag threshold, the next `click` is stopped
in the capture phase; below it, the click reaches the Tile.
- **Why:** the owner wants every input in v1; one code path for mouse, touch and pen. Tiles keep
  their own clicks (DEC-06).
- **Consequences:** the Stage sets `touch-action` for the other axis, or a touch drag scrolls the
  page.

## DEC-12 · Vanilla first, then React and Angular — Accepted (owner, 2026-11-23)
`core` (no DOM) and the engine are plain TypeScript with no dependencies. The vanilla engine ships
first; React and Angular adapters come after v1 as thin layers over the same core and engine: React
renders the children and the engine places them through refs, with no re-render per frame; Angular
projects them with `<ng-content>` and runs the engine outside the zone.
- **Why:** one implementation of the behaviour, tested once; adapters only bind it.
- **Consequences:** nothing in `core` or the engine imports a framework; the engine accepts an
  already-rendered Stage and follows its children as they are added and removed.

## DEC-13 · One repository, an npm workspace of packages — Accepted (owner, 2026-11-23)
`packages/core`, `packages/vanilla`, then `packages/react` and `packages/angular`, each created by
the slice that first needs it, with one gate (`npm run verify`) over all of them. Published as
`@tilespace/core`, `@tilespace/vanilla`, `@tilespace/react`, `@tilespace/angular`; if the scope is
taken, `tilespace` (core and vanilla), `tilespace-react`, `tilespace-angular`.
- **Why:** the adapters change together with core; one repository keeps one plan, one CI and atomic
  changes across packages.
- **Consequences:** the scope is confirmed before the first publish (P2).

---

## Proposed (waiting for the owner)

## DEC-14 · The Stage is a labelled carousel region; the user announces the Current space — Accepted (owner, 2026-11-24)
The Stage gets `role="region"`, `aria-roledescription="carousel"` and an `aria-label` from a
`label` option (`"Tiles"` by default), each only where the user set none. The library writes no
ARIA on the Tiles and no live region: the user announces the Current space from the `change` event
in a live region of their page, the recipe the demo and the README show.
- **Why:** this is the outer part of the WAI-ARIA APG carousel pattern. Its per-slide groups need an
  element per Space, which the Stage doesn't have (DEC-06), and a live region of the library's would
  be a new child of the Stage, a Tile. APG makes the slides' container `aria-live="polite"`, but on
  the Stage that would announce every change inside any Tile (a dashboard's counter), every repack
  on resize, and a whole Space's content at once, while screen readers announce content revealed by
  `visibility` or `inert` unreliably.
- **Consequences:** "the Current space announced" (ROADMAP) is the user's live region, fed by
  `change` (`current`, and the `pack` event's `spaces`); a user who wants APG's behaviour sets
  `aria-live="polite"` on the Stage.

## DEC-16 · The site lives in this repository as `site/`, on GitHub Pages — Proposed
The project's site is a package of this workspace, `site/`, built with Vite from the owner's Claude
Design handoff (`docs/site/HANDOFF.md`) and deployed to GitHub Pages by a workflow on each push to
`main`. Its demos import `@tilespace/vanilla` by name, so the site always runs the current build.
Where the handoff and an accepted decision disagree, the decision wins: the Transition keeps
DEC-10's pace (the handoff's 420 ms and 180 ms are "starting values"), and peek is the boolean
option plus the page's CSS, as in the demo.
- **Why:** one repository keeps the site and the library changing together (DEC-13); a static
  build needs no provider beyond GitHub.
- **Consequences:** the owner turns on Pages with "GitHub Actions" as the source (P4); the site's
  checks join the gate; `demo/` stays the e2e test bed.

## DEC-15 · MIT, lockstep versions, published from CI on a tag — Accepted (owner, 2026-11-24)
Both packages are MIT, share one version (1.0.0 first) and publish from a GitHub Actions workflow
when the owner pushes a `v*` tag, with npm provenance.
- **Why:** MIT is the common license for a small UI library and the lab has no business model;
  one version keeps `vanilla`'s `core` range trivial; provenance ties each tarball to its commit, and
  only the owner decides a release.
- **Consequences:** the workflow needs `id-token: write`, and each package's `repository` matches
  the GitHub repository; an npm token in the repository's secrets for the first publish (P3), which
  trusted publishing can replace afterwards; a changelog entry per release.
