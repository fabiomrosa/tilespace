import type { Grid } from "@tilespace/core";

/** How a Grid is derived from the Stage's size: the narrowest Cell, its width/height and the gap. */
export type GridFit = { minCellWidth: number; cellAspect: number; gap: number };

/**
 * The most columns of Cells at least `minCellWidth` wide that fit the width, and the most rows of
 * Cells `width / cellAspect` tall that fit the height; never fewer than one of each.
 */
export function deriveGrid(
  size: { width: number; height: number },
  { minCellWidth, cellAspect, gap }: GridFit,
): Grid {
  const columns = Math.max(1, Math.floor((size.width + gap) / (minCellWidth + gap)));
  const cellHeight = (size.width - gap * (columns - 1)) / columns / cellAspect;
  // A Stage of no width (hidden at mount) has Cells of no height: one row, not Infinity.
  if (cellHeight <= 0) return { columns, rows: 1 };
  // The epsilon keeps a row that fits exactly but divides to 2.9999…
  const rows = Math.max(1, Math.floor((size.height + gap) / (cellHeight + gap) + 1e-9));
  return { columns, rows };
}
