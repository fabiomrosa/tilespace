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

/** Ranks one filling of a Space: its terms are compared in order, lower first. */
export type Score = (placements: readonly Placement[], shapes: readonly Shape[]) => number[];
