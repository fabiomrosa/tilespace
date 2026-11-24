import { expect, test } from "@playwright/test";

test("moves one Space per key", async ({ page }) => {
  // Narrow, so there are Spaces to spare.
  await page.setViewportSize({ width: 500, height: 700 });
  await page.goto("/");
  const label = page.locator("#space");
  await expect(label).toHaveText(/^Space 1 of ([4-9]|\d\d)$/);

  await page.getByRole("button", { name: "Start" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(label).toHaveText(/^Space 2 of/);
  // The Timer's Tile is hidden now, so its button lost the focus; the Stage, which never hides,
  // keeps it (the demo makes it focusable).
  await page.locator("#stage").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(label).toHaveText(/^Space 3 of/);
});

test("leaves the arrow keys to a field inside a shadow root in a Tile", async ({ page }) => {
  await page.goto("/");
  // happy-dom doesn't retarget events at a shadow boundary; Chromium does.
  await page.evaluate(() => {
    const host = document.createElement("span");
    host.attachShadow({ mode: "open" }).append(document.createElement("input"));
    document.getElementById("timer")?.after(host);
    host.shadowRoot?.querySelector("input")?.focus();
  });

  await page.keyboard.press("ArrowRight");

  await expect(page.locator("#space")).toHaveText(/^Space 1 of/);
});
