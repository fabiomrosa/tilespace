// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Four 1x1 Tiles on a 1x1 Grid, 400 by 300 px: Tile k alone in Space k. */
const mount = (options: Partial<TilespaceOptions> = {}) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 4; i++) stage.append(document.createElement("div"));
  Object.defineProperty(stage, "clientWidth", { value: 400 });
  Object.defineProperty(stage, "clientHeight", { value: 300 });
  document.body.append(stage);
  const before = stage.outerHTML;
  const tilespace = createTilespace(stage, { columns: 1, rows: 1, ...options });
  return { stage, before, tilespace, tiles: Array.from(stage.children) as HTMLElement[] };
};

/** The Tiles that are `inert`, by index. */
const inert = (tiles: HTMLElement[]) =>
  tiles.flatMap((t, i) => (t.hasAttribute("inert") ? [i] : []));

const finish = async (tiles: HTMLElement[]) => {
  for (const tile of tiles) for (const animation of tile.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve));
};

/** A pointer event at `x`, `t` ms into the gesture. */
const pointer = (target: Element, type: string, x: number, t: number) => {
  const event = new PointerEvent(type, {
    clientX: x,
    clientY: 100,
    pointerId: 1,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "timeStamp", { value: t });
  target.dispatchEvent(event);
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("inert", () => {
  it("makes every Tile outside the Current space inert, after mount and after each move", async () => {
    const { tilespace, tiles } = mount();
    expect(inert(tiles)).toEqual([1, 2, 3]);

    tilespace.next();
    await finish(tiles);
    expect(inert(tiles)).toEqual([0, 2, 3]);

    tilespace.goTo(3);
    await finish(tiles);
    expect(inert(tiles)).toEqual([0, 1, 2]);
  });

  it("does so with peek too, the neighbours included", async () => {
    const { tilespace, tiles } = mount({ peek: true, loop: true });
    expect(inert(tiles)).toEqual([1, 2, 3]);

    tilespace.next();
    await finish(tiles);
    expect(inert(tiles)).toEqual([0, 2, 3]);
  });

  it("leaves only the entering Tiles reachable while a move runs, with and without peek", () => {
    for (const peek of [false, true]) {
      const { tilespace, tiles } = mount({ peek });

      tilespace.next();

      expect(inert(tiles)).toEqual([0, 2, 3]);
      document.body.replaceChildren();
    }
  });

  it("puts back the same inert Tiles when a Drag is cancelled", async () => {
    const { stage, tiles } = mount();

    pointer(stage, "pointerdown", 300, 0);
    pointer(stage, "pointermove", 260, 1000);
    pointer(stage, "pointerup", 260, 2000);
    await finish(tiles);

    expect(inert(tiles)).toEqual([1, 2, 3]);
  });

  it("restores each Tile's own inert on destroy", () => {
    const stage = document.createElement("div");
    for (let i = 0; i < 3; i++) stage.append(document.createElement("div"));
    stage.children[0]?.setAttribute("inert", "");
    stage.children[1]?.setAttribute("inert", "");
    const before = stage.outerHTML;
    const tilespace = createTilespace(stage, { columns: 1, rows: 1, transition: false });
    tilespace.next();

    tilespace.destroy();

    expect(stage.outerHTML).toBe(before);
  });
});
