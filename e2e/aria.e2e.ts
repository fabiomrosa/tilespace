import { expect, test } from "@playwright/test";

test("names each example's Stage as a carousel region, and announces the Current space", async ({
  page,
}) => {
  await page.goto("/");

  const stage = page.getByRole("region", { name: "Showcase, arrow keys move between Spaces" });
  await expect(stage).toHaveAttribute("aria-roledescription", "carousel");
  await expect(stage).toHaveAttribute("id", "stage");

  await page.getByRole("button", { name: "Gallery" }).click();
  await expect(page.getByRole("region", { name: /^Gallery,/ })).toHaveAttribute("id", "gallery");

  // The demo's recipe (DEC-14): a live region of the page, fed by the `change` event.
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("#space")).toHaveAttribute("aria-live", "polite");
  await expect(page.locator("#space")).toHaveText(/^Space 2 of/);
});
