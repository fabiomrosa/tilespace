/** A gesture ends after this long with no wheel event: trackpad momentum stays one gesture. */
const QUIET = 200;

/**
 * Whether an element between the target and the Stage, shadow trees included, can still scroll
 * along the gesture's axis. A reversed scroller (`column-reverse`, `row-reverse`, `rtl`) runs from
 * 0 down; 1 px of slack absorbs a fractional position.
 */
export function scrolls(stage: HTMLElement, path: EventTarget[], vertical: boolean, delta: number) {
  for (const node of path) {
    if (node === stage) return false;
    if ((node as Node).nodeType !== 1) continue;
    const el = node as HTMLElement;
    const style = getComputedStyle(el);
    if (!/auto|scroll/.test(vertical ? style.overflowY : style.overflowX)) continue;
    const flex = style.display.endsWith("flex") ? style.flexDirection : "";
    const reversed = vertical
      ? flex === "column-reverse"
      : (style.direction === "rtl") !== (flex === "row-reverse");
    const at = vertical ? el.scrollTop : el.scrollLeft;
    const max = vertical ? el.scrollHeight - el.clientHeight : el.scrollWidth - el.clientWidth;
    const [low, high] = reversed ? [-max, 0] : [0, max];
    if (delta > 0 ? at < high - 1 : at > low + 1) return true;
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
    const vertical = Math.abs(event.deltaY) >= Math.abs(event.deltaX);
    const delta = vertical ? event.deltaY : event.deltaX;
    if (!gesture && delta !== 0) {
      // Read before `step` writes: the layout read comes first.
      const theirs =
        event.defaultPrevented || scrolls(stage, event.composedPath(), vertical, delta);
      gesture = { moved: !theirs && step(delta > 0 ? 1 : -1) };
    }
    // Chrome lets only a scroll sequence's first event be cancelled.
    if (gesture?.moved && event.cancelable) event.preventDefault();
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
