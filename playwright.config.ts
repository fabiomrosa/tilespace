import { defineConfig, devices } from "@playwright/test";

/**
 * The e2e flows run in Chromium: the demo page (`demo/`) on Vite's dev server, and the site's build
 * (`site/`, `npm run build` first) on `vite preview` under its Pages base path.
 */
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  projects: [
    {
      name: "demo",
      testIgnore: "site.e2e.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5181" },
    },
    {
      name: "site",
      testMatch: "site.e2e.ts",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:5182/tilespace/" },
    },
  ],
  webServer: [
    { command: "vite demo --port 5181 --strictPort", url: "http://localhost:5181" },
    {
      command: "vite preview site --port 5182 --strictPort",
      url: "http://localhost:5182/tilespace/",
    },
  ],
});
