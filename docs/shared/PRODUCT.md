# tilespace — Product

The top of the precedence list (SESSION §8). Only the owner changes it, through a docs pull request.

## What it is
A headless, framework-agnostic library that packs the user's own elements, as Tiles of any span,
into the Spaces (pages) of a grid, and moves between those Spaces like desktop workspaces: one Space
on screen at a time, the next one mounting with a transition. The library ships the grid, the
packing, the Tile containers and the motion; the content and look of every Tile belong to the user.
A lab: it rewrites a 2017 jQuery/TweenMax tile wall (`../surface/chosen.surface.js`) and tests one
idea, that a bounded depth-first search fills the Spaces better than the old greedy first-fit, fast
enough to repack on every resize.

## Who it serves
Front-end developers who want a paged mosaic of their own components (a showcase, a gallery, a
dashboard of widgets, a launcher) without a visual style or a framework imposed on them. No one
pays: it is an open-source lab.

## Business model
None. Success is learning: Spaces filled with the fewest Holes, measured against first-fit, within a
frame budget, written down.

## Product principles
- **Headless, children keep their behaviour.** The user's elements (or components) are the Tiles.
  The library never creates, clones, moves or re-parents them and never touches their inside, so
  their listeners, state, inputs and media survive. A click on a Tile reaches it unless the gesture
  was a drag.
- **Any span, flexible Tiles.** A Tile is not one of a few fixed sizes: it accepts one or more Spans
  of any whole number of cells, in order of preference, and the packer picks the one that fills
  best. The grid is any number of columns and rows, fixed or derived from the Stage's size.
- **Full Spaces first.** Every Space but the last is filled completely when the Tiles allow it, and
  otherwise with the fewest Holes; the last Space holds what is left. By default the packer may
  reorder Tiles to fill, at a cost for each place a Tile moves; a strict mode keeps the order.
- **The browser does the layout.** The Stage is one CSS grid; a Tile gets its column, row and span,
  never computed pixel positions. The chosen Span is exposed to the Tile so its content can adapt
  with container queries.
- **Motion with defaults, all replaceable.** Changing Space animates the leaving and entering Tiles
  with a default transition; the user may replace it, or turn it off. A drag scrubs the same
  transition under the finger.
- **Replaceable strategy.** The packer and its score are options: a user may pass their own.
- **Framework-agnostic core.** `core` knows no DOM and no framework; the vanilla engine comes first,
  React and Angular adapters are thin layers over it.
- **Measured, not assumed.** A performance claim needs a benchmark or a trace.

## Launch v1
- **In:** `core` (the packer with flexible Spans, both order modes, the node budget, a custom packer
  and score), the vanilla engine (CSS grid placement, responsive columns, repacking when the Tiles
  or the size change, navigation by API, keyboard, wheel and pointer drag, the default and custom
  transitions, reduced motion, the click guard), accessibility basics, a demo page, the first npm
  publish.
- **Out:** React and Angular adapters (right after v1), Span constraints by aspect ratio or area
  (they compile to a list of Spans), autoplay, a pagination UI (the user builds it with `goTo` and
  events), lazy loading of the user's content, a default theme.

## Ubiquitous language

| Term | Meaning |
|---|---|
| Tilespace | One mounted instance: a Stage, its Tiles, its Grid and its Spaces |
| Stage | The user's container element; its direct children are the Tiles |
| Tile | One of the user's elements (or components), adopted as it is |
| Grid | The columns and rows of Cells every Space shares, and the gap between them |
| Cell | One unit of the Grid |
| Span | A Tile's size in Cells, `cols × rows` (`3x2`) |
| Shape | The Spans a Tile accepts, in order of preference; one Span is a fixed Tile |
| Space | One page of the Grid; exactly one is on screen at rest |
| Current space | The Space on screen |
| Placement | Where a Tile sits: its Space, column, row and chosen Span |
| Packing | The Placements of every Tile, Space by Space |
| Hole | A Cell of a Space that no Tile covers |
| Packer | A pure function from the Tiles' Shapes and the Grid to a Packing |
| Score | How the Packer ranks two fillings of a Space: Holes, then Span preference, then Displacement |
| Displacement | How many places a Tile moved from its order in the Stage |
| Order mode | `fill` (may reorder, at a Displacement cost) or `strict` (keeps the order) |
| Node budget | The most search steps the Packer takes per Space before keeping the best filling found |
| Transition | The animation of the Tiles leaving one Space and entering the next |
| Drag | The gesture: from pointer down past the threshold until release; it scrubs the Transition |
| Adapter | A thin layer that binds `core` and the engine to a UI layer (vanilla, React, Angular) |

## Engineering-critical invariants
- No two Tiles of a Space share a Cell, and every Tile lies inside the Grid.
- Every Tile is placed exactly once, with a Span from its Shape (clamped to the Grid).
- No Space but the last has a Hole the Tiles could have filled: with the same Tiles left, no filling
  of that Space has fewer Holes (within the Node budget, which the tests set high enough to be exact).
- In `strict` mode, reading the Spaces in order and each Space by its Placements gives the Stage's
  order.
- The Packer is deterministic: the same Shapes and Grid give the same Packing.
- At rest exactly one Space is shown; the Tiles of the others are hidden and inert.
- The Tiles are the same nodes before, during and after mounting: never recreated, reordered or
  re-parented.
- `destroy()` removes every listener and animation and restores every property and attribute the
  library wrote.
