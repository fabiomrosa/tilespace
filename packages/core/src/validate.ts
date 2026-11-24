import type { Grid, Holes, Order, Shape } from "./packing.ts";

type Options = { order: Order; nodeBudget: number; holes: Holes };

/** Throws a `tilespace:` error naming the first invalid value of the Shapes, the Grid or the options. */
export function validate(
  shapes: readonly Shape[],
  grid: Grid,
  { order, nodeBudget, holes }: Options,
): void {
  validateGrid(grid);
  if (order !== "fill" && order !== "strict") {
    throw new Error(`tilespace: order must be 'fill' or 'strict', got ${order}`);
  }
  if (holes !== "end" && holes !== "order") {
    throw new Error(`tilespace: holes must be 'end' or 'order', got ${holes}`);
  }
  positiveInteger(nodeBudget, "nodeBudget");
  validateShapes(shapes);
}

/** Throws a `tilespace:` error when the Grid's columns or rows are not positive integers. */
export function validateGrid(grid: Grid): void {
  positiveInteger(grid.columns, "grid.columns");
  positiveInteger(grid.rows, "grid.rows");
}

/** Throws a `tilespace:` error naming the first empty Shape or Span that is not whole Cells. */
export function validateShapes(shapes: readonly Shape[]): void {
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
