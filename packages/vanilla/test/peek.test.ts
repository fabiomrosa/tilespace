// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Five 1x1 Tiles on a 1x1 Grid, one per Space, 400 by 300 px with a 10 px gap. */
const mount = (options: Partial<TilespaceOptions> = {}, swap = true) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 5; i++) stage.append(document.createElement("div"));
  let width = 400;
  Object.defineProperty(stage, "clientWidth", { get: () => width });
  Object.defineProperty(stage, "clientHeight", { value: 300 });
  const before = stage.outerHTML;
  const tilespace = createTilespace(stage, {
    columns: 1,
    rows: 1,
    gap: 10,
    peek: true,
    ...(swap && { transition: false as const }),
    ...options,
  });
  const tiles = Array.from(stage.children) as HTMLElement[];
  const resize = (w: number) => {
    width = w;
  };
  return { stage, before, tilespace, tiles, resize };
};

/** Each Tile as the page shows it: hidden, in the Stage, or peeking (`inert`) at a `translate`. */
const look = (tiles: HTMLElement[]) =>
  tiles.map((t) =>
    t.style.visibility === "hidden"
      ? "hidden"
      : t.hasAttribute("inert") && t.style.translate
        ? `peek ${t.style.translate}`
        : t.style.translate || "current",
  );

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("peek", () => {
  it("shows the neighbouring Spaces beside the Stage, inert, and lets the Stage overflow", () => {
    const { stage, tiles } = mount();

    expect(stage.style.overflowX).toBe("visible");
    expect(look(tiles)).toEqual(["current", "peek 410px 0px", "hidden", "hidden", "hidden"]);
  });

  it("moves the neighbours with the Current space, and wraps with loop", () => {
    const { tilespace, tiles } = mount({ loop: true });
    expect(look(tiles)[4]).toBe("peek -410px 0px");

    tilespace.next();

    expect(look(tiles)).toEqual([
      "peek -410px 0px",
      "current",
      "peek 410px 0px",
      "hidden",
      "hidden",
    ]);
  });

  it("peeks along a vertical axis", () => {
    const { tiles } = mount({ axis: "vertical" });

    expect(look(tiles)[1]).toBe("peek 0px 310px");
  });

  it("puts everything back on destroy", () => {
    const { stage, before, tilespace } = mount();
    tilespace.next();

    tilespace.destroy();

    expect(stage.outerHTML).toBe(before);
  });

  it("follows the Stage's size, even on a fixed Grid", () => {
    let resized = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { tiles, resize } = mount();

    resize(600);
    resized();

    expect(look(tiles)[1]).toBe("peek 610px 0px");
  });

  it("slides the default Transition one Stage size plus the gap, without peek too", () => {
    const { tilespace, tiles } = mount({ peek: false }, false);

    tilespace.next();

    const effect = tiles[1]?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    const frames = effect?.getKeyframes() ?? [];
    expect(frames[0]?.translate).toBe("410px 0px");
    expect(look(tiles)).not.toContain("peek 410px 0px");
  });

  it("keeps the peeking Tiles at full opacity through the slide, so nothing flashes", () => {
    const { tilespace, tiles } = mount({}, false);

    tilespace.next();

    const frames = (i: number) =>
      (tiles[i]?.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes() ?? [];
    expect(frames(1).map((f) => f.opacity)).toEqual(["1", "1", "1", "1"]);
    expect(frames(0).map((f) => f.opacity)).toEqual(["1", "1"]);
  });

  it("brings the entering Space into the Stage and hides the far neighbour while it moves", () => {
    // A Transition that only fades: the entering Tiles must already sit in the Stage.
    const fade: TilespaceOptions["transition"] = ({ entering }) =>
      entering.map(({ tile }) => tile.animate([{ opacity: 0 }, { opacity: 1 }], 300));
    const { tilespace, tiles } = mount({ loop: true, transition: fade }, false);
    tilespace.next();
    for (const tile of tiles) for (const a of tile.getAnimations()) a.finish();

    tilespace.next();

    // Space 1 leaves, Space 2 enters in place; Space 0 (the far neighbour) hides meanwhile.
    expect(look(tiles).slice(0, 3)).toEqual(["hidden", "current", "current"]);
  });

  it("measures the Stage again when a move begins", () => {
    const { tilespace, tiles, resize } = mount();

    resize(500);
    tilespace.next();

    expect(look(tiles)[2]).toBe("peek 510px 0px");
  });

  it("puts the Spaces a spaceGap apart, beside and in the slide", () => {
    const { tilespace, tiles } = mount({ spaceGap: 50 }, false);
    expect(look(tiles)[1]).toBe("peek 450px 0px");

    tilespace.next();

    const effect = tiles[1]?.getAnimations()[0]?.effect as KeyframeEffect | undefined;
    expect(effect?.getKeyframes()[0]?.translate).toBe("450px 0px");
  });

  it("keeps the spaceGap when it measures the Stage again, on a move and on a resize", () => {
    let resized = () => {};
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(callback: () => void) {
          resized = callback;
        }
        observe() {}
        disconnect() {}
      },
    );
    const { tilespace, tiles, resize } = mount({ spaceGap: 50 });

    resize(500);
    tilespace.next();
    expect(look(tiles)[2]).toBe("peek 550px 0px");
    resize(600);
    resized();

    expect(look(tiles)[2]).toBe("peek 650px 0px");
  });

  it("throws for a peek that is not true or false", () => {
    expect(() => mount({ peek: "yes" as unknown as boolean })).toThrow(
      new Error("tilespace: peek must be true or false, got yes"),
    );
  });
});
