// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTilespace, type TilespaceOptions, type TransitionContext } from "../src/index.ts";

/** Four 1x1 Tiles on a 2x1 Grid, 400 by 300 px: Space k holds Tiles 2k and 2k + 1. */
const mount = (options: Partial<TilespaceOptions>) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 4; i++) stage.append(document.createElement("div"));
  Object.defineProperty(stage, "clientWidth", { value: 400 });
  Object.defineProperty(stage, "clientHeight", { value: 300 });
  const before = stage.outerHTML;
  const tilespace = createTilespace(stage, { columns: 2, rows: 1, ...options });
  return { stage, before, tilespace, tiles: Array.from(stage.children) as HTMLElement[] };
};

const finish = async (tiles: HTMLElement[]) => {
  for (const tile of tiles) for (const animation of tile.getAnimations()) animation.finish();
  await new Promise((resolve) => setTimeout(resolve));
};

const visible = (tiles: HTMLElement[]) =>
  tiles.flatMap((t, i) => (t.style.visibility === "hidden" ? [] : [i]));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("custom, none and reduced-motion Transitions", () => {
  it("plays a custom Transition's Animations with copies of what it needs, then cleans up", async () => {
    const seen: TransitionContext[] = [];
    const cols: number[][] = [];
    const fade = (context: TransitionContext) => {
      seen.push(structuredClone({ ...context, leaving: [], entering: [] }));
      cols.push(context.entering.map((e) => e.placement.col + e.placement.span.cols));
      const animations = context.entering.map(({ tile }) =>
        tile.animate([{ opacity: 0 }, { opacity: 1 }], 200),
      );
      // Changing what it got changes nothing the library keeps.
      (context.entering[0]?.placement as { col: number }).col = 9;
      (context.entering[1]?.placement.span as { cols: number }).cols = 9;
      (context.grid as { columns: number }).columns = 9;
      return animations;
    };
    const { tilespace, tiles } = mount({ transition: fade });

    tilespace.next();

    expect(seen).toEqual([
      {
        leaving: [],
        entering: [],
        direction: 1,
        axis: "horizontal",
        grid: { columns: 2, rows: 1 },
        width: 400,
        height: 300,
        gap: 0,
        peek: false,
      },
    ]);
    expect(tiles[2]?.getAnimations()).toHaveLength(1);
    await finish(tiles);
    expect(visible(tiles)).toEqual([2, 3]);
    expect(tiles.flatMap((t) => t.getAnimations())).toEqual([]);
    expect(tiles[2]?.style.gridColumnStart).toBe("1");

    tilespace.prev();
    tilespace.next();
    expect(seen[1]?.grid).toEqual({ columns: 2, rows: 1 });
    expect(cols).toEqual([
      [1, 2],
      [1, 2],
      [1, 2],
    ]);
  });

  it("hands a custom Transition the leaving and entering Tiles with their Placements", () => {
    let context: TransitionContext | undefined;
    const { tilespace, tiles } = mount({
      transition: (c) => {
        context = c;
        return [];
      },
    });

    tilespace.next();

    expect(context?.leaving.map((t) => t.tile)).toEqual([tiles[0], tiles[1]]);
    expect(context?.entering).toEqual([
      { tile: tiles[2], placement: { tile: 2, col: 0, row: 0, span: { cols: 1, rows: 1 } } },
      { tile: tiles[3], placement: { tile: 3, col: 1, row: 0, span: { cols: 1, rows: 1 } } },
    ]);
  });

  it("swaps at once with transition false", () => {
    const { tilespace, tiles } = mount({ transition: false });

    tilespace.next();

    expect(visible(tiles)).toEqual([2, 3]);
    expect(tiles.flatMap((t) => t.getAnimations())).toEqual([]);
  });

  it("swaps at once when a custom Transition returns no Animation", () => {
    const { tilespace, tiles } = mount({ transition: () => [] });

    tilespace.next();

    expect(visible(tiles)).toEqual([2, 3]);
  });

  it("throws even a falsy value a custom Transition throws", () => {
    const { tilespace } = mount({
      transition: () => {
        throw 0;
      },
    });

    expect(() => tilespace.next()).toThrow();
    expect(tilespace.current).toBe(1);
  });

  it("swaps at once and throws when a custom Transition throws", () => {
    const changes: number[] = [];
    const { tilespace, tiles } = mount({
      transition: () => {
        throw new Error("broken");
      },
    });
    tilespace.on("change", ({ current }) => changes.push(current));

    expect(() => tilespace.next()).toThrow("broken");

    expect(tilespace.current).toBe(1);
    expect(changes).toEqual([1]);
    expect(visible(tiles)).toEqual([2, 3]);
  });

  it.each([
    [
      "one Animation",
      (tile: HTMLElement) => {
        const animation = tile.animate([{ opacity: 0 }], 200);
        // Its maker cancels it below; nobody else waits on it.
        animation.finished.catch(() => {});
        return animation;
      },
    ],
    ["undefined", () => undefined],
    ["an array of numbers", () => [1]],
  ])("swaps at once and throws when a custom Transition returns %s", (_, make) => {
    const { stage, before, tilespace, tiles } = mount({
      transition: ({ entering }) =>
        make(entering[0]?.tile as HTMLElement) as unknown as Animation[],
    });

    expect(() => tilespace.next()).toThrow(
      /^tilespace: transition must return an array of Animations, got /,
    );
    expect(visible(tiles)).toEqual([2, 3]);
    // The engine never saw the stray Animation; its maker cancels it.
    for (const tile of tiles) for (const animation of tile.getAnimations()) animation.cancel();
    tilespace.destroy();
    expect(stage.outerHTML).toBe(before);
  });

  it("ends the Transition when its own Animation is cancelled by someone else", async () => {
    const { tilespace, tiles } = mount({
      transition: ({ entering }) => entering.map(({ tile }) => tile.animate([{ opacity: 0 }], 200)),
    });

    tilespace.next();
    tiles[2]?.getAnimations()[0]?.cancel();
    await finish(tiles);

    expect(visible(tiles)).toEqual([2, 3]);
  });

  it("cross-fades in place when the user prefers reduced motion", () => {
    const query: string[] = [];
    vi.stubGlobal("matchMedia", (q: string) => {
      query.push(q);
      return { matches: q === "(prefers-reduced-motion: reduce)" };
    });
    const { tilespace, tiles } = mount({});

    tilespace.next();

    expect(query).toEqual(["(prefers-reduced-motion: reduce)"]);
    for (const tile of tiles) {
      const [animation] = tile.getAnimations();
      const effect = animation?.effect as KeyframeEffect;
      expect(effect.getKeyframes().every((k) => k.translate === undefined)).toBe(true);
      expect(effect.getTiming().delay ?? 0).toBe(0);
    }
    const entering = tiles[2]?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    expect(entering?.getKeyframes().map((k) => k.opacity)).toEqual(["0", "1"]);
    const leaving = tiles[0]?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    expect(leaving?.getKeyframes().map((k) => k.opacity)).toEqual(["1", "0"]);
  });
});
