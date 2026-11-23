<!-- INITIATE VARS --->

<!-- One link and one badge per environment and per technology, e.g.
[PRD__URL]: https://example.com
[PRD__BADGE]: https://img.shields.io/badge/Production-00AB68?style=flat
[NODE__URL]: https://nodejs.org/en/download
[NODE__BADGE]: https://img.shields.io/badge/Node-5FA04E?style=flat&logo=nodedotjs&logoColor=fff -->

<!-- END VARS --->

# tilespace

A headless library that packs your own elements, as tiles of any span, into the pages of a grid,
filling every page but the last, and moves between pages like desktop workspaces, with transitions
you can replace. You bring the content of every tile; it brings the grid, the packing and the
motion. Vanilla TypeScript first, then React and Angular. A lab rewriting a 2017 jQuery tile wall.

Agents: start with `AGENTS.md`.

## Tech references

<!-- One badge per technology: [![node][NODE__BADGE]][NODE__URL] -->

## Requirements

<!-- Each tool with its pinned version and a link: runtime, package manager, Docker… -->

## Running locally

Nothing runs yet: slice T0.1 in `docs/PLAN.md` adds the skeleton, and with it this section:
clone, install, configure, start the dependencies, run.

Check everything CI checks:

```sh
npm run verify
```

## Config

<!-- Every configuration value: what it does, its local default, and what happens without it. A
     required value that is missing or malformed stops startup with a plain message. Then the
     procedures that touch configuration: changing the schema, rotating a secret, a provider's
     spending cap. -->

## Docs

| File | Purpose |
| --- | --- |
| `AGENTS.md` (`CLAUDE.md`) | Standing instructions: principles, non-negotiables, commands |
| `docs/STATE.md`, `docs/PLAN.md` | What exists and the last handoff; the slices |
| `docs/ARCHITECTURE.md`, `docs/CONVENTIONS.md` | The shape of the code and its rules |
| `docs/GOTCHAS.md` | Traps of this stack and machine |
| `docs/decisions/` | Technical decisions of this repository |
| `docs/shared/` | Session flow, product, decisions, roadmap |
| `OWNER_PLAN.md` | The owner's runbook |
<!-- | `docs/design/` | Tokens, components, screen mocks, copy and brand files | -->

## Online versions

<!-- The living versions of documents kept elsewhere (specs, design canvases). If they change, export
     them again into `docs/`. Delete the section if there are none. -->

## Standards

**Branches:** `slice/<id>-<short-name>` for a slice of `docs/PLAN.md` (`slice/T1.2-sign-in`),
`fix/<short-name>` for a hotfix (`fix/lost-draft`), `docs/<topic>` for a docs-only change.
Kebab-case, never `main`.

**Pull request titles** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0),
with the slice id (or the docs topic) as scope: `<type>(<scope>): <short name>`, imperative,
starting in lowercase, with acronyms and names in their usual case and no final period.
Every pull request is squash-merged, so its title becomes the commit on `main` and `git log main` is
the list of merged slices. CI checks the title.

| Type | For |
| --- | --- |
| `feat` | a new behaviour |
| `fix` | a bug fix |
| `refactor` | a code change that neither adds a behaviour nor fixes a bug |
| `perf` | a code change that improves performance |
| `test` | adding or fixing tests only |
| `docs` | documentation only |
| `build` | the build system or dependencies |
| `ci` | CI configuration and scripts |
| `chore` | configuration files only |
| `revert` | reverting an earlier merge |

Examples: `feat(T1.2): sign in with email`, `fix(T1.4): keep the draft after a timeout`,
`docs(roadmap): split M2`.
