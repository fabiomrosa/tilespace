import { expect, test } from "@playwright/test";

test("peeks at the next Space beside the Stage, clipped by the page's frame", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");

  await page.getByLabel("Space gap").fill("40");
  await page.getByLabel("Space gap").dispatchEvent("change");
  await page.getByLabel("Peek").selectOption("inset");

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
      // The demo's Space gap field: the distance between two Spaces.
      gap: Number((document.getElementById("space-gap") as HTMLInputElement).value),
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

test("bleeds past its container: the Stage keeps the container's width", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByLabel("Peek").selectOption("bleed");

  const seen = await page.evaluate(() => {
    // The page clips the neighbours: it never scrolls sideways.
    window.scrollTo(500, 0);
    const stage = document.getElementById("stage") as HTMLElement;
    const next = Array.from(stage.children).find(
      (t) =>
        t.getAttribute("data-ts-space") === "1" && (t as HTMLElement).style.gridColumnStart === "1",
    ) as HTMLElement;
    const box = stage.getBoundingClientRect();
    return {
      width: box.width,
      right: box.right,
      nextLeft: next.getBoundingClientRect().left,
      scrollX: window.scrollX,
    };
  });

  // The body's 16 px padding on each side: the container is the rest of the screen.
  expect(seen.width).toBeCloseTo(1440 - 32, 0);
  expect(seen.nextLeft).toBeCloseTo(seen.right + 12, 0);
  // What shows of it: the body's padding past the Space gap.
  expect(seen.nextLeft).toBeLessThanOrEqual(1440 - 4);
  expect(seen.scrollX).toBe(0);
});

test("bleeds into the screen's margins around a centred site", async ({ page }) => {
  // A 1040 px site on a 1440 px screen: 200 px of margin on each side for the neighbours.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  await page.getByLabel("Peek").selectOption("centred");

  const seen = await page.evaluate(() => {
    const stage = document.getElementById("stage") as HTMLElement;
    const next = Array.from(stage.children).find(
      (t) =>
        t.getAttribute("data-ts-space") === "1" && (t as HTMLElement).style.gridColumnStart === "1",
    ) as HTMLElement;
    const frame = (document.getElementById("frame") as HTMLElement).getBoundingClientRect();
    const box = stage.getBoundingClientRect();
    return {
      width: box.width,
      right: box.right,
      frameLeft: frame.left,
      frameRight: frame.right,
      nextLeft: next.getBoundingClientRect().left,
    };
  });

  expect(seen.width).toBeCloseTo(1040, 0);
  expect(seen.frameLeft).toBeCloseTo(0, 0);
  expect(seen.frameRight).toBeCloseTo(1440, 0);
  // The demo's Space gap starts at 12.
  expect(seen.nextLeft).toBeCloseTo(seen.right + 12, 0);
});
