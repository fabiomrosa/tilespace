/**
 * The demo (T2.6, T2.11): three examples (a showcase of mixed Shapes, a gallery, a dashboard of
 * widgets that keep their state) on Stages whose Grid follows their size. Every input moves:
 * Prev and Next, the arrow keys with focus inside the Stage, the wheel and the Drag. The
 * Transition, the axis, where the Holes go, the gaps, `loop` and `peek` can be changed (the
 * Tilespace is mounted again), and Destroy puts the Stage back as the page wrote it. Built with
 * DOM APIs only.
 */
import {
  createTilespace,
  type Tilespace,
  type TilespaceOptions,
} from "../packages/vanilla/src/index.ts";
import { buildDashboard, buildGallery } from "./examples.ts";

const byId = <T extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as T;
const label = byId("space");
const toggle = byId("toggle");
const transition = byId<HTMLSelectElement>("transition");
const axis = byId<HTMLSelectElement>("axis");
const loop = byId<HTMLInputElement>("loop");
const holes = byId<HTMLSelectElement>("holes");
const gap = byId<HTMLInputElement>("gap");
const peek = byId<HTMLSelectElement>("peek");
const spaceGap = byId<HTMLInputElement>("space-gap");
const frame = byId("frame");
buildGallery(byId("gallery"));
buildDashboard(byId("dashboard"));
let stage = byId("stage");
let tilespace: Tilespace | undefined;
let spaces = 0;

/** A custom Transition: the Spaces cross-fade in place. */
const fade: TilespaceOptions["transition"] = ({ leaving, entering }) => [
  ...leaving.map(({ tile }) =>
    tile.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: "forwards" }),
  ),
  ...entering.map(({ tile }) =>
    tile.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, fill: "backwards" }),
  ),
];

const show = () => {
  label.textContent = tilespace ? `Space ${tilespace.current + 1} of ${spaces}` : "";
};

const mount = () => {
  // Where the neighbours show is the page's CSS: room inside the site, past the container, or the
  // screen's margins around a centred site.
  for (const way of ["inset", "bleed", "centred"]) frame.classList.toggle(way, peek.value === way);
  frame.classList.toggle("vertical", axis.value === "vertical");
  tilespace = createTilespace(stage, {
    // About 7 columns and 4 or 5 rows at most, so a large screen still has several Spaces.
    minCellWidth: Math.max(160, stage.clientWidth / 7, (stage.clientHeight * (4 / 3)) / 4.5),
    cellAspect: 4 / 3,
    gap: Math.min(48, Math.max(0, Number(gap.value) || 0)),
    spaceGap: Math.min(200, Math.max(0, Number(spaceGap.value) || 0)),
    holes: holes.value as "end" | "order",
    axis: axis.value as "horizontal" | "vertical",
    loop: loop.checked,
    peek: peek.value !== "off",
    // The Stage's name, read with its role "carousel"; the arrow keys work inside it.
    label: `${document.querySelector('[aria-pressed="true"]')?.textContent}, arrow keys move between Spaces`,
    ...(transition.value === "fade" && { transition: fade }),
    ...(transition.value === "none" && { transition: false }),
  });
  spaces = new Set(Array.from(stage.children, (t) => t.getAttribute("data-ts-space"))).size;
  tilespace.on("change", show);
  tilespace.on("pack", (detail) => {
    spaces = detail.spaces;
    show();
  });
  show();
  toggle.textContent = "Destroy";
};

const unmount = () => {
  tilespace?.destroy();
  tilespace = undefined;
  show();
  toggle.textContent = "Mount";
};

// A Tile keeps its own behaviour, and focus inside the Stage lets the arrow keys move.
const timer = byId("timer");
timer.addEventListener("click", () => {
  timer.textContent = timer.textContent === "Start" ? "Stop" : "Start";
});
for (const button of document.querySelectorAll<HTMLButtonElement>("[data-example]")) {
  button.addEventListener("click", () => {
    unmount();
    stage.hidden = true;
    stage = byId(button.dataset.example as string);
    stage.hidden = false;
    for (const other of document.querySelectorAll("[data-example]")) {
      other.setAttribute("aria-pressed", String(other === button));
    }
    mount();
  });
}
for (const control of [transition, axis, loop, holes, gap, spaceGap, peek]) {
  control.addEventListener("change", () => {
    unmount();
    mount();
  });
}
byId("prev").addEventListener("click", () => tilespace?.prev());
byId("next").addEventListener("click", () => tilespace?.next());
toggle.addEventListener("click", () => (tilespace ? unmount() : mount()));
mount();
