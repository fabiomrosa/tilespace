import { expect, test } from "@playwright/test";

const settled = (page: import("@playwright/test").Page) =>
  page.waitForFunction(() => document.getAnimations().length === 0);

test("keeps a dashboard widget's value through a move away and back", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: "Dashboard" }).click();
  await page.getByLabel("Notes").fill("buy milk");
  await page.getByRole("button", { name: "+1" }).click();

  await page.getByRole("button", { name: "Next" }).click();
  await settled(page);
  await expect(page.getByLabel("Notes")).toBeHidden();
  await page.getByRole("button", { name: "Prev" }).click();
  await settled(page);

  await expect(page.getByLabel("Notes")).toHaveValue("buy milk");
  await expect(page.getByRole("status", { name: "Count" })).toHaveText("1");
});

test("switches examples and Transitions from the page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Gallery" }).click();
  await expect(page.getByRole("img").first()).toBeVisible();
  await expect(page.locator("#stage")).toBeHidden();

  await page.getByLabel("Transition").selectOption("none");
  await page.getByRole("button", { name: "Next" }).click();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator("#space")).toHaveText(/^Space 2 of/);
});
