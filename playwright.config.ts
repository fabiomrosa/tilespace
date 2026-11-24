import { defineConfig, devices } from "@playwright/test";

/** The e2e flows run the demo page (`demo/`) in Chromium, served by Vite. */
export default defineConfig({
  testDir: "e2e",
  testMatch: "*.e2e.ts",
  use: { baseURL: "http://localhost:5181" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "vite demo --port 5181 --strictPort",
    url: "http://localhost:5181",
  },
});
