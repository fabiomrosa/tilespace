import { expect, test } from "@playwright/test";

test("drags with the mouse past half and commits, selecting no text", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  const label = page.locator("#space");
  const settled = () => page.waitForFunction(() => document.getAnimations().length === 0);

  // Starting over a Tile's text, which the Drag doesn't select.
  await page.mouse.move(60, 250);
  await page.mouse.down();
  // Below the threshold first: a plain press selecting text, until it becomes a Drag.
  await page.mouse.move(52, 250, { steps: 4 });
  await page.mouse.move(-300, 250, { steps: 10 });
  expect(await page.evaluate(() => getSelection()?.toString())).toBe("");
  await page.mouse.up();
  await settled();
  await expect(label).toHaveText(/^Space 2 of/);
  await page.getByRole("button", { name: "Prev" }).click();
  await settled();

  await page.mouse.move(1000, 400);
  await page.mouse.down();
  await page.mouse.move(600, 400, { steps: 10 });
  const states = await page.evaluate(() => document.getAnimations().map((a) => a.playState));
  await page.mouse.move(300, 400, { steps: 10 });
  await page.mouse.up();
  await settled();

  expect(states.length).toBeGreaterThan(0);
  expect(states.every((state) => state === "paused")).toBe(true);
  await expect(label).toHaveText(/^Space 2 of/);
});
