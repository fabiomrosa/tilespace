import { expect, test } from "@playwright/test";

test("peeks at the next Space beside the Stage, clipped by the page's frame", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");

  await page.getByLabel("Peek").check();

  const seen = await page.evaluate(() => {
    const stage = document.getElementById("stage") as HTMLElement;
    const frame = document.getElementById("frame") as HTMLElement;
    // The next Space's Tile in its first column: one Stage width plus the gap to the right.
    const next = Array.from(stage.children).find(
      (t) =>
        t.getAttribute("data-ts-space") === "1" && (t as HTMLElement).style.gridColumnStart === "1",
    ) as HTMLElement;
    const [s, f, n] = [stage, frame, next].map((el) => el.getBoundingClientRect());
    return {
      gap: Number.parseFloat(getComputedStyle(stage).columnGap),
      stageRight: s?.right ?? 0,
      frameRight: f?.right ?? 0,
      frameClips: getComputedStyle(frame).overflowX,
      nextLeft: n?.left ?? 0,
      inert: next.inert,
      visible: getComputedStyle(next).visibility,
    };
  });

  expect(seen.nextLeft).toBeCloseTo(seen.stageRight + seen.gap, 0);
  expect(seen.nextLeft).toBeLessThan(seen.frameRight);
  expect(seen.frameClips).toBe("hidden");
  expect(seen).toMatchObject({ inert: true, visible: "visible" });
});
