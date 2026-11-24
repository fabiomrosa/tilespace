// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createTilespace } from "../src/index.ts";

/** Four 1x1 Tiles on a 1x1 Grid, one per Space, swapping at once. */
const mount = () => {
  const stage = document.createElement("div");
  for (let i = 0; i < 4; i++) stage.append(document.createElement("div"));
  document.body.append(stage);
  const tilespace = createTilespace(stage, { columns: 1, rows: 1, transition: false });
  return { stage, tilespace };
};

const wheel = (target: Element, deltaY: number, deltaX = 0) => {
  const event = new WheelEvent("wheel", { deltaX, deltaY, bubbles: true, cancelable: true });
  target.dispatchEvent(event);
  return event;
};

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("the wheel", () => {
  it("moves one Space per gesture, ended by a quiet gap", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();

    // A trackpad flick: a burst of events, then momentum, each within the gap.
    for (let i = 0; i < 20; i++) {
      wheel(stage, 30 - i);
      vi.advanceTimersByTime(16);
    }
    expect(tilespace.current).toBe(1);

    vi.advanceTimersByTime(300);
    wheel(stage, 0, -40);

    expect(tilespace.current).toBe(0);
  });

  it("lets the page scroll when the gesture moved nothing", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();

    const up = wheel(stage, -40);
    vi.advanceTimersByTime(300);
    const down = wheel(stage, 40);
    const momentum = wheel(stage, 20);

    expect(up.defaultPrevented).toBe(false);
    expect(down.defaultPrevented).toBe(true);
    expect(momentum.defaultPrevented).toBe(true);
    expect(tilespace.current).toBe(1);
  });

  it("leaves a gesture to what it starts on when that scrolls or handles it", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();
    const list = document.createElement("div");
    list.style.overflowY = "auto";
    Object.defineProperty(list, "scrollHeight", { value: 400 });
    Object.defineProperty(list, "clientHeight", { value: 40 });
    const map = document.createElement("div");
    map.addEventListener("wheel", (event) => event.preventDefault());
    stage.firstElementChild?.append(list, map);

    const scrolled = wheel(list, 40);
    wheel(list, 40);
    vi.advanceTimersByTime(300);
    wheel(map, 40);
    vi.advanceTimersByTime(300);
    expect(tilespace.current).toBe(0);
    // Scrolled to its end, the list can't take the gesture: the Tilespace does.
    Object.defineProperty(list, "scrollTop", { value: 360 });
    wheel(list, 40);

    expect(tilespace.current).toBe(1);
    expect(scrolled.defaultPrevented).toBe(false);
    // At its end, it can still scroll back up: that gesture is the list's.
    vi.advanceTimersByTime(300);
    wheel(list, -40);
    expect(tilespace.current).toBe(1);
  });

  it("reads a reversed scroller's position, which runs from 0 down", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();
    tilespace.next();
    // A chat list: `column-reverse` starts at its bottom, at scrollTop 0, and scrolls up below 0.
    const chat = document.createElement("div");
    chat.style.cssText = "display: flex; flex-direction: column-reverse; overflow-y: auto";
    Object.defineProperty(chat, "scrollHeight", { value: 400 });
    Object.defineProperty(chat, "clientHeight", { value: 40 });
    stage.children[1]?.append(chat);

    wheel(chat, -40);
    vi.advanceTimersByTime(300);
    expect(tilespace.current).toBe(1);
    wheel(chat, 40);

    expect(tilespace.current).toBe(2);
  });

  it("checks only the axis the gesture moves along", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();
    const carousel = document.createElement("div");
    carousel.style.overflowX = "auto";
    Object.defineProperty(carousel, "scrollWidth", { value: 400 });
    Object.defineProperty(carousel, "clientWidth", { value: 40 });
    stage.firstElementChild?.append(carousel);

    // Mostly vertical: the carousel, which only scrolls sideways, doesn't take it.
    wheel(carousel, 40, 5);
    expect(tilespace.current).toBe(1);
    vi.advanceTimersByTime(300);
    // Sideways, it does.
    wheel(carousel, 0, 40);

    expect(tilespace.current).toBe(1);
  });

  it("ignores a pinch zoom", () => {
    const { stage, tilespace } = mount();
    const pinch = new WheelEvent("wheel", { deltaY: 40, bubbles: true });
    // happy-dom's WheelEvent has no `ctrlKey` (GOTCHAS "DOM"); a browser sets it on a pinch.
    Object.defineProperty(pinch, "ctrlKey", { value: true });

    stage.dispatchEvent(pinch);

    expect(tilespace.current).toBe(0);
  });
});

describe("destroy", () => {
  it("removes the wheel listener and its timer", () => {
    vi.useFakeTimers();
    const { stage, tilespace } = mount();
    wheel(stage, 40);
    tilespace.destroy();
    // The gesture's quiet-gap timer goes with the listener.
    expect(vi.getTimerCount()).toBe(0);

    vi.advanceTimersByTime(300);
    const event = wheel(stage, 40);

    expect(tilespace.current).toBe(1);
    expect(event.defaultPrevented).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });
});
