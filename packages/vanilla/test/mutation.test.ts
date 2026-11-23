// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createTilespace } from "../src/index.ts";

/** Lets the MutationObserver deliver its records. */
const flush = () => new Promise((resolve) => setTimeout(resolve));

/** Tiles of the given Shapes on a 2x1 Grid. */
const mount = (shapes: string[]) => {
  const stage = document.createElement("div");
  for (const shape of shapes) {
    const tile = document.createElement("div");
    tile.setAttribute("data-ts-shape", shape);
    stage.append(tile);
  }
  const tilespace = createTilespace(stage, { columns: 2, rows: 1 });
  const events: string[] = [];
  tilespace.on("pack", ({ spaces }) => events.push(`pack ${spaces}`));
  tilespace.on("change", ({ current }) => events.push(`change ${current}`));
  return { stage, tilespace, events };
};

const spaces = (stage: HTMLElement) =>
  Array.from(stage.children, (t) => t.getAttribute("data-ts-space"));

describe("repacking on added and removed Tiles", () => {
  it("places an added child and fires pack", async () => {
    const { stage, events } = mount(["1x1", "1x1"]);
    const added = document.createElement("div");
    added.setAttribute("data-ts-shape", "2x1");

    stage.append(added);
    await flush();

    expect(events).toEqual(["pack 2"]);
    expect(spaces(stage)).toEqual(["0", "0", "1"]);
    expect(added.getAttribute("data-ts-span")).toBe("2x1");
    expect(added.style.visibility).toBe("hidden");
  });

  it("leaves a removed child as it was before mounting and repacks the rest", async () => {
    const stage = document.createElement("div");
    for (const shape of ["2x1", "1x1", "1x1"]) {
      const tile = document.createElement("div");
      tile.setAttribute("data-ts-shape", shape);
      stage.append(tile);
    }
    const removed = stage.children[0] as HTMLElement;
    removed.style.color = "red";
    const before = removed.outerHTML;
    const tilespace = createTilespace(stage, { columns: 2, rows: 1 });
    expect(tilespace.current).toBe(0);

    removed.remove();
    await flush();

    expect(removed.outerHTML).toBe(before);
    expect(spaces(stage)).toEqual(["0", "0"]);
    expect(Array.from(stage.children, (t) => (t as HTMLElement).style.visibility)).toEqual([
      "",
      "",
    ]);
  });

  it("keeps the first Tile on screen in view when it remains", async () => {
    const { stage, tilespace, events } = mount(["2x1", "2x1", "2x1", "2x1"]);
    tilespace.goTo(2);
    events.length = 0;

    stage.children[0]?.remove();
    await flush();

    // The third Tile was alone in Space 2; with the first Tile gone it is in Space 1.
    expect(events).toEqual(["pack 3", "change 1"]);
    expect(tilespace.current).toBe(1);
  });

  it("stays in range when the Current space's Tiles are removed", async () => {
    const { stage, tilespace } = mount(["2x1", "2x1", "2x1"]);
    tilespace.goTo(2);

    stage.children[2]?.remove();
    await flush();

    expect(tilespace.current).toBe(1);
    expect(stage.children[1]?.hasAttribute("data-ts-current")).toBe(true);
  });

  it("leaves a removed child alone when the repack fails", async () => {
    const { stage, tilespace } = mount(["1x1", "1x1", "1x1"]);
    const removed = stage.children[0] as HTMLElement;
    const bad = document.createElement("div");
    bad.setAttribute("data-ts-shape", "2y1");

    // The repack throws inside the observer (happy-dom swallows it), so the bad child is unplaced.
    removed.remove();
    stage.append(bad);
    await flush();
    tilespace.goTo(1);

    expect(bad.hasAttribute("data-ts-span")).toBe(false);
    expect(removed.outerHTML).toBe('<div data-ts-shape="1x1"></div>');
  });

  it("fires nothing when only text or comments change", async () => {
    const { stage, events } = mount(["1x1", "1x1", "1x1"]);

    stage.append(document.createComment("anchor"), document.createTextNode(" "));
    await flush();

    expect(events).toEqual([]);
  });

  it("follows the Stage no more after destroy", async () => {
    const { stage, tilespace, events } = mount(["1x1"]);
    tilespace.destroy();

    stage.append(document.createElement("div"));
    await flush();

    expect(events).toEqual([]);
    expect(stage.lastElementChild?.hasAttribute("style")).toBe(false);
  });
});
