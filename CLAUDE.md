@AGENTS.md

Claude Code only: `.claude/skills` links to `.agents/skills`; `.claude/hooks/` print the handoff at
session start, block edits to the generated, frozen and read-only files listed in
`.agents/protected.json`, and block commits and pushes to `main`, force-pushes and non-squash merges.
