import type { Grid, Shape } from "./packing.ts";

/** Throws a `tilespace:` error naming the first value of the Shapes or the Grid that is invalid. */
export function validate(shapes: readonly Shape[], grid: Grid): void {
  positiveInteger(grid.columns, "grid.columns");
  positiveInteger(grid.rows, "grid.rows");
  shapes.forEach((shape, i) => {
    if (shape.length === 0) throw new Error(`tilespace: shapes[${i}] must have at least one Span`);
    shape.forEach((span, j) => {
      positiveInteger(span.cols, `shapes[${i}][${j}].cols`);
      positiveInteger(span.rows, `shapes[${i}][${j}].rows`);
    });
  });
}

function positiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`tilespace: ${name} must be a positive integer, got ${value}`);
  }
}
