// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTilespace } from "../src/index.ts";

/** A ResizeObserver the test triggers by hand (happy-dom does no layout). */
class FakeResizeObserver {
  static last: FakeResizeObserver | undefined;
  observed: Element[] = [];
  disconnected = false;
  constructor(readonly callback: () => void) {
    FakeResizeObserver.last = this;
  }
  observe(el: Element) {
    this.observed.push(el);
  }
  disconnect() {
    this.disconnected = true;
  }
}

const resize = (stage: HTMLElement, width: number, height: number) => {
  Object.defineProperty(stage, "clientWidth", { configurable: true, value: width });
  Object.defineProperty(stage, "clientHeight", { configurable: true, value: height });
};

/** Six 1x1 Tiles on a Stage of the given size, its Grid derived from 100 px square cells. */
const mount = (width: number, height: number) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 6; i++) stage.append(document.createElement("div"));
  resize(stage, width, height);
  const tilespace = createTilespace(stage, { minCellWidth: 100 });
  const events: string[] = [];
  tilespace.on("pack", ({ spaces }) => events.push(`pack ${spaces}`));
  tilespace.on("change", ({ current }) => events.push(`change ${current}`));
  return { stage, tilespace, events, tiles: Array.from(stage.children) as HTMLElement[] };
};

const spaceOf = (tile: HTMLElement | undefined) => tile?.getAttribute("data-ts-space");

describe("a responsive Grid", () => {
  beforeEach(() => vi.stubGlobal("ResizeObserver", FakeResizeObserver));
  afterEach(() => vi.unstubAllGlobals());

  it("derives the Grid from the Stage's content size at mount", () => {
    const { stage, tiles } = mount(300, 200);

    expect(stage.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(stage.style.gridTemplateRows).toBe("repeat(2, 1fr)");
    expect(tiles.map(spaceOf)).toEqual(["0", "0", "0", "0", "0", "0"]);
    expect(FakeResizeObserver.last?.observed).toEqual([stage]);
    const padded = document.createElement("div");
    padded.style.padding = "10px";
    document.body.append(padded); // happy-dom computes no padding on a detached element.
    resize(padded, 310, 210);
    createTilespace(padded, { minCellWidth: 100 });
    expect(padded.style.gridTemplateColumns).toBe("repeat(2, 1fr)");
  });

  it("repacks when the Grid changes and keeps the first Tile on screen", () => {
    const { stage, tilespace, events, tiles } = mount(200, 100);
    tilespace.goTo(2);
    events.length = 0;

    // From 2 columns (Spaces of Tiles 0-1, 2-3, 4-5) to 3: Tile 4, first on screen, is in Space 1.
    resize(stage, 300, 100);
    FakeResizeObserver.last?.callback();

    expect(events).toEqual(["pack 2", "change 1"]);
    expect(tilespace.current).toBe(1);
    expect(stage.style.gridTemplateColumns).toBe("repeat(3, 1fr)");
    expect(tiles.map(spaceOf)).toEqual(["0", "0", "0", "1", "1", "1"]);
    expect(tiles[4]?.style.gridColumnStart).toBe("2");
    expect(tiles.map((t) => t.style.visibility)).toEqual([
      "hidden",
      "hidden",
      "hidden",
      "",
      "",
      "",
    ]);
  });

  it("does nothing when a resize leaves the Grid as it was", () => {
    const { stage, events } = mount(300, 100);

    resize(stage, 350, 120);
    FakeResizeObserver.last?.callback();

    expect(events).toEqual([]);
  });

  it("fires pack without change when the Current space keeps its index", () => {
    const { stage, events } = mount(200, 100);

    resize(stage, 300, 100);
    FakeResizeObserver.last?.callback();

    expect(events).toEqual(["pack 2"]);
  });

  it("disconnects the observer on destroy", () => {
    const { tilespace } = mount(300, 100);

    tilespace.destroy();

    expect(FakeResizeObserver.last?.disconnected).toBe(true);
  });

  it("observes nothing with a fixed Grid", () => {
    FakeResizeObserver.last = undefined;
    const stage = document.createElement("div");
    createTilespace(stage, { columns: 2, rows: 2 });

    expect(FakeResizeObserver.last).toBeUndefined();
  });
});
