/**
 * The gallery and dashboard Tiles (T2.11), built with DOM APIs; user-visible text goes in as
 * `textContent`. The showcase's Tiles are in `index.html`.
 */

const el = <T extends HTMLElement = HTMLElement>(
  tag: string,
  props: Partial<T> = {},
  ...children: (Node | string)[]
): T => {
  const node = Object.assign(document.createElement(tag), props) as T;
  node.append(...children);
  return node;
};

/** A Tile of the given Shape. */
const tile = (shape: string, ...children: (Node | string)[]) => {
  const node = el("div", {}, ...children);
  node.dataset.tsShape = shape;
  return node;
};

/** A picture drawn as an SVG data URL: no files to load. */
const picture = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 70% 60%)"/><stop offset="1" stop-color="hsl(${hue + 60} 70% 35%)"/></linearGradient></defs><rect width="4" height="3" fill="url(#g)"/><circle cx="3" cy="0.8" r="0.4" fill="hsl(${hue} 90% 85%)"/></svg>`,
  )}`;

const PHOTOS: [string, string][] = [
  ["Atoll", "2x1"],
  ["Basin", "1x1"],
  ["Cove", "2x2 1x1"],
  ["Fjord", "1x2"],
  ["Plateau", "2x1 1x1"],
  ["Steppe", "1x1"],
  ["Dunes", "2x2 1x1"],
  ["Harbour", "1x1"],
  ["Forest", "1x2"],
  ["Glacier", "2x1"],
  ["Market", "1x1"],
  ["Canyon", "2x2"],
  ["Lagoon", "1x1"],
  ["Ridge", "2x1 1x1"],
  ["Orchard", "1x2 1x1"],
  ["Delta", "1x1"],
  ["Mesa", "2x2 2x1"],
  ["Reef", "1x1"],
];

/** Fills the gallery Stage with pictures of mixed Shapes. */
export function buildGallery(stage: HTMLElement) {
  stage.append(
    ...PHOTOS.map(([name, shape], i) => {
      // `draggable`: an image's native drag would take the pointer from the Drag (GOTCHAS).
      const img = el<HTMLImageElement>("img", {
        src: picture(i * 37),
        alt: name,
        draggable: false,
      });
      return tile(shape, img, el("span", { textContent: name }));
    }),
  );
}

/** Fills the dashboard Stage with widgets that keep their own inputs and state. */
export function buildDashboard(stage: HTMLElement) {
  const notes = el<HTMLTextAreaElement>("textarea", { id: "notes", rows: 4 });
  const count = el("output", { textContent: "0" });
  count.setAttribute("role", "status");
  count.setAttribute("aria-label", "Count");
  const add = el<HTMLButtonElement>("button", { type: "button", textContent: "+1" });
  add.addEventListener("click", () => {
    count.textContent = String(Number(count.textContent) + 1);
  });
  const todo = el<HTMLInputElement>("input", { placeholder: "A task, then Enter" });
  todo.setAttribute("aria-label", "New task");
  const list = el("ul");
  todo.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !todo.value) return;
    list.append(el("li", { textContent: todo.value }));
    todo.value = "";
  });
  const clock = el("strong");
  const tick = () => {
    clock.textContent = new Date().toLocaleTimeString();
  };
  tick();
  setInterval(tick, 1000);
  const toggle = el<HTMLInputElement>("input", { type: "checkbox" });
  stage.append(
    tile("2x2", el<HTMLLabelElement>("label", { htmlFor: "notes", textContent: "Notes" }), notes),
    tile("1x1", "Counter", count, add),
    tile("2x2 2x1", "To do", todo, list),
    tile("1x1", "Clock", clock),
    tile("1x1", el("label", {}, toggle, " Focus mode")),
    ...[
      "Visitors",
      "Sales",
      "Uptime",
      "Latency",
      "Errors",
      "Signups",
      "Revenue",
      "Queue",
      "Churn",
      "Orders",
      "Refunds",
      "Tickets",
    ].map((name, i) =>
      tile(i % 3 === 0 ? "2x1" : "1x1", name, el("strong", { textContent: `${(i * 37) % 100}` })),
    ),
  );
}
