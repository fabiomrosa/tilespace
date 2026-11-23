---
name: tilespace-code-review
description: The tilespace review checklist. Use when about to open any tilespace pull request (mandatory), or when asked to review tilespace code or a diff.
---

# tilespace-code-review

Review as a reader who did not write the change. If your agent can start a subagent, start one with a
fresh context (not a fork of this conversation) and give it this skill, the slice entry and the diff,
without your summary of the change. Otherwise reread the slice entry before the diff.

Run `git diff main...HEAD --stat` and read every changed file. Answer each item with yes/no + file
reference. Any "no" is fixed before the pull request (or explicitly listed as a deviation in it).

## Scope
- [ ] `scripts/check-pr-size.py main` passes (≤15 files, ≤400 lines).
- [ ] The title is `<type>(<slice id>): <name>`, the name starts in lowercase, and the type matches the change (SESSION §4).
- [ ] Nothing beyond what the entry asks (YAGNI): no unused abstraction, configuration or parameter.
- [ ] Every change serves the current slice entry; nothing from "Out of scope"; extras moved to
      PLAN "Later".

## Layout and naming (CONVENTIONS)
- [ ] Each file has one role, named by its suffix, in the place CONVENTIONS gives it.
- [ ] No module reaches into another module's internals.
- [ ] `core` imports nothing from the DOM, the engine or a framework; the engine imports no framework.
- [ ] The packer is a pure function of the Tiles and the grid; no state, no DOM.

## Packing (PRODUCT invariants)
- [ ] No overlap, every Tile in bounds and placed once with a Span of its Shape; the property test
      checks it for random Shapes and Grids.
- [ ] No Space but the last has a Hole the remaining Tiles could fill (checked against an exhaustive
      search on small Grids); `strict` keeps the Stage's order.
- [ ] Every search loop is bounded by the Node budget; the same input gives the same Packing.

## DOM and performance
- [ ] The library never creates, clones or changes the inside of a Tile's content; `destroy()` puts
      back everything it wrote.
- [ ] No layout read after a style write in the same frame.
- [ ] Every listener added is removed by `destroy()`.

## Public API
- [ ] Changes to a package's `src/index.ts` are listed in the pull request, additive or breaking.
- [ ] A user callback (a Score, a Packer, an event handler) gets copies, never the
      library's own objects it could change.

## Security and privacy
- [ ] No secrets in the code, the demo or the logs; no `innerHTML` with user values.

## Docs
- [ ] `docs/STATE.md` (capabilities, modules, last session), `docs/PLAN.md` status
      (`done (<date>)`), decisions if any, `README.md` if run/config changed, `docs/GOTCHAS.md` for
      new traps, `docs/ARCHITECTURE.md` if what it describes changed.

## Tests
- [ ] Every acceptance criterion has a test that was seen red (test-first, or the rule broken once).
- [ ] Each test exercises what runs, not a declaration the runtime may ignore (break the code once if
      unsure).
- [ ] A mistake this review keeps finding is proposed as a check in the retro.

## Output
Findings for the pull request's Review section. Each one gives the location (`file:line`), the input
or state that triggers it, the impact, and the smallest fix; one not demonstrated is marked as a
hypothesis. "No findings" is a valid result: never invent one to fill the list. After fixes, review
the new diff: a fixed finding is checked again, not assumed.

## Rationalizations
| Rationalization | Reality |
|---|---|
| "It's only docs or config." | Scope, size and the checklist still apply. |
| "The build is green." | Green proves only what the checks check; ask whether each one could fail. |
| "I wrote it, so I know it's right." | That is why the pass reads as someone else. |
