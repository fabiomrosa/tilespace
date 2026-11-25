/**
 * Whether a pointer is down on the Stage: a move then is a Drag's, its cards already where they
 * land, so a card effect skips it.
 */
export function trackPress(stage: HTMLElement): () => boolean {
  let pressed = false;
  stage.addEventListener("pointerdown", (event) => {
    // As the Drag does: only a primary press drags (a right-click's menu eats its pointerup).
    pressed = event.isPrimary && event.button === 0;
  });
  // After the Drag's own release, which commits it.
  for (const type of ["pointerup", "pointercancel", "contextmenu"]) {
    addEventListener(type, () => setTimeout(() => (pressed = false)));
  }
  return () => pressed;
}
