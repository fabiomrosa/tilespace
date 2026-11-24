import { expect, type Page, test } from "@playwright/test";
import { type Grid, pack, type Shape } from "@tilespace/core";

/** The demo's gap, in CSS pixels (`demo/main.ts`). */
const GAP = 12;

/** What the page shows: the Grid CSS grid laid out, each Tile's Shape and box, and the Current space's Tiles. */
const read = (page: Page) =>
  page.evaluate(() => {
    const stage = document.getElementById("stage") as HTMLElement;
    const style = getComputedStyle(stage);
    const box = (el: Element) => {
      const { x, y, width, height } = el.getBoundingClientRect();
      return { x, y, width, height };
    };
    const tiles = Array.from(stage.children);
    return {
      grid: {
        // Chrome resolves `repeat(n, 1fr)` to n pixel tracks.
        columns: style.gridTemplateColumns.split(" ").length,
        rows: style.gridTemplateRows.split(" ").length,
      },
      stage: box(stage),
      shapes: tiles.map((t) => t.getAttribute("data-ts-shape") ?? ""),
      boxes: tiles.map(box),
      visible: tiles.flatMap((t, i) => (getComputedStyle(t).visibility === "visible" ? [i] : [])),
      marked: tiles.flatMap((t, i) => (t.hasAttribute("data-ts-current") ? [i] : [])),
    };
  });

const shapeOf = (value: string): Shape =>
  value.split(" ").map((span) => {
    const [cols, rows] = span.split("x").map(Number);
    return { cols: cols as number, rows: rows as number };
  });

/**
 * Packs the page's Shapes into the page's Grid here, in Node, and checks that the Tiles shown are
 * the Space's, each where its Placement says. Returns the Packing.
 */
const expectSpace = async (page: Page, space: number) => {
  const seen = await read(page);
  const grid: Grid = seen.grid;
  const packing = pack(seen.shapes.map(shapeOf), grid);
  const placements = packing.spaces[space] ?? [];
  const cell = {
    width: (seen.stage.width - GAP * (grid.columns - 1)) / grid.columns,
    height: (seen.stage.height - GAP * (grid.rows - 1)) / grid.rows,
  };

  const tiles = placements.map((p) => p.tile).toSorted((a, b) => a - b);
  expect(seen.visible).toEqual(tiles);
  expect(seen.marked).toEqual(tiles);
  for (const { tile, col, row, span } of placements) {
    const box = seen.boxes[tile];
    expect(box?.x).toBeCloseTo(seen.stage.x + col * (cell.width + GAP), 0);
    expect(box?.y).toBeCloseTo(seen.stage.y + row * (cell.height + GAP), 0);
    expect(box?.width).toBeCloseTo(span.cols * cell.width + (span.cols - 1) * GAP, 0);
    expect(box?.height).toBeCloseTo(span.rows * cell.height + (span.rows - 1) * GAP, 0);
  }
  return { grid, packing };
};

test("places the Tiles where the Packing says, through next and a resize", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto("/");
  const wide = await expectSpace(page, 0);
  await expect(page.getByText(`Space 1 of ${wide.packing.spaces.length}`)).toBeVisible();

  await page.getByRole("button", { name: "Next" }).click();
  await expectSpace(page, 1);
  const first = wide.packing.spaces[1]?.[0]?.tile;

  await page.setViewportSize({ width: 600, height: 800 });
  await expect.poll(async () => (await read(page)).grid.columns).toBeLessThan(wide.grid.columns);
  const seen = await read(page);
  const narrow = pack(seen.shapes.map(shapeOf), seen.grid);
  // The first Tile on screen before the resize is still on screen.
  const space = narrow.spaces.findIndex((s) => s.some((p) => p.tile === first));
  await expectSpace(page, space);
  await expect(page.getByText(`Space ${space + 1} of ${narrow.spaces.length}`)).toBeVisible();
});

test("leaves the Stage as the page wrote it after destroy", async ({ page, request }) => {
  await page.goto("/");
  const html = await (await request.get("/")).text();

  await page.getByRole("button", { name: "Destroy" }).click();

  // No `style=""` left on a Tile, and the page's own longhands back: the Stage's lone `row-gap` (lost
  // if the engine wrote the `gap` shorthand) and a Tile's `grid-column-start`. Chrome may serialize
  // inline styles differently from the source, so the source goes through the same serializer.
  const [now, before] = await page.evaluate((source) => {
    const parsed = new DOMParser().parseFromString(source, "text/html");
    for (const el of parsed.querySelectorAll<HTMLElement>("[style]")) {
      el.setAttribute("style", el.style.cssText);
    }
    return [document.getElementById("stage")?.outerHTML, parsed.getElementById("stage")?.outerHTML];
  }, html);
  expect(now).toBe(before);
});
