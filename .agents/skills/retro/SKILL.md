---
name: retro
description: Retrospective at the end of a slice: proposes improvements to the environment (checks, conventions, docs, skills, hooks) for future sessions. Use when a slice ends (SESSION §3.6), when a milestone closes (SESSION §7) or when asked for a retro.
---

You are suggesting improvements to the coding agent's **environment** so future sessions go better.
You propose; the owner decides. Nothing here is applied without the owner.

## Steps

1. Read the `writing-for-agents` skill (`.agents/skills/writing-for-agents/SKILL.md`) for the writing
   style guide.

2. Read the primary sources for the session: by default the current one (the conversation, the slice
   branch's commits and the pull request), unless the owner names another.

3. Look for candidates for improvement in these categories.

- **Navigation**: how easy was it to find the right files? Are there hidden dependencies between
  files? Would a **navigation pointer** in `AGENTS.md` or a doc make it easier? _Use when_ the session
  took a long time to find a piece of information.
- **Automated checks**: is there a check that could have caught a mistake made in the session? Read
  the existing gate first (the project gate in `AGENTS.md`, and the CI workflow), so a check
  that exists but sits unwired or silently broken is the finding, not a reinvention. _Use when_ the
  agent made a mistake a check could have caught. Propose a check only for a mistake that actually
  happened (YAGNI): never for one that only might.
- **Conventions**: should the review step (`tilespace-code-review`) enforce a new rule, or should a rule be
  removed or clarified? Classify the violation first. A **mechanical** one (a fixed pattern, a banned
  API, an import shape, a file location) gets the simplest deterministic check that catches it (a
  test or lint rule, seen red once). Reserve
  `docs/CONVENTIONS.md` **[review]** rules for genuine **judgement calls**. _Use when_ the review
  missed a mistake.
- **AGENTS.md**: are there instructions that belong in CONVENTIONS, a skill or a check instead?
  `AGENTS.md` is loaded in every session; keep it to navigation pointers and the non-negotiables.
  _Use when_ it grows.
- **Pull request size**: was the pull request over or near the limit (SESSION §0)? Should the slice
  have been split, or the limit changed? _Use when_ the diff was hard to review.
- **Gotchas**: did the session lose time to a trap no document mentions? It goes to
  `docs/GOTCHAS.md`. _Use when_ something non-obvious about the stack or the machine cost time.
- **Tool economy**: did the agent make expensive tool calls that could be streamlined? _Use when_ the
  agent made an expensive tool call.
- **No-ops**: instructions in the docs or skills that do not change behaviour. _Use when_ a document
  is large and unwieldy.
- **Information access**: a crucial piece of information the agent could not reach (logs, a running
  service, another repository). _Use when_ the agent had to guess.

4. Put the candidates in the pull request's **Retro** section, most severe first, each with the
   file it would change. Apply none of them.

## Reference

### Implementation vs review

All work goes through implementation and review. The implementation step has the most **context
pressure**: exploration, code, debugging. The review step (`tilespace-code-review`, then the owner's
review on GitHub) receives a diff and has the least. So the review step imposes the standards, and
the implementation step follows the written conventions.

### Where things belong

- `AGENTS.md` (per project; `CLAUDE.md` imports it): loaded into every session. Navigation pointers
  and the non-negotiables only.
- `docs/CONVENTIONS.md`: the rules, each tagged with how it is enforced (a test or lint rule, or
  review).
- `docs/shared/` (in the hub repository): product, decisions, process, contract. Changed through a
  docs pull request in the hub (SESSION §4).
- `docs/GOTCHAS.md`: facts and traps about the stack.
- Skills: working checklists that point to the docs; their description is always loaded, so keep
  descriptions tight. Follow `writing-for-agents`.
- CI checks (`.github/workflows/ci.yml`, `scripts/`): blocks on files that must never be edited by
  hand, for any agent. `.claude/hooks/` repeat them earlier for Claude Code only; both read
  `.agents/protected.json`.

---
Adapted from mattpocock/skills `engineering/retro` (MIT, see `../THIRD_PARTY_NOTICES.md`). Changed for
this workflow: model-invocable, because SESSION §3.6 runs it at the end of every slice; the file roles and
checks are the workflow's; proposals go to the pull request and are never applied without the owner.
