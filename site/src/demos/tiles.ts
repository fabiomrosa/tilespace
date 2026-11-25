/**
 * The playground's examples (HANDOFF "Playground tabs"), built with DOM APIs: user text goes in as
 * `textContent`. Each Tile holds a `.card`, which is the site's to style and move (DEC-06).
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

/** A Tile of the given Shape, holding its card. */
const tile = (shape: string, ...children: (Node | string)[]) => {
  const node = el("div", {}, el("div", { className: "card" }, ...children));
  node.dataset.tsShape = shape;
  return node;
};

const SHAPES = ["2x2", "1x1", "2x1", "1x2", "3x2 2x2", "1x1", "2x1 1x1", "1x1", "2x2 1x1", "1x2"];

/**
 * Mixed Shapes in the seven tile colours, each labelled with its place in the HTML: 27 fill both of
 * the desktop's 8x4 Spaces, and nearly all three of a phone's 4x5.
 */
export const showcase = () =>
  Array.from({ length: 27 }, (_, i) =>
    tile(SHAPES[i % SHAPES.length] as string, el("b", { textContent: String(i + 1) })),
  );

/** A picture drawn as an SVG data URL, so there is no file to load. */
const picture = (hue: number) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 4 3" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="hsl(${hue} 70% 62%)"/><stop offset="1" stop-color="hsl(${hue + 50} 60% 34%)"/></linearGradient></defs><rect width="4" height="3" fill="url(#g)"/><circle cx="3" cy="0.8" r="0.45" fill="hsl(${hue} 90% 88%)"/><path d="M0 3 1.4 1.6 2.4 2.4 3 1.9 4 2.8V3Z" fill="hsl(${hue + 50} 50% 22%)"/></svg>`,
  )}`;

const PHOTOS: [string, string, string][] = [
  ["atoll.svg", "3x2 2x2 1x1", "An atoll from above"],
  ["dunes.svg", "2x1 1x1", "Dunes at noon"],
  ["fjord.svg", "2x2 1x1", "A fjord in the fog"],
  ["harbour.svg", "1x1", "Boats in a harbour"],
  ["glacier.svg", "2x2 2x1", "A glacier's face"],
  ["canyon.svg", "1x2 1x1", "A narrow canyon"],
  ["meadow.svg", "3x2 2x1", "A meadow in bloom"],
  ["reef.svg", "1x1", "Coral on a reef"],
  ["delta.svg", "2x1", "A river delta"],
  ["summit.svg", "2x2 1x1", "A snowy summit"],
  ["lagoon.svg", "1x1", "A still lagoon"],
  ["steppe.svg", "2x1 1x1", "Grass on the steppe"],
  ["volcano.svg", "2x2 1x1", "A volcano at dusk"],
  ["marsh.svg", "2x1", "Reeds in a marsh"],
  ["tundra.svg", "1x1", "Lichen on the tundra"],
  ["bay.svg", "3x2 2x2", "A sheltered bay"],
  ["mesa.svg", "1x2 1x1", "A mesa at dawn"],
  ["cove.svg", "2x1 1x1", "A rocky cove"],
];

/** Photos that accept several Shapes, with the file name as caption and an `alt`. */
export const gallery = () =>
  PHOTOS.map(([file, shape, alt], i) =>
    tile(
      shape,
      // `draggable`: an image's own drag would take the pointer from the Drag.
      el<HTMLImageElement>("img", { src: picture(i * 31), alt, draggable: false }),
      el("span", { className: "caption", textContent: file }),
    ),
  );

/** Widgets with real inputs: what the visitor types stays through every move. */
export const dashboard = () => {
  const count = el<HTMLOutputElement>("output", { value: "0" });
  count.setAttribute("aria-label", "Count");
  const add = el<HTMLButtonElement>("button", { type: "button", textContent: "+1" });
  add.addEventListener("click", () => {
    count.value = String(Number(count.value) + 1);
  });
  const volume = el<HTMLInputElement>("input", { type: "range", value: "40" });
  const level = el<HTMLOutputElement>("output", { value: "40" });
  volume.addEventListener("input", () => {
    level.value = volume.value;
  });
  const field = (label: string, control: HTMLElement) =>
    el("label", { className: "field" }, label, control);
  return [
    tile("3x2 2x2", field("Notes", el<HTMLTextAreaElement>("textarea", { rows: 3 }))),
    tile("2x1", el("div", { className: "row" }, el("span", {}, "Counter"), count, add)),
    tile("2x1", field("Name", el<HTMLInputElement>("input", { type: "text" }))),
    tile("2x1", el("label", { className: "row" }, "Volume", volume, level)),
    tile(
      "2x1",
      el("label", {}, el<HTMLInputElement>("input", { type: "checkbox" }), " Focus mode"),
    ),
    tile("3x2 2x2", field("To do", el<HTMLTextAreaElement>("textarea", { rows: 3 }))),
    tile("1x1", el("span", {}, "Clock "), el("time", { textContent: "09:41" })),
    tile("2x1", field("City", el<HTMLInputElement>("input", { type: "text", value: "Lisbon" }))),
    tile("4x2 2x2", field("Message", el<HTMLTextAreaElement>("textarea", { rows: 2 }))),
    tile(
      "1x1",
      el(
        "label",
        {},
        el<HTMLInputElement>("input", { type: "checkbox", checked: true }),
        " Alerts",
      ),
    ),
    tile("2x1", field("Search", el<HTMLInputElement>("input", { type: "search" }))),
    tile("4x2 2x2", field("Journal", el<HTMLTextAreaElement>("textarea", { rows: 3 }))),
    tile("2x1", field("Reminder", el<HTMLInputElement>("input", { type: "text" }))),
    tile("1x1", el("label", {}, el<HTMLInputElement>("input", { type: "checkbox" }), " Wi-Fi")),
  ];
};
