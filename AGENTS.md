# tilespace

A headless TypeScript library that packs the user's own elements, as Tiles of any span, into the pages of a grid and moves between those pages like desktop workspaces: `core` (the packing, no DOM), the vanilla engine, then the React and Angular adapters, as packages of one npm workspace. It owns the grid, the Tile containers and the transitions; it never creates, styles or changes a Tile's content.
The shared docs live in `docs/shared` (start with its `README.md`); `docs/shared/SESSION.md` applies
to every session here. Slice ids in this repository start with `T`.

## Principles
Follow YAGNI and KISS strictly, in code and in communication.
- **Code:** build only what the current slice needs, with the simplest solution that works. No
  abstraction, configuration or generalization "for later".
- **TDD:** write the test first and watch it fail, then write the least code that passes (`tdd` skill).
- **Communication:** short, direct answers. No options that won't be followed, no explanations nobody
  asked for.
- **Language:** code, identifiers, comments and docs in English, with the terms of the ubiquitous
  language (`docs/shared/PRODUCT.md`). The library has no user-facing text of its own besides ARIA
  labels the user can override; the demo's copy is English. Conversations with the owner may be in
  Portuguese.
- **Design:** low coupling, high cohesion; the layering of `docs/CONVENTIONS.md` §1.
- **Docs:** every document lives in `docs/`; update what is there before creating something new.
- **Small pull requests:** at most 15 files and 400 lines (SESSION §0). Split the slice before coding
  if it won't fit.

## Read before working
1. `docs/STATE.md` (what exists, the last handoff) and `docs/PLAN.md` (the current slice; work only
   on it).
2. `docs/ARCHITECTURE.md` and `docs/CONVENTIONS.md`: **the file layout, naming and patterns. Match
   them exactly.**
3. The public API of the package you touch (its `src/index.ts`): a change to it is listed in the
   pull request's "Public API" section.
4. `docs/GOTCHAS.md` before touching the parts of the stack it lists.
5. The skills that match the task, in `.agents/skills/<name>/SKILL.md`. If your agent does not load
   skills by itself, open the matching `SKILL.md` before the task:

   | Skill | When |
   |---|---|
   | `tilespace-code-review` | before opening the pull request (mandatory) |
   | `tdd` | building any behaviour |
   | `diagnosing-bugs` | a hard bug, a check failing for no clear reason, a slowdown |
   | `writing-for-agents` | editing docs, `AGENTS.md` or skills |
   | `retro` | the end of every slice |
   | `grilling` | when the owner wants a plan stress-tested |

   `tdd`, `diagnosing-bugs`, `retro`, `grilling` and `writing-for-agents` are shared and live in
   `tilespace/.agents/skills/`. A new or renamed skill updates this table in the same pull request.

## Non-negotiable
- TypeScript strict, ES modules, no runtime dependencies in `core` or the engine (no animation
  library: DEC-10).
- `core` never touches the DOM or a framework; the engine never imports a framework (DEC-12).
- The Packer is a pure, deterministic function: Shapes and Grid in, a Packing out; every search loop
  is bounded by the Node budget (DEC-08).
- The user's Tiles are adopted, never created, cloned, moved or re-parented; the library writes only
  what DEC-06 lists and restores it on `destroy()`.
- Placement is CSS grid (`grid-column`/`grid-row`), never computed pixel positions; Transitions are
  Web Animations on `translate` and `opacity`; no layout read after a style write in the same frame.
- Never `innerHTML` with user values.
- Every listener, observer and Animation the library adds is removed by `destroy()`.
- A performance claim in a pull request comes with a benchmark or a trace.
- Generated and frozen files are listed in `.agents/protected.json`; regenerate them, never edit them.

## Commands
- **Gate:** `npm run verify`: one command that runs everything CI runs here (format, lint, types, tests
  with the coverage floor, build). CI runs it, plus the title, size, frozen-files and secret
  (gitleaks) checks.
- **Pull requests:** push the slice branch, open the pull request with `gh`, and squash-merge it
  yourself once every check is green (SESSION §4). Nothing reaches `main` any other way (DEC-04).
- **Install:** `npm ci`. **Test:** `npm test`. **Format and fix lint:** `npm run format`.
- **Playground:** `npm run dev` (Vite, `playground/`).
- Packages live in `packages/<name>`; root scripts run over all of them.
