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

## DOM
- Reading layout (`getBoundingClientRect`, `offsetWidth`) right after a style write forces a
  synchronous layout.
