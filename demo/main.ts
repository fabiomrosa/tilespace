/**
 * The demo (T2.6): Tiles of mixed Shapes on a Stage whose Grid follows its size, with Prev and
 * Next, and Destroy to see the Stage put back as the page wrote it. Built with DOM APIs only.
 */
import { createTilespace, type Tilespace } from "../packages/vanilla/src/index.ts";

const byId = (id: string) => document.getElementById(id) as HTMLElement;
const stage = byId("stage");
const label = byId("space");
const toggle = byId("toggle");
let tilespace: Tilespace | undefined;
let spaces = 0;

const show = () => {
  label.textContent = tilespace ? `Space ${tilespace.current + 1} of ${spaces}` : "";
};

const mount = () => {
  tilespace = createTilespace(stage, { minCellWidth: 160, cellAspect: 4 / 3, gap: 12 });
  spaces = new Set(Array.from(stage.children, (t) => t.getAttribute("data-ts-space"))).size;
  tilespace.on("change", show);
  tilespace.on("pack", (detail) => {
    spaces = detail.spaces;
    show();
  });
  show();
};

byId("prev").addEventListener("click", () => tilespace?.prev());
byId("next").addEventListener("click", () => tilespace?.next());
toggle.addEventListener("click", () => {
  if (tilespace) {
    tilespace.destroy();
    tilespace = undefined;
    show();
  } else mount();
  toggle.textContent = tilespace ? "Destroy" : "Mount";
});
mount();
