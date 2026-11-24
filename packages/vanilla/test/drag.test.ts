// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Three 1x1 Tiles on a 1x1 Grid, 400 px wide: Tile k alone in Space k. */
const mount = (options: Partial<TilespaceOptions> = {}) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 3; i++) stage.append(document.createElement("div"));
  Object.defineProperty(stage, "clientWidth", { value: 400 });
  Object.defineProperty(stage, "clientHeight", { value: 300 });
  document.body.append(stage);
  const tilespace = createTilespace(stage, { columns: 1, rows: 1, ...options });
  const changes: number[] = [];
  tilespace.on("change", ({ current }) => changes.push(current));
  return { stage, tilespace, changes, tiles: Array.from(stage.children) as HTMLElement[] };
};

/** A pointer event at `x` (and `y`), `t` ms into the gesture. */
const pointer = (target: Element, type: string, x: number, t: number, y = 100) => {
  const event = new PointerEvent(type, {
    clientX: x,
    clientY: y,
    pointerId: 1,
    isPrimary: true,
    bubbles: true,
    cancelable: true,
  });
  Object.defineProperty(event, "timeStamp", { value: t });
  target.dispatchEvent(event);
};

/** Presses at x = 300, moves through each x, 100 ms apart unless `dt` says, and releases. */
const drag = (target: Element, xs: number[], dt = 100) => {
  pointer(target, "pointerdown", 300, 0);
  for (const [i, x] of xs.entries()) pointer(target, "pointermove", x, (i + 1) * dt);
  pointer(target, "pointerup", xs.at(-1) ?? 300, (xs.length + 1) * dt);
};

const finish = async (tiles: HTMLElement[]) => {
  for (const tile of tiles) for (const animation of tile.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve));
};

const visible = (tiles: HTMLElement[]) =>
  tiles.flatMap((t, i) => (t.style.visibility === "hidden" ? [] : [i]));

afterEach(() => {
  document.body.replaceChildren();
});

describe("the Drag", () => {
  it("scrubs the paused Transition with the distance, then commits past half", async () => {
    const { tilespace, changes, tiles } = mount();

    pointer(tiles[0] as HTMLElement, "pointerdown", 300, 0);
    pointer(tiles[0] as HTMLElement, "pointermove", 200, 100);
    const [leaving] = tiles[0]?.getAnimations() ?? [];
    const end = leaving?.effect?.getComputedTiming().endTime as number;
    expect(leaving?.playState).toBe("paused");
    expect(leaving?.currentTime).toBeCloseTo(end / 4);
    expect(tilespace.current).toBe(0);
    pointer(tiles[0] as HTMLElement, "pointermove", 60, 200);
    expect(changes).toEqual([]);
    pointer(tiles[0] as HTMLElement, "pointerup", 60, 300);

    expect(tilespace.current).toBe(1);
    expect(changes).toEqual([1]);
    expect(leaving?.playState).toBe("running");
    await finish(tiles);
    expect(visible(tiles)).toEqual([1]);
  });

  it("cancels a short slow Drag, playing the Transition back", async () => {
    const { tilespace, changes, tiles } = mount();

    drag(tiles[0] as HTMLElement, [250, 200]);

    expect(tilespace.current).toBe(0);
    expect(tiles[0]?.getAnimations()[0]?.playbackRate).toBeLessThan(0);
    await finish(tiles);
    expect(visible(tiles)).toEqual([0]);
    expect(tiles[0]?.hasAttribute("data-ts-current")).toBe(true);
    expect(changes).toEqual([]);
  });

  it("commits a flick, and drags back towards the previous Space", () => {
    const { stage, tilespace } = mount();

    // 60 px in 20 ms: far short of half, but fast.
    drag(stage, [280, 240], 10);
    expect(tilespace.current).toBe(1);
    pointer(stage, "pointerdown", 100, 1000);
    pointer(stage, "pointermove", 140, 1010);
    pointer(stage, "pointermove", 180, 1020);
    pointer(stage, "pointerup", 180, 1030);

    expect(tilespace.current).toBe(0);
  });

  it("lets a click below the threshold reach the Tile, and stops the one after a Drag", async () => {
    const { tiles } = mount({ transition: false });
    const clicks: number[] = [];
    tiles[0]?.addEventListener("click", () => clicks.push(0));
    tiles[1]?.addEventListener("click", () => clicks.push(1));

    drag(tiles[0] as HTMLElement, [296]);
    tiles[0]?.click();
    drag(tiles[0] as HTMLElement, [200, 50]);
    // Stopped at the Stage, in the capture phase, before it reaches the Tile.
    tiles[1]?.click();
    tiles[1]?.click();
    // A touch Drag, with no click after it, stops none later.
    drag(tiles[0] as HTMLElement, [200, 50]);
    await new Promise((resolve) => setTimeout(resolve));
    tiles[1]?.click();

    expect(clicks).toEqual([0, 1, 1]);
  });

  it("leaves a mostly cross-axis gesture alone, and uses the vertical axis when asked", () => {
    const { stage, tilespace } = mount({ transition: false, axis: "vertical" });

    // Across first (sideways), then along: still the page's gesture, not a Drag.
    pointer(stage, "pointerdown", 300, 0, 250);
    pointer(stage, "pointermove", 100, 100, 250);
    pointer(stage, "pointermove", 100, 200, 50);
    pointer(stage, "pointerup", 100, 300, 50);
    expect(tilespace.current).toBe(0);
    pointer(stage, "pointerdown", 100, 0, 250);
    pointer(stage, "pointermove", 100, 100, 50);
    pointer(stage, "pointerup", 100, 200, 50);

    expect(tilespace.current).toBe(1);
  });

  it("sets touch-action for the other axis and puts it back on destroy", () => {
    const { stage, tilespace } = mount();
    expect(stage.style.touchAction).toBe("pan-y pinch-zoom");

    tilespace.destroy();

    expect(stage.hasAttribute("style")).toBe(false);
  });

  it("drops a Drag that a move or destroy ended, and listens no more after destroy", async () => {
    const { stage, tilespace, tiles } = mount();
    pointer(stage, "pointerdown", 300, 0);
    pointer(stage, "pointermove", 100, 100);
    const [scrubbed] = tiles[0]?.getAnimations() ?? [];

    tilespace.goTo(2);
    // Scrubbing the cancelled Animations would bring them back (Chrome applies them again).
    pointer(stage, "pointermove", 50, 150);
    expect(scrubbed?.currentTime).toBeNull();
    pointer(stage, "pointerup", 100, 200);
    await finish(tiles);
    expect(tilespace.current).toBe(2);
    expect(visible(tiles)).toEqual([2]);

    tilespace.destroy();
    const clicks: number[] = [];
    tiles[2]?.addEventListener("click", () => clicks.push(2));
    drag(stage, [100]);
    // A Drag listener left behind would stop this click.
    tiles[2]?.click();
    expect(tilespace.current).toBe(2);
    expect(clicks).toEqual([2]);
    expect(tiles.flatMap((t) => t.getAnimations())).toEqual([]);
  });
});
