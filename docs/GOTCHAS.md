# tilespace gotchas

Non-obvious facts about this exact stack and machine. Read the section for what you are touching
before you start; it saves hours. Add new ones as you learn them (SESSION §3.7). Facts, not rules.

## Toolchain
Node 26 and npm 11 locally (pnpm is installed too, but the workspace uses npm). Learned in
`../list-picker` and `../curvesel`, the same toolchain:
- Biome 2.6 formats Markdown too: exclude `**/*.md` in `biome.json`, or it rewraps every doc.
- TypeScript 7 is the native (Go) compiler; the binary is still `tsc`. Source imports use the `.ts`
  extension (`rewriteRelativeImportExtensions` turns them into `.js` in `dist/`).
- Vitest's default include also matches `*.spec.ts`: name Playwright files `e2e/*.e2e.ts`.
- With no Vitest config file, an engine test picks its DOM with a first-line comment:
  `// @vitest-environment happy-dom`.
- The agent's shell is zsh: `${PIPESTATUS[0]}` is empty there (zsh has `$pipestatus[1]`). To see
  a command's exit code, run it without a pipe and read `$?`.
- A synchronous loop that never ends hangs Vitest: its timeout cannot interrupt the thread. Bound
  every search loop in `core` by a count (the packer's node budget).
- The one-Space search recurses once per Tile placed and per Hole before the last Tile, so its stack
  depth grows with the Grid, not the Node budget. An empty 100x100 Grid overflowed it until the search
  counted the trailing Holes at once; thousands of 1x1 Tiles on a huge Grid still could.
- Node 26 runs a `.ts` file directly (type stripping): a scratch script can import `src/*.ts`
  without a build, as long as it uses no TypeScript-only syntax such as `enum`.
- An exhaustive oracle without a bound hangs on a few Tiles with Holes inevitable (7 Tiles on 3x4
  took 44 s): `test/exhaustive.ts` cuts by the Cells the unused Tiles cannot cover and tries equal
  Shapes and Spans once. A weak generator that stresses the oracle can hang Vitest (synchronous).
- In zsh, `for a in "1 2"; do cmd $a; done` passes one argument: write `${=a}` to split it.
- Claude Code's auto mode denies a blanket `git checkout -- .`. To break a file once and restore it
  (a "seen red" check), copy it to the scratchpad first and copy it back.

## Browser checks
- No browser tool in the agent's session: headless Chrome works. `--dump-dom` with
  `--virtual-time-budget=5000` gives the page after its scripts run; `--screenshot` a PNG; for
  input, `--remote-debugging-port` and Node's built-in `WebSocket` drive the DevTools protocol
  (`Runtime.evaluate`), no Puppeteer needed.
- `--dump-dom` with `--virtual-time-budget` renders no frame: `requestAnimationFrame` and
  `ResizeObserver` never fire there. For anything that needs a frame, run Chrome in real time with
  `--remote-debugging-port`, wait, and read the page with `Runtime.evaluate`.
- Playwright's `reuseExistingServer` tests whatever already answers on the port: another project's
  Vite on 5174 once made a red run red for the wrong reason. The config never reuses a server, and
  `--strictPort` fails loudly if the port is taken.
- The repository has no `@types/node`, so `process` doesn't type-check in `playwright.config.ts`.

## DOM
- happy-dom drops an element's `style` attribute when its last property is removed; Chrome keeps
  `style=""`. Chrome also writes inline style changes back to the attribute lazily, so
  `removeAttribute("style")` right after `style.removeProperty` comes back as `style=""` unless the
  attribute is read first (`getAttribute("style")`). The write log does both on `destroy()`, a fix
  only a real browser can check.
- Chrome expands an inline shorthand: with only `row-gap` set, `getPropertyValue("gap")` is `""`, and
  `removeProperty("gap")` then removes the user's `row-gap`. happy-dom doesn't expand shorthands, so
  a unit test can't see this; the engine writes longhands only. Chrome may serialize a restored inline
  style differently from the page's source, so compare it through the same serializer
  (`e2e/mount.e2e.ts`).
- happy-dom runs Web Animations but never ends one by itself, even with fake timers: tests call
  `finish()` on each of `getAnimations()`. `cancel()` rejects `finished`, an unhandled rejection
  unless the engine catches it.
- happy-dom doesn't retarget an event at a shadow boundary: a test of shadow-root behaviour runs
  in Playwright.
- A derived Grid on a content-height Stage feeds back (rows set the height, the height the rows):
  in Chrome it collapsed to one row or grew a row per frame. Give such a Stage a height.
- Under Vitest, an error thrown in a happy-dom `MutationObserver` callback escapes as an uncaught
  exception and fails the run (no `error` event on `window`). To test a throwing callback, stub the
  observer and call its callback yourself.
- happy-dom's `getComputedStyle` ignores inline padding on an element outside the document.
- `packages/vanilla` imports `@tilespace/core` through its `dist/` (package exports), so `core` must
  be built before vanilla is type-checked or tested: `verify` builds first, and `npm test` runs
  `pretest` (the build).
- Reading layout (`getBoundingClientRect`, `offsetWidth`) right after a style write forces a
  synchronous layout.
