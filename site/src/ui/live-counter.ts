import type { Tilespace } from "@tilespace/vanilla";

/**
 * Writes "Space n of N" into a live region of the page (DEC-14's recipe): after a move commits
 * (`change`) and when the Tiles are packed again (`pack`), never on a Drag's frames.
 */
export function liveCounter(tilespace: Tilespace, stage: HTMLElement, output: HTMLElement): void {
  let spaces = new Set(Array.from(stage.children, (t) => t.getAttribute("data-ts-space"))).size;
  const show = () => {
    output.textContent = `Space ${tilespace.current + 1} of ${spaces}`;
  };
  tilespace.on("change", show);
  tilespace.on("pack", (detail) => {
    spaces = detail.spaces;
    show();
  });
  show();
}
