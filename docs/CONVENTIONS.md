# tilespace conventions

The exact shape of the code. Match it exactly; when something is not covered here, follow the nearest
existing code and propose an addition to this file in the pull request.

Rules are checked by the review (`tilespace-code-review`) unless tagged with the check that enforces
them (**[lint]**, **[test]**). A rule gets a mechanical check only when a real mistake shows it is
needed (DEC-03).

## 1. One role per file
- One exported class or function family per file, named after it.
- `src/index.ts` of each package is its public API and only re-exports.
- Layering: `core` ← engine ← adapters. A lower layer never imports a higher one.

## 2. Layout
```
packages/<name>/
  package.json
  src/
    index.ts           public API
    <thing>.ts
  test/
    <thing>.test.ts
```

## 3. Naming
- Files in kebab-case (`pack-page.ts`); types and classes in PascalCase; functions and variables in
  camelCase.
- Domain names are exactly the Terms of `docs/shared/PRODUCT.md`.
- Grid coordinates are 0-based Cells in code (`col`, `row`); Spans are `cols × rows`, written
  `3x2`; lengths are CSS pixels; time is milliseconds (Web Animations' unit).
- Events are nouns of what happened: `change` (Current space), `pack` (a new Packing).
- State the user may style: attributes start with `data-ts-` (e.g. `data-ts-current`), CSS variables
  with `--ts-` (e.g. `--ts-cols`).

## 4. Errors
- Bad input at mount or in a public call throws an `Error` whose message starts with `tilespace:` and
  names the value.
- Nothing is logged with `console` in library code.

## 5. Tests
| Behaviour | Seam | Test |
|---|---|---|
| A packing behaviour | the `core` public API | `packages/core/test/<thing>.test.ts`, `it('<does what> when <case>')` |
| A PRODUCT invariant | the `core` public API, random Tiles and grids | property test beside the unit tests |
| An engine behaviour | the engine with `happy-dom` and a fake clock | `packages/vanilla/test/<thing>.test.ts` |
| A real interaction | the demo page in Playwright | `e2e/<flow>.e2e.ts` |

A behaviour that depends on layout, focus, the shadow DOM or how an Animation ends gets one
Playwright check too: happy-dom doesn't model them (GOTCHAS "DOM").

**Test cases:**
- a validation table has a row on each boundary of each rule (each anchor, each bound);
- a helper that combines conditions also has each condition asserted on its own;
- an observer or listener callback has a test where it throws, asserting the state left behind;
- a check that something shows asserts a minimum visible size (e.g. `<= edge - 4`), not only
  `< edge`.

**Property tests** assert that they reached their interesting outcomes (a minimum count of each),
so a weak generator fails instead of passing blind. A property that guards a fixed bug names it in
a comment, and that bug, put back once, fails every run (aim the generator at it if it doesn't).

**Benchmarks** build their fixtures outside the timing, warm up each side, alternate which side runs
first, and report a median; a decision record states the method next to the numbers. Its tables
are pasted from the script's output, and each claim names the rows it rests on.

**Coverage floor:** 80% of lines (`--coverage.thresholds.lines` in the root `test:coverage` script),
measured by the gate over `packages/*/src` (tests and configuration excluded). It is raised when coverage grows past it and
lowered only with the owner's ok. A floor proves tests exist, not that they came first: the
"Seen red" line of the pull request does that.

## 6. Formatting and style
Biome's formatter and its recommended lint rules, configured in `biome.json` **[lint]**. Markdown
and `.claude/` are outside Biome. No `any` without a comment saying why.
