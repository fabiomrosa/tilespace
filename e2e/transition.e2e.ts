import { expect, test } from "@playwright/test";

test("runs the default Transition on next and leaves nothing written", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  const tiles = page.locator("#stage > div");
  const rest = await tiles.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().x));

  await page.getByRole("button", { name: "Next" }).click();

  // Right after the click: Animations run, and both Spaces show.
  const during = await page.evaluate(() => ({
    running: document.getAnimations().filter((a) => a.playState === "running").length,
    spaces: new Set(
      Array.from(document.querySelectorAll("#stage > div"))
        .filter((el) => getComputedStyle(el).visibility === "visible")
        .map((el) => el.getAttribute("data-ts-space")),
    ).size,
  }));
  expect(during.running).toBeGreaterThan(0);
  expect(during.spaces).toBe(2);

  await page.waitForFunction(() => document.getAnimations().length === 0);
  const after = await tiles.evaluateAll((els) =>
    els.map((el) => ({
      space: el.getAttribute("data-ts-space"),
      visible: getComputedStyle(el).visibility === "visible",
      style: [(el as HTMLElement).style.translate, (el as HTMLElement).style.opacity],
    })),
  );
  expect(after.filter((t) => t.visible).every((t) => t.space === "1")).toBe(true);
  expect(after.filter((t) => t.space === "1").every((t) => t.visible)).toBe(true);
  expect(after.flatMap((t) => t.style).every((v) => v === "")).toBe(true);
  // The Space 0 Tiles slid out and back into place once hidden: no Animation is left holding them.
  const back = await tiles.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().x));
  expect(back).toEqual(rest);
});

test("cross-fades in place when the user prefers reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  // Recorded as they start: a 150 ms fade may be over before the page is read.
  await page.evaluate(() => {
    const animate = Element.prototype.animate;
    const seen: ComputedKeyframe[] = [];
    Object.assign(window, { seen });
    Element.prototype.animate = function (...args) {
      const animation = animate.apply(this, args);
      seen.push(...(animation.effect as KeyframeEffect).getKeyframes());
      return animation;
    };
  });

  await page.getByRole("button", { name: "Next" }).click();

  const frames = await page.evaluate(
    () => (window as unknown as { seen: ComputedKeyframe[] }).seen,
  );
  expect(frames.length).toBeGreaterThan(0);
  expect(frames.every((k) => k.translate === undefined && k.opacity !== undefined)).toBe(true);
});
