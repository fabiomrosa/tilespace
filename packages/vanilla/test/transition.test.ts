// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createTilespace } from "../src/index.ts";

/** Six 1x1 Tiles on a 2x1 Grid, 400 px wide: Space k holds Tiles 2k (left) and 2k + 1 (right). */
const mount = () => {
  const stage = document.createElement("div");
  for (let i = 0; i < 6; i++) stage.append(document.createElement("div"));
  Object.defineProperty(stage, "clientWidth", { value: 400 });
  document.body.append(stage);
  const before = stage.outerHTML;
  const tilespace = createTilespace(stage, { columns: 2, rows: 1 });
  return { stage, before, tilespace, tiles: Array.from(stage.children) as HTMLElement[] };
};

/** Ends every running Animation, as the browser does when their time is up. */
const finish = async (tiles: HTMLElement[]) => {
  for (const tile of tiles) for (const animation of tile.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve));
};

const visible = (tiles: HTMLElement[]) =>
  tiles.flatMap((t, i) => (t.style.visibility === "hidden" ? [] : [i]));

/** The `translate` an Animation starts and ends at, and its delay. */
const motion = (tile: HTMLElement | undefined) => {
  const [animation] = tile?.getAnimations() ?? [];
  const effect = animation?.effect as KeyframeEffect | undefined;
  const frames = effect?.getKeyframes() ?? [];
  return {
    from: frames[0]?.translate,
    to: frames.at(-1)?.translate,
    delay: effect?.getTiming().delay,
  };
};

describe("the default Transition", () => {
  it("slides the leaving Tiles out and the entering ones in, then hands visibility over", async () => {
    const { tilespace, tiles } = mount();

    tilespace.next();

    expect(tilespace.current).toBe(1);
    expect(visible(tiles)).toEqual([0, 1, 2, 3]);
    expect(motion(tiles[0])).toMatchObject({ from: "0px 0px", to: "-400px 0px" });
    expect(motion(tiles[2])).toMatchObject({ from: "400px 0px", to: "0px 0px" });
    expect(tiles[4]?.getAnimations()).toEqual([]);

    await finish(tiles);

    expect(visible(tiles)).toEqual([2, 3]);
    expect(tiles.filter((t) => t.hasAttribute("data-ts-current"))).toEqual([tiles[2], tiles[3]]);
    for (const tile of tiles) {
      expect(tile.getAnimations()).toEqual([]);
      expect(tile.style.translate).toBe("");
      expect(tile.style.opacity).toBe("");
    }
  });

  it("staggers the entering Tiles by their Cells from the edge they enter from", () => {
    const { tilespace, tiles } = mount();

    tilespace.next();
    // Entering from the right: the right Tile first.
    expect(motion(tiles[3]).delay).toBe(0);
    expect(motion(tiles[2]).delay).toBeGreaterThan(0);

    tilespace.prev();
    // Entering from the left: the left Tile first, sliding in from the left.
    expect(motion(tiles[0])).toMatchObject({ from: "-400px 0px", delay: 0 });
    expect(motion(tiles[1]).delay).toBeGreaterThan(0);
  });

  it("slides goTo towards a lower Space in from the left", () => {
    const { tilespace, tiles } = mount();
    tilespace.goTo(2);

    tilespace.goTo(1);

    expect(motion(tiles[2])).toMatchObject({ from: "-400px 0px", to: "0px 0px" });
  });

  it("finishes the running Transition at once when another move starts", async () => {
    const { tilespace, tiles } = mount();

    tilespace.next();
    tilespace.next();

    expect(tilespace.current).toBe(2);
    expect(tiles[0]?.getAnimations()).toEqual([]);
    expect(visible(tiles)).toEqual([2, 3, 4, 5]);
    await finish(tiles);
    expect(visible(tiles)).toEqual([4, 5]);
  });

  it("finishes the running Transition at once when the Tiles repack", async () => {
    const { stage, tilespace, tiles } = mount();

    tilespace.next();
    stage.append(document.createElement("div"));
    await new Promise((resolve) => setTimeout(resolve));

    expect(tilespace.current).toBe(1);
    expect(tiles.flatMap((t) => t.getAnimations())).toEqual([]);
    expect(visible(tiles)).toEqual([2, 3]);
  });

  it("cancels the running Transition on destroy and leaves the Stage as it was", async () => {
    const { stage, before, tilespace, tiles } = mount();

    tilespace.next();
    tilespace.destroy();
    await finish(tiles);

    expect(tiles.flatMap((t) => t.getAnimations())).toEqual([]);
    expect(stage.outerHTML).toBe(before);
  });
});
