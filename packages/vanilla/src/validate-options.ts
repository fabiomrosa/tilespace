import type { GridFit } from "./derive-grid.ts";

/**
 * Throws a `tilespace:` error naming the Stage, the `gap`, the `transition`, the `axis`, the
 * `spaceGap`, `peek`, the `label`, the `start`, `minCellWidth` or `cellAspect` when it is invalid
 * (CONVENTIONS §4).
 */
export function validateOptions(
  stage: unknown,
  gap: number,
  fit: GridFit | undefined,
  transition: unknown,
  axis: unknown,
  peek: unknown,
  spaceGap: number,
  label: unknown,
  start: unknown,
): void {
  // `nodeType`, not `instanceof Element`, so a Stage from another window (an iframe) passes.
  if ((stage as Node | null)?.nodeType !== 1) {
    throw new Error(`tilespace: stage must be an element, got ${stage}`);
  }
  if (!Number.isFinite(gap) || gap < 0) {
    throw new Error(`tilespace: gap must be a finite number of pixels ≥ 0, got ${gap}`);
  }
  if (transition !== false && typeof transition !== "function") {
    throw new Error(`tilespace: transition must be a function or false, got ${transition}`);
  }
  if (axis !== "horizontal" && axis !== "vertical") {
    throw new Error(`tilespace: axis must be "horizontal" or "vertical", got ${axis}`);
  }
  if (!Number.isFinite(spaceGap) || spaceGap < 0) {
    throw new Error(`tilespace: spaceGap must be a finite number of pixels ≥ 0, got ${spaceGap}`);
  }
  if (typeof peek !== "boolean") {
    throw new Error(`tilespace: peek must be true or false, got ${peek}`);
  }
  if (typeof label !== "string" || label.trim() === "") {
    const got = typeof label === "string" ? `"${label}"` : String(label);
    throw new Error(`tilespace: label must be a non-empty string, got ${got}`);
  }
  if (!Number.isInteger(start) || (start as number) < 0) {
    throw new Error(`tilespace: start must be an integer ≥ 0, got ${start}`);
  }
  if (!fit) return;
  if (!Number.isFinite(fit.minCellWidth) || fit.minCellWidth <= 0) {
    throw new Error(
      `tilespace: minCellWidth must be a finite number of pixels > 0, got ${fit.minCellWidth}`,
    );
  }
  if (!Number.isFinite(fit.cellAspect) || fit.cellAspect <= 0) {
    throw new Error(`tilespace: cellAspect must be a finite number > 0, got ${fit.cellAspect}`);
  }
}
