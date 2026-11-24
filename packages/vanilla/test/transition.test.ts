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
    /** Where the Tile is when the Space's slide is over. */
    landed: frames[1]?.translate,
    /** The opacity it starts (or, leaving, ends) at: faint while the Space slides. */
    faint: frames[0]?.opacity === "1" ? frames.at(-1)?.opacity : frames[0]?.opacity,
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

  it("slides the Space as one block, then settles its Tiles in their order within it", () => {
    const { tilespace, tiles } = mount();

    tilespace.next();
    const [leaving, first, second] = [motion(tiles[0]), motion(tiles[2]), motion(tiles[3])];
    // The block: every Tile lands when the leaving ones end, with no stagger.
    expect(motion(tiles[1]).end).toBe(leaving.end);
    const landsAt = (tile: HTMLElement | undefined) => {
      const effect = tile?.getAnimations()[0]?.effect as KeyframeEffect;
      return (
        (effect.getKeyframes()[1]?.computedOffset ?? 0) * Number(effect.getComputedTiming().endTime)
      );
    };
    expect(landsAt(tiles[2])).toBeCloseTo(leaving.end);
    expect(landsAt(tiles[3])).toBeCloseTo(leaving.end);
    expect(leaving).toMatchObject({ faint: "0.4", easing: first.easing });
    expect(first.faint).toBe("0.4");
    expect(first.easing).not.toBe("linear");
    // Then each settles, a short slide from where it landed, in the Space's order.
    expect(first.landed).toBe("8px 0px");
    expect(first.end).toBeGreaterThan(leaving.end);
    expect(second.end).toBeGreaterThan(first.end);

    tilespace.prev();
    // Backwards, in from the left, still in the Space's own order.
    expect(motion(tiles[0])).toMatchObject({ from: "-400px 0px", landed: "-8px 0px" });
    expect(motion(tiles[1]).end).toBeGreaterThan(motion(tiles[0]).end);
  });

  it("settles a Space's Tiles column by column on a horizontal 2-D Grid", () => {
    const stage = document.createElement("div");
    for (let i = 0; i < 8; i++) stage.append(document.createElement("div"));
    Object.defineProperty(stage, "clientWidth", { value: 400 });
    const tilespace = createTilespace(stage, { columns: 2, rows: 2 });
    const tiles = Array.from(stage.children) as HTMLElement[];

    tilespace.next();

    // Space 1 fills (0,0), (0,1), (1,0), (1,1): Tiles 4 and 5 down the first column, then 6 and 7.
    expect(tiles[5]?.style.gridColumnStart).toBe("1");
    const ends = [4, 5, 6, 7].map((i) => motion(tiles[i]).end);
    expect(ends).toEqual(ends.toSorted((a, b) => a - b));
    expect(new Set(ends).size).toBe(4);
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
