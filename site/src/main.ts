import { createTilespace } from "@tilespace/vanilla";

/** The site's demos run the workspace's own build of the engine (DEC-16). */
createTilespace(document.getElementById("wall") as HTMLElement, {
  columns: 3,
  rows: 2,
  gap: 8,
  label: "tilespace, arrow keys move between Spaces",
});
