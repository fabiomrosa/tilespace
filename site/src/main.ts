import { createTilespace } from "@tilespace/vanilla";
import { setUpTheme } from "./theme.ts";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

setUpTheme(byId<HTMLButtonElement>("theme-toggle"));

/** The site's demos run the workspace's own build of the engine (DEC-16). */
createTilespace(byId("wall"), {
  columns: 3,
  rows: 2,
  gap: 8,
  label: "tilespace, arrow keys move between Spaces",
});
