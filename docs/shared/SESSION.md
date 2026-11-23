# How a session runs

One session works on **one slice** in **one repository** and ends with one pull request, or on a run
of slices one after another when the owner says "keep going" (§4). Follow the steps in order.

## 0. Slices
A slice is an entry in a repository's `docs/PLAN.md`: **one endpoint, one screen or one acceptance
criterion**, never a whole feature.

**Size limit:** a slice's pull request changes **at most 15 files and 400 lines** (added + removed).
Lockfiles, generated files and the `size_excluded` globs of `.agents/protected.json` don't count. CI
enforces it (`scripts/check-pr-size.py`). A slice that won't fit is split in `docs/PLAN.md` with the
owner before coding. The owner may waive the limit for one pull request with the `oversized-ok`
label; an agent never adds it.

**Status** (as written on `main`): `waiting (<ids>)` → `next` → `done (YYYY-MM-DD)`.
- `waiting (<ids>)` lists the slices and decisions in "Depends on".
- The session that starts a slice flips it to `next` once every dependency is done (slices, on the
  owning repository's `main`) or accepted (decisions).
- The slice's own pull request marks it `done`, so the status reaches `main` with the merge.

**Entry template.** Never start coding a slice whose entry is incomplete: complete it and ask the
owner to confirm.

```markdown
### X1.6 · Short name               <- X = the repository's slice prefix; milestone.number
- **Status:** waiting (X1.4) | next | done (2026-11-02)
- **Goal:** one sentence: what someone can do afterwards.
- **Depends on:** slice ids and decisions (DEC-nn).
- **In scope:** the behaviours, as a short list.
- **Out of scope:** what a reader might expect but this slice does not do.
- **Contract:** operations (method path → status, body, specific error codes) and schemas; client
  slices list the operations they consume. "None" when there is no contract.
- **Acceptance criteria:** numbered, observable; each becomes at least one test.
- **Files:** the files it expects to add or change, docs included (PLAN, STATE and any it updates);
  an estimate; over 15 → split it.
- **References:** design screens, decisions, docs sections.
```

## 1. Start
1. `git switch main && git pull` in every repository of the project.
2. Read the repository's `AGENTS.md`, `docs/STATE.md`, `docs/PLAN.md` (in Claude Code, the
   SessionStart hook prints the handoff and the current slice), the slice entry, the repository's
   `docs/CONVENTIONS.md`, and whatever the entry references. Read `PRODUCT.md`, `DECISIONS.md` and
   `CONTRACT.md` for what the slice touches.
3. Read the code nearest to what you will change and match it. After a context summary, do this
   again: if what you were told disagrees with the files on disk, the files win.
4. `git fetch`: if `origin/slice/<id>-…` exists, continue that branch: its review comments (§5), or
   its merge (§4.4) when the pull request is open and only waiting for it.
5. Check the dependencies. A proposed decision or an unfinished slice dependency: stop and ask the
   owner.
6. Restate the goal, scope and acceptance criteria in a few lines and wait for the owner's go (unless
   already given; "keep going" gives it, §4).
7. Branch `slice/<id>-<short-name>` from `main`.

## 2. Build
1. **Contract first** when the slice changes one: write the payloads and signatures, regenerate the
   contract, and check its diff against the entry.
2. **Test first** (`tdd` skill): one acceptance criterion, one failing test, the least code that
   passes. Then the next criterion.
3. Only what the entry asks (YAGNI). Ideas go to the "Later" list in `docs/PLAN.md`; defects found
   outside the scope go to `docs/STATE.md` "Known issues".
4. Wiring (routes, navigation, i18n, module dependencies, configuration) belongs to the slice that adds
   the feature.
5. Blocked (missing decision, design gap, slice too big, a rule that contradicts a higher document):
   stop and ask. Never improvise a product decision.
6. A hard bug or a check failing for no clear reason: the `diagnosing-bugs` skill.

## 3. Verify
1. The repository's gate passes (`AGENTS.md` "Commands").
2. Every acceptance criterion has a test that was seen red, and coverage stays at or above the
   floor (`docs/CONVENTIONS.md` §5; the gate checks it).
3. Run it once live (curl for an API; simulator or browser for a client; the binary for a CLI).
   For a page, read it as it loads before any scripted input.
4. The size check passes: `scripts/check-pr-size.py main`.
5. Self-review with the repository's `tilespace-code-review` skill and fix what it finds.
6. Run the `retro` skill; its proposals go in the pull request, never applied without the owner.
7. Update the docs on the branch: `docs/STATE.md` (what exists, known issues, the "Last session"
   handoff), `docs/PLAN.md` (this slice `done (<today>)`, "Later"), `docs/GOTCHAS.md` (new traps).

## 4. Pull request and merge
Nothing reaches `main` except a squash-merged pull request (DEC-04). Its title becomes the commit on
`main`, so `git log main` is the list of merged slices.

1. Commit on the slice branch, never on `main`: a short imperative subject; a body saying what
   changed, why and how it was verified.
2. `git push -u origin <branch>`. Never push to `main`; never force-push a branch with an open pull
   request (add commits).
3. Open the pull request: `gh pr create --base main --title "<type>(<id>): <name>" --body-file
   <filled .github/pull_request_template.md>`. The title follows Conventional Commits with the slice
   id as scope (`feat(X1.2): sign in with email`; types `feat`, `fix`, `refactor`, `perf`,
   `test`, `docs`, `build`, `ci`, `chore`, `revert`). The name is imperative and starts in
   lowercase; the rest is written normally, so acronyms and names keep their case
   (`fix(X2.1): keep API errors in RFC 9457`). No final period. CI checks it.
