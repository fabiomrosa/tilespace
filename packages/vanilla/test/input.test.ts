// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Four 1x1 Tiles on a 1x1 Grid, one per Space, swapping at once; a button inside Tile 0. */
const mount = (options: Partial<TilespaceOptions> = {}) => {
  const stage = document.createElement("div");
  for (let i = 0; i < 4; i++) stage.append(document.createElement("div"));
  const button = document.createElement("button");
  stage.firstElementChild?.append(button);
  document.body.append(stage);
  const tilespace = createTilespace(stage, { columns: 1, rows: 1, transition: false, ...options });
  return { stage, button, tilespace };
};

const key = (target: Element, name: string, init: KeyboardEventInit = {}) => {
  const event = new KeyboardEvent("keydown", {
    key: name,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
};

afterEach(() => {
  document.body.replaceChildren();
});

describe("the keyboard", () => {
  it("moves once per key with focus inside the Stage, and stops the page scrolling", () => {
    const { button, tilespace } = mount();

    const right = key(button, "ArrowRight");
    key(button, "PageDown");
    key(button, "ArrowLeft");
    key(button, "PageUp");
    key(button, "PageDown");

    expect(tilespace.current).toBe(1);
    expect(right.defaultPrevented).toBe(true);
  });

  it("uses the up and down arrows on a vertical axis", () => {
    const { button, tilespace } = mount({ axis: "vertical" });

    key(button, "ArrowRight");
    expect(tilespace.current).toBe(0);
    key(button, "ArrowDown");
    key(button, "ArrowDown");
    key(button, "ArrowUp");

    expect(tilespace.current).toBe(1);
  });

  it("ignores a key outside the Stage, repeated, with a modifier, in a field or already handled", () => {
    const { stage, tilespace } = mount();
    const tile = stage.firstElementChild as HTMLElement;
    const editable = document.createElement("div");
    editable.contentEditable = "true";
    const fields = ["input", "textarea", "select"].map((name) => document.createElement(name));
    tile.append(...fields, editable);
    const outside = document.createElement("button");
    document.body.append(outside);

    key(outside, "ArrowRight");
    key(stage, "ArrowRight", { repeat: true });
    for (const modifier of ["altKey", "ctrlKey", "metaKey", "shiftKey"]) {
      key(stage, "ArrowRight", { [modifier]: true });
    }
    const typed = [...fields, editable].map((field) => key(field, "ArrowRight"));
    const handled = new KeyboardEvent("keydown", {
      key: "ArrowRight",
      bubbles: true,
      cancelable: true,
    });
    handled.preventDefault();
    stage.dispatchEvent(handled);

    expect(tilespace.current).toBe(0);
    expect(typed.every((event) => !event.defaultPrevented)).toBe(true);
    // A field in a shadow root: `e2e/input.e2e.ts` (happy-dom doesn't retarget).
  });
});

describe("axis", () => {
  it("throws for a value other than horizontal or vertical", () => {
    const stage = document.createElement("div");
    const before = stage.outerHTML;

    expect(() =>
      createTilespace(stage, { columns: 1, rows: 1, axis: "diagonal" as "vertical" }),
    ).toThrow(new Error('tilespace: axis must be "horizontal" or "vertical", got diagonal'));
    expect(stage.outerHTML).toBe(before);
  });

  it("slides the default Transition along a vertical axis, settling by row", () => {
    const stage = document.createElement("div");
    for (let i = 0; i < 4; i++) stage.append(document.createElement("div"));
    Object.defineProperty(stage, "clientHeight", { value: 300 });
    const tilespace = createTilespace(stage, { columns: 1, rows: 2, axis: "vertical" });
    const tiles = Array.from(stage.children) as HTMLElement[];

    tilespace.next();

    const effect = (i: number) => tiles[i]?.getAnimations()[0]?.effect as KeyframeEffect;
    expect(effect(0).getKeyframes().at(-1)?.translate).toBe("0px -300px");
    expect(effect(2).getKeyframes()[0]?.translate).toBe("0px 300px");
    // In from the bottom, landing 40 px low, then settling in the Space's order: top first.
    expect(effect(2).getKeyframes()[1]?.translate).toBe("0px 40px");
    const end = (i: number) => Number(effect(i).getComputedTiming().endTime);
    expect(end(3)).toBeGreaterThan(end(2));
  });
});

describe("destroy", () => {
  it("removes the key listener", () => {
    const { button, tilespace } = mount();
    tilespace.destroy();

    const pressed = key(button, "ArrowRight");

    expect(tilespace.current).toBe(0);
    expect(pressed.defaultPrevented).toBe(false);
  });
});
