import type { Grid, Order, Shape } from "./packing.ts";

type Options = { order: Order; nodeBudget: number };

/** Throws a `tilespace:` error naming the first invalid value of the Shapes, the Grid or the options. */
export function validate(
  shapes: readonly Shape[],
  grid: Grid,
  { order, nodeBudget }: Options,
): void {
  positiveInteger(grid.columns, "grid.columns");
  positiveInteger(grid.rows, "grid.rows");
  if (order !== "fill" && order !== "strict") {
    throw new Error(`tilespace: order must be 'fill' or 'strict', got ${order}`);
  }
  positiveInteger(nodeBudget, "nodeBudget");
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
