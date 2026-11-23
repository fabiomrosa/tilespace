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
