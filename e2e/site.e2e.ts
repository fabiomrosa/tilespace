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
      (await control.textContent()) ?? "",
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

test.describe("the hero wall", () => {
  const wall = (page: Page) => page.getByRole("region", { name: /^Live tile wall/ });
  const columns = (page: Page) =>
    wall(page).evaluate((el) => getComputedStyle(el).gridTemplateColumns.split(" ").length);

  test("bleeds the next Space past the right edge, and moves with the buttons and keys", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./");
    const counter = page.getByText(/^Space \d+ of \d+$/);
    await expect(counter).toHaveText(/^Space 1 of ([2-9]|\d\d)$/);
    const spaces = Number((await counter.textContent())?.split(" of ")[1]);
    // The count the packer made, as the Tiles show it.
    const packed = await wall(page).evaluate(
      (el) => new Set(Array.from(el.children, (t) => t.getAttribute("data-ts-space"))).size,
    );
    expect(spaces).toBe(packed);

    const seen = await wall(page).evaluate((el) => {
      const right = el.getBoundingClientRect().right;
      const next = Array.from(el.children).filter((t) => t.getAttribute("data-ts-space") === "1");
      return next.some((t) => {
        const box = t.getBoundingClientRect();
        return box.left > right && box.left < innerWidth;
      });
    });
    expect(seen).toBe(true);

    await page.getByRole("button", { name: "Next Space" }).click();
    await expect(counter).toHaveText(`Space 2 of ${spaces}`);
    await wall(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText(`Space 3 of ${spaces}`);
  });

  test("mounts the phone's 4-column Grid when the screen narrows", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./");
    expect(await columns(page)).toBe(10);

    await page.setViewportSize({ width: 390, height: 844 });

    await expect.poll(() => columns(page)).toBe(4);
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    test("shows fallback tiles and no sideways scroll", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("./");

      await expect(page.locator("#wall > div").first()).toBeVisible();
      // A grid of cells at the wall's phone height, not a column of stacked tiles.
      const [display, height] = await page
        .locator("#wall")
        .evaluate((el) => [getComputedStyle(el).display, el.getBoundingClientRect().height]);
      expect([display, height]).toEqual(["grid", 312]);
      const [scroll, client] = await page.evaluate(() => [
        document.documentElement.scrollWidth,
        document.documentElement.clientWidth,
      ]);
      expect(scroll).toBeLessThanOrEqual(client);
    });
  });
});
