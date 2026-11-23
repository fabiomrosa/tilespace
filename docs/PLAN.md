# tilespace plan

This repository's track of `docs/shared/ROADMAP.md`, with entries in the template of
`docs/shared/SESSION.md` §0. Slice ids start with `T`.

---

### T0.1 · Runnable skeleton
- **Status:** done (2026-11-23)
- **Goal:** an empty project that builds, formats, tests and runs, with its gate in CI.
- **Depends on:** DEC-13 (accepted), P1.
- **In scope:**
  - The npm workspace (root `package.json`, `tsconfig` base, strict) with `packages/core` empty but
    building: its `package.json`, `tsconfig`, `src/index.ts`.
  - Vitest and Biome at the ARCHITECTURE versions, pinned.
  - The formatter and linter, wired into the gate.
  - One smoke test.
  - Coverage in the gate, failing below the floor of `docs/CONVENTIONS.md` §5 (80% of lines).
  - CI: the `gate` job in `.github/workflows/ci.yml` running `npm run verify`.
  - `README.md`: Tech references, Requirements, Running locally, Config (as far as the skeleton
    goes).
  - The gate as one command (`npm run verify`), the same one CI runs.
- **Out of scope:** any feature; `packages/vanilla` and the others; Playwright; publishing.
- **Contract:** none.
- **Acceptance criteria:**
  1. `npm run verify` passes from a clean clone.
  2. A badly formatted file fails the gate (seen once).
  3. The smoke test passes, and fails when broken (seen once).
  4. Coverage below the floor fails the gate (seen once).
  5. CI is green on the pull request.
- **Files:** ~14 (lockfile excluded): root `package.json`, `tsconfig.json`, `biome.json`,
  `packages/core/{package.json,tsconfig.json,src/index.ts,test/smoke.test.ts}`, `ci.yml`, `README.md`, PLAN,
  STATE, GOTCHAS. Coverage is set by CLI flags, with no Vitest config file.
- **References:** ARCHITECTURE "Stack", GOTCHAS; `../curvesel`'s root `package.json`,
  `tsconfig.json` and `biome.json`, the same toolchain already working.

## Later
