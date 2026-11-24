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
  // The Timer's Tile is hidden now, so its button lost the focus; the Stage, which never hides,
  // keeps it (the demo makes it focusable).
  await page.locator("#stage").focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowRight");
  await expect(label).toHaveText(/^Space 3 of/);

  // One gesture: a burst of wheel events over the Stage, each well within the quiet gap.
  await page.mouse.move(250, 350);
  for (let i = 0; i < 6; i++) await page.mouse.wheel(0, 60);
  await page.waitForFunction(() => document.getAnimations().length === 0);
  await expect(label).toHaveText(/^Space 4 of/);
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

test("leaves a wheel gesture to a scroller inside a shadow root in a Tile", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  // happy-dom doesn't retarget events at a shadow boundary; Chromium does.
  await page.evaluate(() => {
    const host = document.createElement("div");
    const list = document.createElement("div");
    list.style.cssText = "height: 40px; overflow-y: auto";
    list.textContent = "Lorem ipsum ".repeat(200);
    host.attachShadow({ mode: "open" }).append(list);
    document.getElementById("timer")?.after(host);
  });
  const box = await page.locator("#timer + div").boundingBox();

  await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);
  await page.mouse.wheel(0, 40);

  await expect(page.locator("#space")).toHaveText(/^Space 1 of/);
  await expect
    .poll(() =>
      page.evaluate(
        () => document.querySelector("#timer + div")?.shadowRoot?.firstElementChild?.scrollTop,
      ),
    )
    .toBeGreaterThan(0);
});
