import type { Tile } from "./read-shape.ts";

/** Writes styles and attributes on elements and puts back what each one had before (DEC-06). */
export type WriteLog = {
  style(el: Tile, name: string, value: string): void;
  attribute(el: Tile, name: string, value: string): void;
  /** Puts back one style property's value from before the first write. */
  resetStyle(el: Tile, name: string): void;
  /** Puts back one attribute's value from before the first write. */
  resetAttribute(el: Tile, name: string): void;
  /** Puts back everything written on one element and forgets it (a Tile that left the Stage). */
  release(el: Tile): void;
  restore(): void;
};

type Saved = { value: string; priority: string };

export function createWriteLog(): WriteLog {
  // The value each property and attribute had before the library first wrote it.
  const styles = new Map<Tile, Map<string, Saved>>();
  const attributes = new Map<Tile, Map<string, string | null>>();
  const hadStyle = new Map<Tile, boolean>();

  const savedOf = <V>(map: Map<Tile, Map<string, V>>, el: Tile) => {
    const saved = map.get(el) ?? new Map<string, V>();
    map.set(el, saved);
    return saved;
  };
  const putStyle = (el: Tile, name: string, { value, priority }: Saved) => {
    if (value === "") el.style.removeProperty(name);
    else el.style.setProperty(name, value, priority);
  };
  const putAttribute = (el: Tile, name: string, value: string | null) => {
    if (value === null) el.removeAttribute(name);
    else el.setAttribute(name, value);
  };

  // An element that had no style attribute gets none back. Chrome syncs the attribute from the
  // style lazily: it must be read before it is removed (GOTCHAS "DOM"); happy-dom drops it alone.
  const dropEmptyStyle = (el: Tile, had: boolean | undefined) => {
    if (had !== false || el.style.length > 0) return;
    el.getAttribute("style");
    el.removeAttribute("style");
  };

  return {
    style(el, name, value) {
      if (!hadStyle.has(el)) hadStyle.set(el, el.hasAttribute("style"));
      const saved = savedOf(styles, el);
      if (!saved.has(name)) {
        saved.set(name, {
          value: el.style.getPropertyValue(name),
          priority: el.style.getPropertyPriority(name),
        });
      }
      el.style.setProperty(name, value);
    },
    attribute(el, name, value) {
      const saved = savedOf(attributes, el);
      if (!saved.has(name)) saved.set(name, el.getAttribute(name));
      el.setAttribute(name, value);
    },
    resetStyle(el, name) {
      const saved = styles.get(el)?.get(name);
      if (saved) putStyle(el, name, saved);
    },
    resetAttribute(el, name) {
      const saved = attributes.get(el);
      if (saved?.has(name)) putAttribute(el, name, saved.get(name) ?? null);
    },
    release(el) {
      for (const [name, saved] of styles.get(el) ?? []) putStyle(el, name, saved);
      for (const [name, value] of attributes.get(el) ?? []) putAttribute(el, name, value);
      dropEmptyStyle(el, hadStyle.get(el));
      styles.delete(el);
      attributes.delete(el);
      hadStyle.delete(el);
    },
    restore() {
      for (const el of new Set([...styles.keys(), ...attributes.keys()])) this.release(el);
    },
  };
}
