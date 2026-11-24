import { createTilespace, type Tilespace } from "@tilespace/vanilla";
import { liveCounter } from "../ui/live-counter.ts";

/** The wall's Grid and gaps per breakpoint (HANDOFF row 1): desktop, tablet, phone. */
const LAYOUTS = [
  { query: "(min-width: 1024px)", columns: 10, rows: 4, gap: 12, spaceGap: 32 },
  { query: "(min-width: 640px)", columns: 8, rows: 4, gap: 12, spaceGap: 32 },
  { query: "all", columns: 4, rows: 4, gap: 8, spaceGap: 16 },
];

/** The hero's wall: it peeks at the next Space and is mounted again when the breakpoint changes. */
export function mountHero(
  wall: HTMLElement,
  prev: HTMLElement,
  next: HTMLElement,
  count: HTMLElement,
) {
  let tilespace: Tilespace | undefined;
  const queries = LAYOUTS.map((layout) => matchMedia(layout.query));
  const mount = () => {
    // The last layout's query is "all": one always matches.
    const layout = LAYOUTS[queries.findIndex((q) => q.matches)] as (typeof LAYOUTS)[number];
    const { columns, rows, gap, spaceGap } = layout;
    tilespace?.destroy();
    tilespace = createTilespace(wall, {
      columns,
      rows,
      gap,
      spaceGap,
      peek: true,
      label: "Live tile wall. Drag, scroll or use arrow keys.",
    });
    liveCounter(tilespace, wall, count);
  };
  for (const query of queries) query.addEventListener("change", mount);
  prev.addEventListener("click", () => tilespace?.prev());
  next.addEventListener("click", () => tilespace?.next());
  mount();
}
