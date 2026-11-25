import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const page = (name: string) => fileURLToPath(new URL(name, import.meta.url));

/**
 * The site is served by GitHub Pages under the repository's name (DEC-16); two pages: the home and
 * the playground.
 */
export default defineConfig({
  base: "/tilespace/",
  build: {
    rollupOptions: { input: { home: page("./index.html"), playground: page("./playground.html") } },
  },
});
