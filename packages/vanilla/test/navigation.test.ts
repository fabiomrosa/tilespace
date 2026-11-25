// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Four 2x2 Tiles on a 2x2 Grid: one Tile per Space, Tile i in Space i. */
const mount = (options: Partial<TilespaceOptions> = {}) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 4; i++) {
    const tile = document.createElement("div");
    tile.setAttribute("data-ts-shape", "2x2");
    stage.append(tile);
  }
  const tilespace = createTilespace(stage, { columns: 2, rows: 2, ...options });
  const changes: number[] = [];
  tilespace.on("change", ({ current }) => changes.push(current));
  return { stage, tilespace, changes, tiles: Array.from(stage.children) as HTMLElement[] };
};

/** Ends every running Transition (happy-dom never ends an Animation by itself). */
const finish = async (tiles: HTMLElement[]) => {
  for (const tile of tiles) for (const animation of tile.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve));
};

/** The Spaces whose Tiles are shown, read from the DOM. */
const shown = (tiles: HTMLElement[]) =>
  tiles.flatMap((t, i) =>
    t.style.visibility !== "hidden" && t.hasAttribute("data-ts-current") ? [i] : [],
  );

describe("navigation", () => {
  it("says from which side each move came: 1 from the next Space, -1 from the previous", () => {
    const { tilespace } = mount({ loop: true, transition: false });
    const directions: number[] = [];
    tilespace.on("change", ({ direction }) => directions.push(direction));

    tilespace.next();
    tilespace.prev();
    // The loop's wrap: back from Space 0 to the last, then on from the last to Space 0.
    tilespace.prev();
    tilespace.next();
    tilespace.goTo(2);
    tilespace.goTo(1);

    expect(directions).toEqual([1, -1, -1, 1, 1, -1]);
  });

  it("moves one Space with next and prev and stops at the ends", async () => {
    const { tilespace, changes, tiles } = mount();

    tilespace.prev();
    tilespace.next();
    tilespace.next();
    expect(tilespace.current).toBe(2);
    await finish(tiles);
    expect(shown(tiles)).toEqual([2]);
    tilespace.next();
    tilespace.next();
    tilespace.prev();
    await finish(tiles);

    expect(tilespace.current).toBe(2);
    expect(shown(tiles)).toEqual([2]);
    expect(tiles.filter((t) => t.style.visibility === "hidden")).toHaveLength(3);
    expect(tiles.filter((t) => t.hasAttribute("data-ts-current"))).toEqual([tiles[2]]);
    expect(changes).toEqual([1, 2, 3, 2]);
  });

  it("wraps at the ends with loop", () => {
    const { tilespace, changes } = mount({ loop: true });

    tilespace.prev();
    tilespace.next();

    expect(changes).toEqual([3, 0]);
  });

  it("goes to a Space, and fires nothing for the Current space", async () => {
    const { tilespace, changes, tiles } = mount();

    tilespace.goTo(3);
    tilespace.goTo(3);
    tilespace.goTo(0);
    await finish(tiles);

    expect(changes).toEqual([3, 0]);
    expect(shown(tiles)).toEqual([0]);
  });

  it.each([-1, 4, 1.5, Number.NaN])("throws for goTo(%s)", (space) => {
    const { tilespace } = mount();
    expect(() => tilespace.goTo(space)).toThrow(
      new Error(`tilespace: goTo needs a Space from 0 to 3, got ${space}`),
    );
  });

  it("does nothing on an empty Stage, even with loop", () => {
    const tilespace = createTilespace(document.createElement("div"), {
      columns: 1,
      rows: 1,
      loop: true,
    });
    const changes: number[] = [];
    tilespace.on("change", ({ current }) => changes.push(current));

    tilespace.prev();
    tilespace.next();

    expect(changes).toEqual([]);
    expect(tilespace.current).toBe(0);
    expect(() => tilespace.goTo(0)).toThrow(
      new Error("tilespace: goTo needs a Space, but the Stage has no Tiles"),
    );
  });

  it("skips a listener removed during the same change, by another or by destroy", () => {
    const { tilespace } = mount();
    const heard: string[] = [];
    let offB = () => {};
    tilespace.on("change", () => {
      heard.push("a");
      offB();
    });
    offB = tilespace.on("change", () => heard.push("b"));
    tilespace.on("change", () => {
      heard.push("c");
      tilespace.destroy();
    });
    tilespace.on("change", () => heard.push("d"));

    tilespace.next();

    expect(heard).toEqual(["a", "c"]);
  });

  it("stops calling a listener once it unsubscribes or the Tilespace is destroyed", () => {
    const { tilespace, changes } = mount();
    const other: number[] = [];
    const off = tilespace.on("change", ({ current }) => other.push(current));

    tilespace.next();
    off();
    tilespace.next();
    tilespace.destroy();
    tilespace.goTo(0);

    expect(other).toEqual([1]);
    expect(changes).toEqual([1, 2]);
  });

  it("restores on destroy after moving, with the user's own visibility, and moves no more", () => {
    const stage = document.createElement("div");
    for (let i = 0; i < 3; i++) stage.append(document.createElement("div"));
    (stage.children[1] as HTMLElement).style.visibility = "collapse";
    const before = stage.outerHTML;
    const tilespace = createTilespace(stage, { columns: 1, rows: 1 });

    tilespace.next();
    expect((stage.children[1] as HTMLElement).style.visibility).toBe("collapse");
    tilespace.next();
    tilespace.destroy();
    expect(stage.outerHTML).toBe(before);
    // A move after destroy() writes nothing.
    tilespace.prev();

    expect(stage.outerHTML).toBe(before);
  });
});
