---
name: tdd
description: Test-driven development, red → green. Use when building a slice's behaviour or fixing a bug.
---

# Test-Driven Development

TDD is the red → green loop. This skill is the reference that makes that loop produce tests worth keeping: what a good test is, where tests go, the anti-patterns, and the rules of the loop. Every section applies on every cycle: consult them before and during the loop, not after.

Name tests and interfaces in the ubiquitous language (`docs/shared/PRODUCT.md` in the hub repository), and respect the decisions in the area you touch (`DECISIONS.md`, the project's `docs/decisions/`).

## What a good test is

Tests verify behavior through public interfaces, not implementation details. Code can change entirely; tests shouldn't. A good test reads like a specification: "user can checkout with valid cart" tells you exactly what capability exists, and it survives refactors because it doesn't care about internal structure.

See [tests.md](tests.md) for examples and [mocking.md](mocking.md) for mocking guidelines.

## Seams: where tests go

A **seam** is the public boundary you test at: the interface where you observe behavior without reaching inside. Tests live at seams, never against internals.

**Test only at agreed seams.** Here the slice entry is the agreement: each acceptance criterion names a behaviour, and the project's `docs/CONVENTIONS.md` test table names its seam. Write down the seam of each criterion before the first test. Ask the owner only when a criterion has no fitting seam.

When the shape of that interface is itself in question, the project's `docs/ARCHITECTURE.md` and `docs/CONVENTIONS.md` decide it. If they do not fit, propose a change to them in the pull request instead of inventing a new shape.

## Anti-patterns

- **Implementation-coupled**: mocks internal collaborators, tests private methods, or verifies through a side channel (querying the database instead of using the interface). The tell: the test breaks when you refactor but behavior hasn't changed.
- **Tautological**: the assertion recomputes the expected value the way the code does (`expect(add(a, b)).toBe(a + b)`, a snapshot derived by hand the same way, a constant asserted equal to itself), so it passes by construction and can never disagree with the code. Expected values must come from an independent source of truth: a known-good literal, a worked example, the spec.
- **Horizontal slicing**: writing all tests first, then all implementation. Bulk tests verify _imagined_ behavior: you test the _shape_ of things rather than user-facing behavior, the tests go insensitive to real changes, and you commit to test structure before understanding the implementation. Work in **vertical slices** instead: one test → one implementation → repeat, each test a **tracer bullet** that responds to what the last cycle taught you.

## Rules of the loop

- **Red before green.** Write the failing test first, then only enough code to pass it. Don't anticipate future tests or add speculative features.
- **One slice at a time.** One seam, one test, one minimal implementation per cycle.
- **Refactoring is not part of the loop.** It belongs to the review stage (the project's `tilespace-code-review` skill), not the red → green implementation cycle.
- **Every red is seen.** Run the new test and watch it fail for the expected reason before writing the code; that is the proof SESSION §3.2 asks for. A test that needs a server or a page goes red on its own assertion, against this project's server (GOTCHAS "Browser checks").
- **Every fixture discriminates.** A rule that only ranks results (the best, not the first; a tie-break) needs an input where breaking the rule changes the output: find the smallest by differential search, the code against a scratch copy missing the rule, and assert the difference (`expect(withRule).not.toEqual(withoutRule)`).
- **Break code safely.** Before breaking code on purpose to see a test fail, commit (or copy the file to the scratchpad); restore from that, never with `git checkout <file>`, which also wipes uncommitted work.

## Common rationalizations

| Rationalization | Reality |
|---|---|
| "Too small to test first." | Small changes break rules too, and the red run is the only proof the test can fail. |
| "I'll write the test right after the code." | A test written after the code passes by construction until you break the rule once. |
| "It failed to compile, so it was red." | A compile error says nothing about the rule: run it until the assertion fails for the expected reason. |
| "The existing tests cover it." | Name the test and break the rule to watch it fail; otherwise they don't. |

## Red flags

- Production code written before any new test ran red.
- A test that never failed, or failed only in setup.
- Several tests written before the first implementation (horizontal slicing).

---
Adapted from mattpocock/skills `engineering/tdd` (MIT, see `../THIRD_PARTY_NOTICES.md`). Changed for this workflow: the seams come from the slice entry and CONVENTIONS instead of a per-test question; references point to the workflow's docs and skills; "every red is seen" added; "every fixture discriminates" added; the rationalizations and red flags follow the pattern of addyosmani/agent-skills. `tests.md` and `mocking.md` are unchanged.
