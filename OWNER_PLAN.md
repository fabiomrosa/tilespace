# tilespace execution plan

Kept in the repository root (a lab has no workspace folder). The owner's runbook to launch, one session at a time. This file is not the source of the rules: the
map and the dependencies are in `docs/shared/ROADMAP.md`, and the full slices are in each
repository's `docs/PLAN.md`. If this file disagrees with them, they win.

## How each session works
1. Open the agent **inside the slice's repository** (`tilespace`) and say: "do the next slice", or "do the next slice, keep going" to have it
   chain slices until something needs you (SESSION §4).
2. The agent reads the plan, restates the goal and waits for your "ok".
3. It builds the slice with tests, opens the pull request, waits for CI and squash-merges it when
   every check is green. Then it gives you the link and stops, or starts the next slice when you
   said "keep going".
4. Read what landed in `git log main` or the merged pull requests. To stop a merge, add the `hold`
   label to its pull request; to waive the size limit once, add `oversized-ok`. Only you add labels.

A defect on `main` that cannot wait: "hotfix: <what is broken>". The agent reproduces it, waits
for your "ok", fixes it with a test in its own pull request, or reverts the merge that caused it
when the fix is not quick (SESSION §6).

Each milestone (SESSION §7): "grill me on <idea>" to stress-test it, "plan M<n>" to split it into
slices for every repository (you review the docs pull requests), and "close M<n>" after its last
slice: the agent checks what landed against the roadmap and gathers the retro proposals still open;
you choose which to apply, then "plan M<n+1>". Changes to what only you decide (product, decisions,
roadmap) merge only after your explicit ok.

## 0. Before the first slice
- [x] Fill `docs/shared/PRODUCT.md` and `ROADMAP.md` (drafted by the agent; review them).
- [x] Fill `docs/ARCHITECTURE.md`, the `Non-negotiable` section and the language line of `AGENTS.md`.
- [x] Accept DEC-06 to DEC-13 (`docs/shared/DECISIONS.md`).
- [ ] Initial commit in each repository, with the message `Initial commit`: the boilerplate's
      docs with this project's definitions, and no application code (that starts in slice 0.1).
      Push `main` to GitHub. This is the only direct push and the only commit outside
      Conventional Commits, and you run it yourself: `guard-git.py` blocks an agent committing
      on `main`.
- [ ] Protect `main` (pull requests only, the CI checks required) if the plan allows it: public
      repositories, or GitHub Pro/Team. On GitHub Free with private repositories it is not
      available; `guard-git.py` and the `main-via-pr` CI job stand in (DEC-04).
- [ ] Create the `oversized-ok` and `hold` labels.
- [ ] Squash merges only, with the pull request's title as the commit (without this, a one-commit
      pull request lands with its commit message, not its checked title):
      `gh repo edit <org>/<repo> --enable-squash-merge --enable-merge-commit=false
      --enable-rebase-merge=false --delete-branch-on-merge` and
      `gh api -X PATCH repos/<org>/<repo> -f squash_merge_commit_title=PR_TITLE
      -f squash_merge_commit_message=PR_BODY`.

## M0 · Foundations
- [ ] **tilespace:** T0.1 runnable skeleton → then "plan M1"

## Your prerequisites
See `docs/shared/ROADMAP.md` "Prerequisites": P1 (GitHub repository, before T0.1), P2 (npm scope,
before M3).
