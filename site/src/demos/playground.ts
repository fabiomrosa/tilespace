import { createTilespace, type Tilespace, type TilespaceOptions } from "@tilespace/vanilla";
import { cardEffects } from "../../../demo/card-effects.ts";
import { liveCounter } from "../ui/live-counter.ts";
import { trackPress } from "../ui/pressed.ts";
import { segmented } from "../ui/segmented.ts";
import { labelSpans } from "../ui/span-labels.ts";
import { cascade } from "./card-cascade.ts";
import { dashboard, gallery, showcase } from "./tiles.ts";

/** The framed Stage's Grid per breakpoint (HANDOFF row 3): 8x4, and 4x5 on a phone. */
const LAYOUTS = [
  { query: "(min-width: 640px)", columns: 8, rows: 4, gap: 12 },
  { query: "all", columns: 4, rows: 5, gap: 8 },
];

/** A custom Transition, as a user would write one: the Spaces cross-fade in place. */
type Transition = NonNullable<TilespaceOptions["transition"]>;
const fade: Transition = ({ leaving, entering }) => [
  ...leaving.map(({ tile }) =>
    tile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }),
  ),
  ...entering.map(({ tile }) =>
    tile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "backwards" }),
  ),
];
const TRANSITIONS: Record<string, Transition> = { fade, none: false };

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
 * Stage, mounted again when the breakpoint or an option of the bar changes; prev, next and a live
 * "Space n of N". On a phone the bar's options hide behind an Options button.
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
  const frame = stage.parentElement as HTMLElement;
  const field = <T extends HTMLElement>(id: string) => root.querySelector(`#${id}`) as T;
  const transition = field<HTMLSelectElement>("pg-transition");
  const gap = field<HTMLInputElement>("pg-gap");
  const spaceGap = field<HTMLInputElement>("pg-space-gap");
  const loop = field<HTMLInputElement>("pg-loop");
  const cards = field<HTMLSelectElement>("pg-cards");
  const pressed = trackPress(stage);
  /** The options the bar sets; the gap is the breakpoint's until the visitor moves its slider. */
  const options = { axis: "horizontal", peek: "off", gap: undefined as number | undefined };

  /** Mounts the Tilespace on the Stage's Tiles as they are, at `place` or the last Space. */
  const mount = (place: number) => {
    tilespace?.destroy();
    // The last query is "all": one always matches.
    const layout = LAYOUTS[queries.findIndex((q) => q.matches)] as (typeof LAYOUTS)[number];
    const { columns, rows } = layout;
    frame.dataset.peek = options.peek;
    frame.dataset.axis = options.axis;
    // Until the visitor moves it, the Gap slider shows the breakpoint's gap.
    if (options.gap === undefined) {
      gap.value = String(layout.gap);
      field("pg-gap-value").textContent = `${layout.gap} px`;
    }
    const chosen = TRANSITIONS[transition.value];
    tilespace = createTilespace(stage, {
      columns,
      rows,
      gap: options.gap ?? layout.gap,
      spaceGap: Number(spaceGap.value),
      axis: options.axis as "horizontal" | "vertical",
      peek: options.peek !== "off",
      loop: loop.checked,
      ...(chosen !== undefined && { transition: chosen }),
      label: `Playground: ${example}. Drag, scroll or use arrow keys.`,
    });
    labelSpans(stage);
    tilespace.on("pack", () => labelSpans(stage));
    // The visitor's place, as near as the new Grid has one.
    const spaces = new Set(Array.from(stage.children, (t) => t.getAttribute("data-ts-space"))).size;
    tilespace.goTo(Math.min(place, spaces - 1));
    liveCounter(tilespace, stage, count);
    tilespace.on("change", ({ direction }) => playCards(direction));
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
  // Each option mounts the example again, where the visitor is.
  const remount = () => mount(tilespace?.current ?? 0);
  for (const name of ["axis", "peek"] as const) {
    segmented(
      root.querySelector(`[aria-label="${name[0]?.toUpperCase()}${name.slice(1)}"]`) as HTMLElement,
      (value) => {
        options[name] = value;
        allowCards();
        remount();
      },
    );
  }
  for (const [input, output] of [
    [gap, "pg-gap-value"],
    [spaceGap, "pg-space-gap-value"],
  ] as const) {
    // The readout follows the thumb; the Stage is mounted again when it is let go.
    input.addEventListener("input", () => {
      field(output).textContent = `${input.value} px`;
    });
    input.addEventListener("change", () => {
      if (input === gap) options.gap = Number(gap.value);
      remount();
    });
  }
  for (const control of [transition, loop]) control.addEventListener("change", remount);
  /**
   * The cards' own motion, the site's code on `change` (DEC-10): the demo's effects, which start
   * hidden; peeking, the new cards are in view already, so only the site's cascade, which never
   * fades, plays (the owner, T3.9c). None after a Drag, or with reduced motion.
   */
  const playCards = (direction: 1 | -1) => {
    if (cards.value === "none" || pressed()) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const axis = options.axis as "horizontal" | "vertical";
    const current = Array.from(
      stage.querySelectorAll<HTMLElement>(":scope > [data-ts-current] > .card"),
    );
    if (options.peek !== "off") cascade(current, direction, axis, Number(spaceGap.value));
    else cardEffects[cards.value]?.(current, direction, axis);
  };
  /** Peeking, the effects that start hidden would blink the cards in view: they wait for Off. */
  const allowCards = () => {
    for (const option of cards.options) {
      option.disabled =
        options.peek !== "off" && option.value !== "none" && option.value !== "cascade";
    }
    if (cards.selectedOptions[0]?.disabled) cards.value = "cascade";
  };
  const toggle = field<HTMLButtonElement>("playground-options");
  toggle.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    field("playground-controls").classList.toggle("open", open);
  });
  select(tabs[0] as HTMLButtonElement);
  // The tabs and the pager work only with the script: without it, they stay hidden (index.html).
  tablist.hidden = false;
  panel.setAttribute("role", "tabpanel");
  for (const id of ["playground-pager", "playground-controls", "playground-options"]) {
    field(id).hidden = false;
  }
}
