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
    fill: effect?.getTiming().fill,
    end: Number(effect?.getComputedTiming().endTime),
    /** The slide's easing, the same for both Spaces so they move as one block. */
    easing: frames[0]?.easing === "linear" ? effect?.getTiming().easing : frames[0]?.easing,
  };
};

describe("the default Transition", () => {
  it("slides the leaving Tiles out and the entering ones in, then hands visibility over", async () => {
    const { tilespace, tiles } = mount();

    tilespace.next();

    expect(tilespace.current).toBe(1);
    expect(visible(tiles)).toEqual([0, 1, 2, 3]);
    expect(tiles.filter((t) => t.hasAttribute("data-ts-current"))).toEqual([tiles[2], tiles[3]]);
    // Leaving Tiles stay out once done; entering ones wait out of place through their delay.
    expect(motion(tiles[0])).toMatchObject({ from: "0px 0px", to: "-400px 0px", fill: "forwards" });
    expect(motion(tiles[2])).toMatchObject({ from: "400px 0px", to: "0px 0px", fill: "backwards" });
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

  it("slides the Space as one block, each way: one move per Tile, at full opacity", () => {
    const { tilespace, tiles } = mount();

    tilespace.next();
    // Every moving Tile: two keyframes on `translate`, no `opacity`, the same 500 ms and easing.
    const frames = (i: number) =>
      (tiles[i]?.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
    for (const i of [0, 1, 2, 3]) {
      expect(frames(i)).toHaveLength(2);
      expect(frames(i).every((k) => k.opacity === undefined)).toBe(true);
      expect(motion(tiles[i])).toMatchObject({ end: 500, easing: motion(tiles[0]).easing });
    }
    expect(motion(tiles[0]).easing).not.toBe("linear");
    expect(motion(tiles[3])).toMatchObject({ from: "400px 0px", to: "0px 0px" });

    tilespace.prev();
    expect(motion(tiles[0])).toMatchObject({ from: "-400px 0px", to: "0px 0px", end: 500 });
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

  it("keeps a new Transition started before the old one's end was handled", async () => {
    const { tilespace, tiles } = mount();

    tilespace.next();
    for (const animation of tiles.flatMap((t) => t.getAnimations())) animation.finish();
    tilespace.next();
    await new Promise((resolve) => setTimeout(resolve));

    expect(tiles[4]?.getAnimations()).toHaveLength(1);
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
