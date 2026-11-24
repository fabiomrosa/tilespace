/** A Tile's size in Cells, `cols × rows`. */
export type Span = { cols: number; rows: number };

/** The Spans a Tile accepts, in order of preference. */
export type Shape = readonly Span[];

/** The columns and rows of Cells every Space shares. */
export type Grid = { columns: number; rows: number };

/** Where a Tile sits in its Space: 0-based Cells and the chosen Span. */
export type Placement = { tile: number; col: number; row: number; span: Span };

/** The Placements of every Tile, Space by Space. */
export type Packing = { spaces: Placement[][] };

/** `fill` may reorder Tiles at a Displacement cost; `strict` keeps the Stage's order (DEC-09). */
export type Order = "fill" | "strict";

/**
 * Where a Space's Holes go when fillings tie on Holes and Span ranks: `end` gathers them at the end
 * of the flow, before keeping the Stage's order; `order` keeps the Stage's order first.
 */
export type Holes = "end" | "order";

/**
 * Ranks one filling of a Space: its terms are compared in order, lower first, up to the shorter
 * list; a tie keeps the filling found first. It is given copies of the Placements.
 */
export type Score = (placements: readonly Placement[], shapes: readonly Shape[]) => number[];
