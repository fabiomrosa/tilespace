import { createTilespace, type Tilespace } from "@tilespace/vanilla";
import { liveCounter } from "../ui/live-counter.ts";
import { labelSpans } from "../ui/span-labels.ts";
import { showcase } from "./tiles.ts";

/** The framed Stage's Grid per breakpoint (HANDOFF row 3): 8x4, and 4x5 on a phone. */
const LAYOUTS = [
  { query: "(min-width: 640px)", columns: 8, rows: 4, gap: 12 },
  { query: "all", columns: 4, rows: 5, gap: 8 },
];

/**
 * The playground: the Showcase in the framed Stage, mounted again when the breakpoint changes;
 * prev, next and a live "Space n of N". The tabs come in T3.22.
 */
export function mountPlayground(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("#playground-stage") as HTMLElement;
  const count = root.querySelector<HTMLElement>("#playground-count") as HTMLElement;
  const queries = LAYOUTS.map((layout) => matchMedia(layout.query));
  let tilespace: Tilespace | undefined;

  /** Mounts the Tilespace on the Stage's Tiles as they are, at `place` if it still exists. */
  const mount = (place: number) => {
    tilespace?.destroy();
    // The last query is "all": one always matches.
    const layout = LAYOUTS[queries.findIndex((q) => q.matches)] as (typeof LAYOUTS)[number];
    const { columns, rows, gap } = layout;
    tilespace = createTilespace(stage, {
      columns,
      rows,
      gap,
      label: "Playground: showcase. Drag, scroll or use arrow keys.",
    });
    labelSpans(stage);
    tilespace.on("pack", () => labelSpans(stage));
    tilespace.goTo(place);
    liveCounter(tilespace, stage, count);
  };

  // A new breakpoint (only the first query can change): the same Tiles on the new Grid, keeping
  // the visitor's place.
  queries[0]?.addEventListener("change", () => mount(tilespace?.current ?? 0));
  root.querySelector("#playground-prev")?.addEventListener("click", () => tilespace?.prev());
  root.querySelector("#playground-next")?.addEventListener("click", () => tilespace?.next());
  stage.replaceChildren(...showcase());
  mount(0);
  // The pager works only with the script: without it, it stays hidden (index.html).
  for (const hidden of root.querySelectorAll<HTMLElement>("[data-needs-script]")) {
    hidden.hidden = false;
  }
}
