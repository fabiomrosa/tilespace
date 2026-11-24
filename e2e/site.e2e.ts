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

test("opens the same links in a menu sheet on a phone, next in the Tab order", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 });
  await page.goto("./");
  const menu = page.getByRole("button", { name: "Menu" });
  const links = page.getByRole("navigation", { name: "Main" }).getByRole("link");
  await expect(menu).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(links.first()).toBeHidden();

  await menu.click();
  await expect(menu).toHaveAttribute("aria-expanded", "true");
  await expect(links).toHaveText(["Playground", "Quick start", "The lab", "GitHub"]);
  for (const link of await links.all()) await expect(link).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(links.first()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
  await expect(links.first()).toBeHidden();

  await menu.click();
  await links.first().click();
  await expect(menu).toHaveAttribute("aria-expanded", "false");
  await expect(menu).toBeFocused();
});

test("gives every header and footer control a 44 px target on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./");
  await page.getByRole("button", { name: "Menu" }).click();

  const controls = page.locator("header a, header button, footer a");
  for (const control of await controls.all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(
      Math.min(box?.width ?? 0, box?.height ?? 0),
      await control.innerText(),
    ).toBeGreaterThanOrEqual(44);
  }
});

test("links the real repository from the header and the footer", async ({ page }) => {
  await page.goto("./");

  await expect(
    page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "GitHub" }),
  ).toHaveAttribute("href", "https://github.com/fabiomrosa/tilespace");
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "MIT License" }),
  ).toHaveAttribute("href", "https://github.com/fabiomrosa/tilespace/blob/main/LICENSE");
});
