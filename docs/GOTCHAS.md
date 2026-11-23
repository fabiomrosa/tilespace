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

## DOM
- Reading layout (`getBoundingClientRect`, `offsetWidth`) right after a style write forces a
  synchronous layout.
