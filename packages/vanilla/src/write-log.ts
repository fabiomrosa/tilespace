import type { Tile } from "./read-shape.ts";

/** Writes styles and attributes on elements and puts back what each one had before (DEC-06). */
export type WriteLog = {
  style(el: Tile, name: string, value: string): void;
  attribute(el: Tile, name: string, value: string): void;
  restore(): void;
};

export function createWriteLog(): WriteLog {
  const undo: (() => void)[] = [];
  const hadStyle = new Map<Tile, boolean>();
  return {
    style(el, name, value) {
      if (!hadStyle.has(el)) hadStyle.set(el, el.hasAttribute("style"));
      const old = el.style.getPropertyValue(name);
      const priority = el.style.getPropertyPriority(name);
      undo.push(() =>
        old === "" ? el.style.removeProperty(name) : el.style.setProperty(name, old, priority),
      );
      el.style.setProperty(name, value);
    },
    attribute(el, name, value) {
      const old = el.getAttribute(name);
      undo.push(() => (old === null ? el.removeAttribute(name) : el.setAttribute(name, old)));
      el.setAttribute(name, value);
    },
    restore() {
      for (const step of undo.reverse()) step();
      undo.length = 0;
      // An element that had no style attribute gets none back. Chrome syncs the attribute from the
      // style lazily: it must be read before it is removed (GOTCHAS "DOM"); happy-dom drops it alone.
      for (const [el, had] of hadStyle) {
        if (had || el.style.length > 0) continue;
        el.getAttribute("style");
        el.removeAttribute("style");
      }
      hadStyle.clear();
    },
  };
}
