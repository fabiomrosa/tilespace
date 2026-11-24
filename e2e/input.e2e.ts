import { expect, test } from "@playwright/test";

test("moves one Space per key and per wheel gesture", async ({ page }) => {
  // Narrow, so there are Spaces to spare: a burst that moved more than once would show.
  await page.setViewportSize({ width: 500, height: 700 });
  await page.goto("/");
  const label = page.locator("#space");
  await expect(label).toHaveText(/^Space 1 of ([4-9]|\d\d)$/);

  await page.getByRole("button", { name: "Start" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(label).toHaveText(/^Space 2 of/);

  // One gesture: a burst of wheel events over the Stage, each well within the quiet gap.
  await page.mouse.move(250, 350);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 60);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await expect(label).toHaveText(/^Space 3 of/);
});
