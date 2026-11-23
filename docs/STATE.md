# tilespace state

What exists in this repository now. The code wins over this file: if they disagree, fix this file.
Every slice's pull request updates it (SESSION §3).

## Capabilities
An npm workspace that builds, formats, lints, type-checks and tests, with one gate (`npm run verify`)
that CI runs in the `gate` job, beside the size, frozen-files, title and secret checks. No packing
behaviour yet.

## Modules
- `packages/core` (`@tilespace/core`): empty; exports only `packageName`, for the smoke test.

## Contract
None yet.

## Known issues
None.

## Last session
- **2026-11-23, T0.1 (runnable skeleton):** the workspace, `packages/core`, Biome, Vitest with the
  80% line floor (CLI flags), and the CI `gate` job. No `vite` or `dev` script yet: the playground
  (T1.x) adds them.
- **Next:** "plan M1" (the core packing); `docs/PLAN.md` has no further slice.
