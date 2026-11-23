import { describe, expect, it } from "vitest";
import { packageName } from "../src/index.ts";

describe("@tilespace/core", () => {
  it("exports the package name when imported", () => {
    expect(packageName).toBe("@tilespace/core");
  });
});
