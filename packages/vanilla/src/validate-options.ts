/** Throws a `tilespace:` error naming the Stage or the `gap` when it is invalid (CONVENTIONS §4). */
export function validateOptions(stage: unknown, gap: number): void {
  // `nodeType`, not `instanceof Element`, so a Stage from another window (an iframe) passes.
  if ((stage as Node | null)?.nodeType !== 1) {
    throw new Error(`tilespace: stage must be an element, got ${stage}`);
  }
  if (!Number.isFinite(gap) || gap < 0) {
    throw new Error(`tilespace: gap must be a finite number of pixels ≥ 0, got ${gap}`);
  }
}
