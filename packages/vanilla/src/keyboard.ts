import type { Axis } from "./default-transition.ts";

/** The keys that move one Space, by axis: `1` towards the next Space, `-1` towards the previous. */
const KEYS: Record<Axis, Record<string, 1 | -1>> = {
  horizontal: { ArrowRight: 1, ArrowLeft: -1, PageDown: 1, PageUp: -1 },
  vertical: { ArrowDown: 1, ArrowUp: -1, PageDown: 1, PageUp: -1 },
};

/**
 * Moves one Space per key pressed with focus inside the Stage (DEC-11). A held key moves once; a
 * key with a modifier, typed in a field, or already handled is left alone. Returns the remover.
 */
export function listenKeys(stage: HTMLElement, axis: Axis, step: (direction: 1 | -1) => void) {
  const onKey = (event: KeyboardEvent) => {
    const direction = KEYS[axis][event.key];
    if (!direction || event.repeat || event.defaultPrevented) return;
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
    event.preventDefault();
    step(direction);
  };
  stage.addEventListener("keydown", onKey);
  return () => stage.removeEventListener("keydown", onKey);
}
