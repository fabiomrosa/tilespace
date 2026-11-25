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
  // The keys work from the Stage itself, with nothing focusable in a picture.
  await page.locator("#gallery").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#space")).toHaveText(/^Space 2 of/);
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#space")).toHaveText(/^Space 1 of/);

  await page.getByLabel("Gap", { exact: true }).fill("24");
  await page.getByLabel("Gap", { exact: true }).dispatchEvent("change");
  await expect(page.locator("#gallery")).toHaveCSS("column-gap", "24px");
  await page.getByLabel("Holes").selectOption("order");

  await page.getByLabel("Transition").selectOption("none");
  await page.getByRole("button", { name: "Next" }).click();
  expect(await page.evaluate(() => document.getAnimations().length)).toBe(0);
  await expect(page.locator("#space")).toHaveText(/^Space 2 of/);
});

/** The first keyframe's `transform` of each card animating in the Showcase, and what else moves. */
const motions = (page: import("@playwright/test").Page) =>
  page.evaluate(() =>
    document.getAnimations().map((a) => {
      const effect = a.effect as KeyframeEffect;
      const target = effect.target as HTMLElement;
      return {
        card: target.classList.contains("card"),
        tile: target.parentElement?.id === "stage",
        props: Object.keys(effect.getKeyframes()[0] ?? {}).filter(
          (k) => !["offset", "computedOffset", "easing", "composite"].includes(k),
        ),
        from: String(effect.getKeyframes()[0]?.transform ?? ""),
        /** A card's Tile: in the new Space, and its first column; and the card's turn. */
        current: target.parentElement?.hasAttribute("data-ts-current"),
        col: Number(target.parentElement?.style.gridColumnStart),
        delay: Number(effect.getTiming().delay),
      };
    }),
  );

test("plays each card effect inside the Tiles, from the side the cards come", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  const side = {
    cascade: ["translateX(40px)", "translateX(-40px)"],
    "3d": ["rotateY(-70deg)", "rotateY(70deg)"],
  };
  for (const effect of ["cascade", "3d", "pop"] as const) {
    await page.getByLabel("Cards").selectOption(effect);
    for (const [button, way] of [
      ["Next", 0],
      ["Prev", 1],
    ] as const) {
      await page.getByRole("button", { name: button, exact: true }).click();
      const moving = await motions(page);
      const cards = moving.filter((m) => m.card);
      expect(cards.length).toBeGreaterThan(0);
      expect(cards.every((m) => m.current)).toBe(true);
      if (effect === "cascade") {
        // Column by column in their turns: from the left going on, from the right going back.
        const cols = cards.toSorted((a, b) => a.delay - b.delay).map((m) => m.col);
        const read = cols.toSorted((a, b) => a - b);
        expect(cols).toEqual(way === 0 ? read : read.reverse());
      }
      // The library's slide is the only motion on a Tile, and it is `translate` alone.
      for (const m of moving.filter((m) => m.tile)) expect(m.props).toEqual(["translate"]);
      if (effect !== "pop") {
        for (const m of cards) expect(m.from).toContain(side[effect][way]);
      }
      await settled(page);
    }
  }
});

test("plays no card effect after a Drag, whose cards are already in view", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  await page.getByLabel("Cards").selectOption("cascade");
  const box = (await page.locator("#stage").boundingBox()) as {
    x: number;
    y: number;
    width: number;
  };
  const y = box.y + 40;
  await page.mouse.move(box.x + box.width - 40, y);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2, y, { steps: 8 });
  await page.mouse.move(box.x + 40, y, { steps: 8 });
  await page.mouse.up();

  await expect(page.locator("#space")).toHaveText(/^Space 2 of/);
  expect((await motions(page)).filter((m) => m.card)).toEqual([]);
});
