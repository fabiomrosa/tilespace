// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { createTilespace, type TilespaceOptions } from "../src/index.ts";

/** Two 1x1 Tiles on a 1x1 Grid, with the Stage's own attributes. */
const mount = (
  attributes: Record<string, string> = {},
  options: Partial<TilespaceOptions> = {},
) => {
  const stage = document.createElement("div");
  for (const [name, value] of Object.entries(attributes)) stage.setAttribute(name, value);
  for (let i = 0; i < 2; i++) stage.append(document.createElement("div"));
  const before = stage.outerHTML;
  const tilespace = createTilespace(stage, { columns: 1, rows: 1, ...options });
  return { stage, before, tilespace };
};

const aria = (stage: HTMLElement) =>
  ["role", "aria-roledescription", "aria-label"].map((name) => stage.getAttribute(name));

describe("the Stage's ARIA", () => {
  it("makes the Stage a carousel region labelled Tiles by default (DEC-14), and nothing else", () => {
    const { stage } = mount();

    expect(aria(stage)).toEqual(["region", "carousel", "Tiles"]);
    // No live region, nothing else: the page announces the Current space (DEC-14).
    expect(stage.getAttributeNames().sort()).toEqual([
      "aria-label",
      "aria-roledescription",
      "role",
      "style",
    ]);
  });

  it("names a Stage whose own aria-label is empty, so the region has a name", () => {
    const { stage, before, tilespace } = mount({ "aria-label": " " });
    expect(stage.getAttribute("aria-label")).toBe("Tiles");

    tilespace.destroy();
    expect(stage.outerHTML).toBe(before);
  });

  it("labels it with the label option", () => {
    const { stage } = mount({}, { label: "Photos" });

    expect(stage.getAttribute("aria-label")).toBe("Photos");
  });

  it("keeps each attribute the user set, one by one", () => {
    const { stage } = mount({ role: "group", "aria-label": "Mine" }, { label: "Photos" });

    expect(aria(stage)).toEqual(["group", "carousel", "Mine"]);
  });

  it("keeps a label the user gave by aria-labelledby", () => {
    const { stage } = mount({ "aria-labelledby": "heading" });

    expect(stage.hasAttribute("aria-label")).toBe(false);
  });

  it("puts the Stage's attributes back on destroy", () => {
    for (const attributes of [{}, { role: "group" }]) {
      const { stage, before, tilespace } = mount(attributes);

      tilespace.destroy();

      expect(stage.outerHTML).toBe(before);
    }
  });
});
