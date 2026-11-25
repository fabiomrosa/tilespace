# tilespace

A headless TypeScript library that packs the user's own elements, as Tiles of any span, into the pages of a grid and moves between those pages like desktop workspaces. An open-source lab rewriting a 2017 jQuery/TweenMax tile wall (`reference/surface.js`); no business model.

These docs are shared by the whole project. It is a single repository (`tilespace`, the hub), so
there is no `CONTRACT.md`: the packages inside it talk through their TypeScript public APIs.

## Repositories
| Repository | What | Stack |
|---|---|---|
| `tilespace` | `core` (the packing), the vanilla engine and the React and Angular adapters, as packages of one npm workspace | TypeScript |

## Shared docs
| File | What |
|---|---|
| `SESSION.md` | How every session runs. **Follow it exactly.** |
| `PRODUCT.md` | What the product is, the launch scope, the ubiquitous language |
| `DECISIONS.md` | Product and cross-project decisions |
| `ROADMAP.md` | Milestones and the order of slices |

## Rules everywhere
- One slice per session, one small pull request (SESSION §0), squash-merged by the agent when CI is
  green (SESSION §4). Nothing reaches `main` any other way (DEC-04).
- Decisions are written down: product and cross-package ones in `DECISIONS.md` (the owner decides,
  the agent proposes); technical ones that touch only how the code is built in `docs/decisions/`.
