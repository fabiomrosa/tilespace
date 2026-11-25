import { createTilespace, type Tilespace } from "@tilespace/vanilla";
import { liveCounter } from "../ui/live-counter.ts";
import { labelSpans } from "../ui/span-labels.ts";
import { dashboard, gallery, showcase } from "./tiles.ts";

/** The framed Stage's Grid per breakpoint (HANDOFF row 3): 8x4, and 4x5 on a phone. */
const LAYOUTS = [
  { query: "(min-width: 640px)", columns: 8, rows: 4, gap: 12 },
  { query: "all", columns: 4, rows: 5, gap: 8 },
];

const EXAMPLES = { showcase, gallery, dashboard };
type Example = keyof typeof EXAMPLES;

const NOTES: Record<Example, string> = {
  showcase:
    "Mixed shapes in seven colours: each tile shows its place in the HTML and, once mounted, the span it got.",
  gallery:
    "Photos that accept several shapes: tilespace picks the spans that leave the fewest holes.",
  dashboard:
    "Type something, change Space, come back: it is still there. tilespace never re-renders content.",
};

/**
 * The playground: a tablist (APG tabs, automatic activation) mounts an example in the framed
 * Stage, mounted again when the breakpoint changes; prev, next and a live "Space n of N".
 */
export function mountPlayground(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("#playground-stage") as HTMLElement;
  const count = root.querySelector<HTMLElement>("#playground-count") as HTMLElement;
  const note = root.querySelector<HTMLElement>("#playground-note") as HTMLElement;
  const panel = root.querySelector<HTMLElement>("#playground-panel") as HTMLElement;
  const tablist = root.querySelector<HTMLElement>('[role="tablist"]') as HTMLElement;
  const tabs = Array.from(tablist.querySelectorAll<HTMLButtonElement>('[role="tab"]'));
  const queries = LAYOUTS.map((layout) => matchMedia(layout.query));
  let tilespace: Tilespace | undefined;
  let example: Example = "showcase";

  /** Mounts the Tilespace on the Stage's Tiles as they are, at `place` or the last Space. */
  const mount = (place: number) => {
    tilespace?.destroy();
    // The last query is "all": one always matches.
    const layout = LAYOUTS[queries.findIndex((q) => q.matches)] as (typeof LAYOUTS)[number];
    const { columns, rows, gap } = layout;
    tilespace = createTilespace(stage, {
      columns,
      rows,
      gap,
      label: `Playground: ${example}. Drag, scroll or use arrow keys.`,
    });
    labelSpans(stage);
    tilespace.on("pack", () => labelSpans(stage));
    // The visitor's place, as near as the new Grid has one.
    const spaces = new Set(Array.from(stage.children, (t) => t.getAttribute("data-ts-space"))).size;
    tilespace.goTo(Math.min(place, spaces - 1));
    liveCounter(tilespace, stage, count);
  };
  /** Selects a tab (roving `tabindex`) and mounts its example from the first Space. */
  const select = (tab: HTMLButtonElement) => {
    // The example already shown keeps what the visitor typed and where they are.
    if (tilespace && tab.getAttribute("aria-selected") === "true") return;
    for (const other of tabs) {
      other.setAttribute("aria-selected", String(other === tab));
      other.tabIndex = other === tab ? 0 : -1;
    }
    example = tab.dataset.example as Example;
    panel.setAttribute("aria-labelledby", tab.id);
    stage.dataset.example = example;
    note.textContent = NOTES[example];
    tilespace?.destroy();
    tilespace = undefined;
    stage.replaceChildren(...EXAMPLES[example]());
    mount(0);
  };
  const KEYS: Record<string, (i: number) => number> = {
    ArrowRight: (i) => (i + 1) % tabs.length,
    ArrowLeft: (i) => (i - 1 + tabs.length) % tabs.length,
    Home: () => 0,
    End: () => tabs.length - 1,
  };
  for (const [i, tab] of tabs.entries()) {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const to = KEYS[event.key];
      if (!to) return;
      event.preventDefault();
      const next = tabs[to(i)] as HTMLButtonElement;
      next.focus();
      select(next);
    });
  }

  // A new breakpoint (only the first query can change): the same Tiles on the new Grid, keeping
  // the visitor's place.
  queries[0]?.addEventListener("change", () => mount(tilespace?.current ?? 0));
  root.querySelector("#playground-prev")?.addEventListener("click", () => tilespace?.prev());
  root.querySelector("#playground-next")?.addEventListener("click", () => tilespace?.next());
  select(tabs[0] as HTMLButtonElement);
  // The tabs and the pager work only with the script: without it, they stay hidden (index.html).
  tablist.hidden = false;
  panel.setAttribute("role", "tabpanel");
  (root.querySelector("#playground-pager") as HTMLElement).hidden = false;
}
