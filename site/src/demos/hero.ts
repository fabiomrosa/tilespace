import { createTilespace, type Tilespace } from "@tilespace/vanilla";
import { liveCounter } from "../ui/live-counter.ts";
import { cascade } from "./card-cascade.ts";

/** The wall's Grid and gaps per breakpoint (HANDOFF row 1): desktop, tablet, phone. */
const LAYOUTS = [
  { query: "(min-width: 1024px)", columns: 10, rows: 4, gap: 12, spaceGap: 32 },
  { query: "(min-width: 640px)", columns: 8, rows: 4, gap: 12, spaceGap: 32 },
  { query: "all", columns: 4, rows: 4, gap: 8, spaceGap: 16 },
];

/** The hero's wall: it peeks at both neighbours and is mounted again when the breakpoint changes. */
export function mountHero(
  wall: HTMLElement,
  prev: HTMLElement,
  next: HTMLElement,
  count: HTMLElement,
  pager: HTMLElement,
) {
  let tilespace: Tilespace | undefined;
  let shown = -1;
  /** A pointer is down on the wall: a move now is a Drag's, its cards already where they land. */
  let pressed = false;
  wall.addEventListener("pointerdown", (event) => {
    // As the Drag does: only a primary press drags (a right-click's menu eats its pointerup).
    pressed = event.isPrimary && event.button === 0;
  });
  // After the Drag's own release, which commits it.
  for (const type of ["pointerup", "pointercancel", "contextmenu"]) {
    addEventListener(type, () => setTimeout(() => (pressed = false)));
  }
  /** Each card shows its Tile's Span, which the library chooses and writes. */
  const label = () => {
    for (const tile of wall.children as HTMLCollectionOf<HTMLElement>) {
      const card = tile.firstElementChild as HTMLElement | null;
      if (card) card.dataset.span = tile.dataset.tsSpan ?? "";
    }
  };
  const queries = LAYOUTS.map((layout) => matchMedia(layout.query));
  const mount = () => {
    // The last layout's query is "all": one always matches. A resize across two breakpoints fires
    // both queries' `change`: the second finds the layout already shown.
    const index = queries.findIndex((q) => q.matches);
    if (index === shown) return;
    shown = index;
    const { columns, rows, gap, spaceGap } = LAYOUTS[index] as (typeof LAYOUTS)[number];
    const place = tilespace?.current ?? 0;
    tilespace?.destroy();
    tilespace = createTilespace(wall, {
      columns,
      rows,
      gap,
      spaceGap,
      peek: true,
      // A neighbour on both sides from the first Space on.
      loop: true,
      label: "Live tile wall. Drag, scroll or use arrow keys.",
    });
    label();
    tilespace.on("pack", label);
    tilespace.on("change", ({ direction }) => {
      if (pressed || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      const cards = wall.querySelectorAll<HTMLElement>(":scope > [data-ts-current] > .card");
      cascade(Array.from(cards), direction, spaceGap);
    });
    // The visitor's place, as near as the new Grid has one.
    tilespace.goTo(place);
    liveCounter(tilespace, wall, count);
  };
  for (const query of queries) query.addEventListener("change", mount);
  prev.addEventListener("click", () => tilespace?.prev());
  next.addEventListener("click", () => tilespace?.next());
  mount();
  // The pager works only with the script: without it, it stays hidden (index.html).
  pager.hidden = false;
}
