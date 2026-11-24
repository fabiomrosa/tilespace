/** A gesture ends after this long with no wheel event: trackpad momentum stays one gesture. */
const QUIET = 200;

/**
 * Moves one Space per wheel gesture over the Stage (DEC-11), along the larger of its deltas. A
 * gesture that moved stops the page scrolling to its end; one that moved nothing (at the first or
 * last Space) lets it scroll. A pinch zoom is left alone. Returns the remover.
 * `step` returns whether the Tilespace moved.
 */
export function listenWheel(stage: HTMLElement, step: (direction: 1 | -1) => boolean) {
  let gesture: { moved: boolean } | undefined;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (!gesture && delta !== 0) gesture = { moved: step(delta > 0 ? 1 : -1) };
    if (gesture?.moved) event.preventDefault();
    clearTimeout(quiet);
    quiet = setTimeout(() => {
      gesture = undefined;
    }, QUIET);
  };
  // Not passive: a gesture that moves stops the page scrolling.
  stage.addEventListener("wheel", onWheel, { passive: false });
  return () => {
    clearTimeout(quiet);
    stage.removeEventListener("wheel", onWheel);
  };
}
