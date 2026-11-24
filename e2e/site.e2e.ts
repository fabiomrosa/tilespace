import { expect, test } from "@playwright/test";

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
