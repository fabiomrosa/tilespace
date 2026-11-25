import { expect, type Page, test } from "@playwright/test";

test("serves the site's build under the Pages base path", async ({ page }) => {
  // The project's `baseURL` ends in `/tilespace/`, as on GitHub Pages.
  await page.goto("./");

  // Pages serves nothing at the host's root: every asset must sit under the base path too
  // (`vite preview` would serve a root one anyway).
  const scripts = await page
    .locator("script[src]")
    .evaluateAll((els) => els.map((el) => new URL((el as HTMLScriptElement).src).pathname));
  expect(scripts.length).toBeGreaterThan(0);
  for (const path of scripts) expect(path).toMatch(/^\/tilespace\//);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("tilespace");
  // The engine's build runs on the page: the wall is a mounted Tilespace.
  await expect(page.getByRole("region", { name: /^Live tile wall/ })).toHaveAttribute(
    "aria-roledescription",
    "carousel",
  );
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

test("gives every control a 44 px target on a phone, and shows each code line whole", async ({
  page,
}) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("./");
  await page.getByRole("button", { name: "Menu" }).click();

  const controls = page.locator("header a, header button, main a, main button, footer a");
  for (const control of await controls.all()) {
    if (!(await control.isVisible())) continue;
    const box = await control.boundingBox();
    expect(
      Math.min(box?.width ?? 0, box?.height ?? 0),
      (await control.textContent()) ?? "",
    ).toBeGreaterThanOrEqual(44);
  }
  for (const code of await page.locator("main code").all()) {
    expect(await code.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
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

test("copies the install line", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./");

  await page.getByRole("button", { name: "Copy" }).click();

  await expect(page.getByRole("button", { name: "Copied" })).toBeVisible();
  // Announced too: the button's own text changing isn't read out reliably.
  await expect(page.getByRole("status")).toHaveText("Copied");
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "npm install @tilespace/vanilla",
  );
});

test.describe("the hero wall", () => {
  const wall = (page: Page) => page.getByRole("region", { name: /^Live tile wall/ });
  /** Whether a Tile of the Space before and after the current one shows past each side. */
  const bleeds = (page: Page, current: number) =>
    wall(page).evaluate((el, k) => {
      const { left, right } = el.getBoundingClientRect();
      // The neighbours are `inert`, out of hit-testing too: positions, and no clip on the way up
      // (boxes ignore a clip, and only the screen's edge may cut them).
      // `html` and `body` clip at the screen on purpose; anything else that clips would cut it.
      let clipped = false;
      for (let up: Element | null = el; up && up !== document.body; up = up.parentElement) {
        const style = getComputedStyle(up);
        clipped ||= style.clipPath !== "none" || (up !== el && style.overflowX !== "visible");
      }
      const boxes = (space: number) =>
        Array.from(el.children)
          .filter((t) => t.getAttribute("data-ts-space") === String(space))
          .map((t) => t.getBoundingClientRect());
      return {
        before: !clipped && boxes(k - 1).some((b) => b.right < left && b.right > 0),
        after: !clipped && boxes(k + 1).some((b) => b.left > right && b.left < innerWidth),
      };
    }, current);
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

    expect(await bleeds(page, 0)).toMatchObject({ after: true });
    // The bleed is clipped by the screen: the page itself never scrolls sideways.
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= document.documentElement.clientWidth,
      ),
    ).toBe(true);

    await page.getByRole("button", { name: "Next Space" }).click();
    await expect(counter).toHaveText(`Space 2 of ${spaces}`);
    // Both neighbours as soon as the slide ends, while the cards are still settling: the one
    // beyond slides in with the block instead of appearing at the end.
    // The default slide is 500 ms (default-transition.ts SLIDE); the hero's cascade runs ~1.5 s more.
    await page.waitForTimeout(650);
    expect(await page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
    expect(await bleeds(page, 1)).toEqual({ before: true, after: true });
    await page.waitForFunction(() => document.getAnimations().length === 0);
    expect(await bleeds(page, 1)).toEqual({ before: true, after: true });
    // Narrower desktops too, before the container stops growing.
    await page.setViewportSize({ width: 1100, height: 900 });
    await expect.poll(() => bleeds(page, 1)).toEqual({ before: true, after: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await wall(page).focus();
    await page.keyboard.press("ArrowRight");
    await expect(counter).toHaveText(`Space 3 of ${spaces}`);
  });

  test("mounts the phone's 4-column Grid when the screen narrows, keeping the visitor's place", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("./");
    expect(await columns(page)).toBe(10);
    await page.getByRole("button", { name: "Next Space" }).click();
    let mounts = 0;
    await page.exposeFunction("mounted", (records: number) => {
      mounts += records;
    });
    await wall(page).evaluate((el) =>
      new MutationObserver((records) =>
        (window as unknown as { mounted: (n: number) => void }).mounted(records.length),
      ).observe(el, { attributeFilter: ["role"] }),
    );

    await page.setViewportSize({ width: 390, height: 844 });

    await expect.poll(() => columns(page)).toBe(4);
    await page.waitForFunction(() => document.getAnimations().length === 0);
    expect(await bleeds(page, 1)).toEqual({ before: true, after: true });
    // One remount (role removed, then written back), though two breakpoints were crossed.
    expect(mounts).toBe(2);
    await expect(page.getByText(/^Space \d+ of \d+$/)).toHaveText(/^Space 2 of /);
  });

  test.describe("with JavaScript off", () => {
    test.use({ javaScriptEnabled: false });

    test("shows fallback tiles and no sideways scroll", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto("./");

      await expect(page.locator("#wall > div").first()).toBeVisible();
      // No dead controls: the pager needs the script.
      await expect(page.getByRole("button", { name: "Next Space" })).toBeHidden();
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
