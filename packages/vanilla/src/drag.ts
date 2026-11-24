import type { Axis } from "./default-transition.ts";

/** A Drag's hold on its Transition: `seek` from 0 to 1, then `release`, committing or not. */
export type Grip = { seek(progress: number): void; release(commit: boolean): void };

/** How far the pointer goes along the axis, in CSS pixels, before a press becomes a Drag. */
const THRESHOLD = 10;
/** The speed, in CSS pixels per millisecond over the last 100 ms, that commits a short Drag. */
const FLICK = 0.5;

/**
 * Turns a pointer dragged along the axis over the Stage into a Drag (DEC-11): past the threshold
 * it grabs the Transition towards the neighbouring Space and scrubs it with the distance (the
 * Stage's size is the whole Transition); on release it commits past half the distance or on a
 * flick, otherwise it cancels. The click after a Drag is stopped; one below the threshold reaches
 * the Tile. A press that goes across the axis first is left alone. Returns the remover.
 */
export function listenDrag(
  stage: HTMLElement,
  axis: Axis,
  grab: (direction: 1 | -1) => Grip | undefined,
) {
  const horizontal = axis === "horizontal";
  let press: { id: number; x: number; y: number } | undefined;
  let drag:
    | { grip?: Grip; direction: 1 | -1; size: number; samples: [number, number][] }
    | undefined;
  let dragged = false;
  const along = (event: PointerEvent) =>
    horizontal ? event.clientX - (press?.x ?? 0) : event.clientY - (press?.y ?? 0);
  const across = (event: PointerEvent) =>
    horizontal ? event.clientY - (press?.y ?? 0) : event.clientX - (press?.x ?? 0);
  /** How far along towards the grabbed Space, from 0 to 1. */
  const progress = (distance: number, d: NonNullable<typeof drag>) =>
    Math.min(1, Math.max(0, (-d.direction * distance) / d.size));

  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary || event.button > 0) return;
    press = { id: event.pointerId, x: event.clientX, y: event.clientY };
    dragged = false;
  };
  const onMove = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    const distance = along(event);
    if (!drag) {
      if (Math.abs(across(event)) > Math.abs(distance) && Math.abs(across(event)) > THRESHOLD) {
        press = undefined;
        return;
      }
      if (Math.abs(distance) < THRESHOLD) return;
      // Dragging left (or up) pulls the next Space in.
      const direction = distance < 0 ? 1 : -1;
      const size = horizontal ? stage.clientWidth : stage.clientHeight;
      dragged = true;
      stage.setPointerCapture?.(event.pointerId);
      drag = { direction, size: size || 1, samples: [] };
      const grip = grab(direction);
      if (grip) drag.grip = grip;
    }
    drag.samples = [...drag.samples, [event.timeStamp, distance] as [number, number]].filter(
      ([t]) => t >= event.timeStamp - 100,
    );
    drag.grip?.seek(progress(distance, drag));
    // A mouse Drag over text would select it on the way.
    stage.ownerDocument.getSelection()?.removeAllRanges();
  };
  const onUp = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    const d = drag;
    const distance = along(event);
    press = drag = undefined;
    // A touch Drag fires no click: the guard lasts only to the click this task dispatches.
    setTimeout(() => (dragged = false));
    if (!d) return;
    // The speed over the last 100 ms of the Drag.
    const [t0, x0] = d.samples[0] ?? [event.timeStamp, distance];
    const speed = (-d.direction * (distance - x0)) / Math.max(1, event.timeStamp - t0);
    d.grip?.release(progress(distance, d) > 0.5 || speed > FLICK);
  };
  const onCancel = (event: PointerEvent) => {
    if (!press || event.pointerId !== press.id) return;
    drag?.grip?.release(false);
    press = drag = undefined;
    setTimeout(() => (dragged = false));
  };
  const onClick = (event: MouseEvent) => {
    if (!dragged) return;
    dragged = false;
    event.stopPropagation();
    event.preventDefault();
  };
  stage.addEventListener("pointerdown", onDown);
  stage.addEventListener("pointermove", onMove);
  stage.addEventListener("pointerup", onUp);
  stage.addEventListener("pointercancel", onCancel);
  stage.addEventListener("click", onClick, true);
  return () => {
    stage.removeEventListener("pointerdown", onDown);
    stage.removeEventListener("pointermove", onMove);
    stage.removeEventListener("pointerup", onUp);
    stage.removeEventListener("pointercancel", onCancel);
    stage.removeEventListener("click", onClick, true);
  };
}