4. `gh pr checks <n> --watch`, then merge when **all** of these hold:
   - every check is green (a red one is fixed on the branch and step 4 starts again);
   - every `tilespace-code-review` finding is fixed, or listed under "Deviations and proposals";
   - no `hold` label, no review requesting changes, no unanswered comment (§5);
   - a pull request that changes what only the owner decides (`PRODUCT.md`, a decision's status, the
     roadmap or another slice's entry) has the owner's explicit ok, in the session or as an approval.

   Merge with `gh pr merge <n> --squash --delete-branch`. Never `--admin`, never a merge commit or
   a rebase merge.
5. `git switch main && git pull`, and check that the slice is `done (<today>)` on `main`.
6. Give the owner the merged pull request's link and the slices it unblocks, and stop, unless the
   owner said "keep going".

**Keep going.** When the owner says "keep going" (with "do the next slice", or later), step 6 does
not stop: start §1 again with the next slice of this repository's plan, without waiting at §1.6.
Stop, and give the owner the merged links and what is blocked, when:
- this repository's slices of the current milestone are done;
- the next slice needs an owner prerequisite, a proposed or open decision, a dependency its entry
  does not name, or a slice of another repository that is not done; first skip to the next slice
  in the plan's order that needs none of these;
- a check stays red after a real attempt to fix it, or a review asks for changes;
- the pull request needs the owner's explicit ok (product, decisions, roadmap);
- the owner says stop.
A context summary does not end the run: after it, §1.3 again, then carry on.

Only the owner adds the `oversized-ok` and `hold` labels. In Claude Code, `.claude/hooks/guard-git.py`
blocks pushes and commits to `main`, force-pushes and non-squash merges; in CI, the `main-via-pr` job
turns `main` red for any commit that did not come from a merged pull request.

**Docs-only changes** (accepting a decision, a plan change the owner asked for): branch `docs/<topic>`
in the repository that owns the file (shared docs: the hub), title `docs(<topic>): <what>`, same flow.

## 5. Review comments
Before the merge, on the same branch: fix each comment with new commits, re-run §3 for what changed,
push, and reply to each comment with what was done. After the merge, a comment becomes a fix in a new
pull request (or a slice in `docs/PLAN.md`); `main` is never rewritten.

## 6. Hotfix
A defect on `main` that cannot wait for the plan. The owner asks: "hotfix: <what is broken>".
1. §1 steps 1–3. Reproduce the defect, then restate it (how to reproduce, the probable cause, the
   intended fix) and wait for the owner's go. A hard one: the `diagnosing-bugs` skill.
2. Branch `fix/<short-name>` from `main`.
3. A test that reproduces the defect, seen red; then the smallest fix that turns it green. No
   refactoring or other changes alongside.
4. §3 in full: urgency skips no check.
5. §4, with the title `fix(<id>): <what>`, where `<id>` is the slice that introduced the defect, or
   `fix(<topic>): <what>` when none did. In `docs/STATE.md`, the "Last session" handoff, and the
   item removed from "Known issues" if it was there.

**Revert first** when the fix is not quick: branch `fix/revert-<short-name>`, `git revert <sha>` of
the merge that caused it (squash merges have one parent), title `revert(<id>): <what>`, §3 and §4.
The real fix follows as a hotfix or a slice.

## 7. Milestones
A milestone is planned before its first slice and closed after its last one, both in the hub, both
through a docs pull request that merges only after the owner's explicit ok.

**Plan** ("plan M<n>"; "grill me on <idea>" first, with the `grilling` skill, when the idea is still
open):
1. Read `PRODUCT.md`, `DECISIONS.md`, `ROADMAP.md` and every repository's `docs/STATE.md`.
2. Split M<n> into slices for all repositories together (§0): ordered by feature, each entry complete,
   with its dependencies and expected files.
3. One pull request per repository: `docs/plan-m<n>`, title `docs(M<n>): plan the slices`, the hub's
   with the `ROADMAP.md` map and order. Wait for the owner's ok.

**Close** ("close M<n>", once every M<n> slice is `done` on `main`):
1. Check M<n> against `ROADMAP.md`: what was promised, what landed, what moved to a later milestone.
   An undone slice stops the close: ask the owner.
2. Gather the Retro sections of M<n>'s merged pull requests (`gh pr list --state merged --search
   "M<n>"` in each repository, scopes `<PREFIX><n>.`): the proposals never applied, the ones that
   repeat, the "Known issues" still open.
3. Branch `docs/close-m<n>` in the hub, title `docs(M<n>): close the milestone`. The pull request
   lists the summary, the gathered proposals ranked most severe first, and the next milestone's open
   decisions and prerequisites. `ROADMAP.md` marks M<n> `done (<today>)`. Apply no proposal.
4. After the owner's ok and the merge, each accepted proposal is its own pull request in the
   repository it changes; then "plan M<n+1>".

## 8. Precedence
When documents disagree, the higher one wins; report the conflict. If the slice entry contradicts a
higher document, stop and ask.
1. `PRODUCT.md`
2. `DECISIONS.md` (accepted)
3. the design references (`docs/ARCHITECTURE.md` "Design references"), when the project has them
4. `CONTRACT.md`
5. the repository's `AGENTS.md` and `docs/ARCHITECTURE.md`
6. the repository's `docs/CONVENTIONS.md`
7. the slice entry
8. skills

`docs/STATE.md` and `docs/GOTCHAS.md` are facts about the code, not rules.
