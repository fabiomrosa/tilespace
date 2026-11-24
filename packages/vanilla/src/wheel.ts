/** A gesture ends after this long with no wheel event: trackpad momentum stays one gesture. */
const QUIET = 200;

/** Whether an element between the target and the Stage can still scroll along the delta. */
function scrolls(stage: HTMLElement, from: EventTarget | null, dx: number, dy: number): boolean {
  for (let el = from as HTMLElement | null; el && el !== stage; el = el.parentElement) {
    const { overflowX, overflowY } = getComputedStyle(el);
    const can = (overflow: string, delta: number, at: number, size: number, view: number) =>
      delta !== 0 && /auto|scroll/.test(overflow) && (delta > 0 ? at + view < size : at > 0);
    if (can(overflowY, dy, el.scrollTop, el.scrollHeight, el.clientHeight)) return true;
    if (can(overflowX, dx, el.scrollLeft, el.scrollWidth, el.clientWidth)) return true;
  }
  return false;
}

/**
 * Moves one Space per wheel gesture over the Stage (DEC-11), along the larger of its deltas. A
 * gesture that moved stops the page scrolling to its end; one that moved nothing (at the first or
 * last Space) lets it scroll. A gesture that starts on something inside a Tile that scrolls along
 * it, or that handles it (`preventDefault`), and a pinch zoom, are left alone. Returns the remover.
 * `step` returns whether the Tilespace moved.
 */
export function listenWheel(stage: HTMLElement, step: (direction: 1 | -1) => boolean) {
  let gesture: { moved: boolean } | undefined;
  let quiet: ReturnType<typeof setTimeout> | undefined;
  const onWheel = (event: WheelEvent) => {
    if (event.ctrlKey) return;
    const { deltaX: dx, deltaY: dy } = event;
    const delta = Math.abs(dx) > Math.abs(dy) ? dx : dy;
    if (!gesture && delta !== 0) {
      // Read before `step` writes: the layout read comes first.
      const theirs = event.defaultPrevented || scrolls(stage, event.target, dx, dy);
      gesture = { moved: !theirs && step(delta > 0 ? 1 : -1) };
    }
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
