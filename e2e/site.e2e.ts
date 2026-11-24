import { expect, type Page, test } from "@playwright/test";

test("serves the site's build under the Pages base path, with a mounted Tilespace", async ({
  page,
}) => {
  // The project's `baseURL` ends in `/tilespace/`, as on GitHub Pages.
  await page.goto("./");

  // Pages serves nothing at the host's root: every asset must sit under the base path too
  // (`vite preview` would serve a root one anyway).
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((els) => els.map((el) => new URL((el as HTMLScriptElement).src).pathname));
  expect(scripts.length).toBeGreaterThan(0);
  for (const path of scripts) expect(path).toMatch(/^\/tilespace\//);

  const stage = page.getByRole("region", { name: /arrow keys/ });
  await expect(stage).toHaveAttribute("aria-roledescription", "carousel");
  await expect(stage.locator("> [data-ts-space]").first()).toBeVisible();
});

/** The page's background, from the tokens: light #F6F6F3, dark #0F1115. */
const background = (page: Page) =>
  page.evaluate(() => getComputedStyle(document.body).backgroundColor);
const LIGHT = "rgb(246, 246, 243)";
const DARK = "rgb(15, 17, 21)";

test("follows the system's theme until the toggle picks one, which survives a reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("./");
  expect(await background(page)).toBe(DARK);

  await page.getByRole("button", { name: "Switch to light mode" }).click();
  expect(await background(page)).toBe(LIGHT);
  await page.reload();
  expect(await background(page)).toBe(LIGHT);

  await page.getByRole("button", { name: "Switch to dark mode" }).click();
  await page.emulateMedia({ colorScheme: "light" });
  await page.reload();
  expect(await background(page)).toBe(DARK);
});

test("never scrolls sideways, down to a 360 px phone", async ({ page }) => {
  for (const width of [360, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("./");
    const [scroll, client] = await page.evaluate(() => [
      document.documentElement.scrollWidth,
      document.documentElement.clientWidth,
    ]);
    expect(scroll, `at ${width} px`).toBeLessThanOrEqual(client);
  }
});

test("links the real repository from the header", async ({ page }) => {
  await page.goto("./");

  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "GitHub" }),
  ).toHaveAttribute("href", "https://github.com/fabiomrosa/tilespace");
});
