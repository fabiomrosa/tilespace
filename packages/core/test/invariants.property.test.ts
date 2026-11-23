import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { type Grid, type Order, type Packing, pack, type Shape } from "../src/index.ts";
import { fewestHoles } from "./exhaustive.ts";

// Enough runs that every property reaches its interesting cases (CONVENTIONS §5).
fc.configureGlobal({ numRuns: 500 });

// Small Grids keep the exhaustive search fast; Spans up to 3 on Grids from 2 get clamped, and Shapes
// of up to 4 Spans often list a small Span before a larger one (the case a wrong bound cuts).
const gridArb = fc.record({
  columns: fc.integer({ min: 2, max: 4 }),
  rows: fc.integer({ min: 2, max: 4 }),
});
const spanArb = fc.record({
  cols: fc.integer({ min: 1, max: 3 }),
  rows: fc.integer({ min: 1, max: 3 }),
});
const shapesArb = fc.array(fc.array(spanArb, { minLength: 1, maxLength: 4 }), { maxLength: 8 });
const orderArb = fc.constantFrom<Order>("fill", "strict");

const clamp = (shapes: readonly Shape[], grid: Grid): Shape[] =>
  shapes.map((shape) =>
    shape.map((s) => ({ cols: Math.min(s.cols, grid.columns), rows: Math.min(s.rows, grid.rows) })),
  );

const holes = (packing: Packing, grid: Grid): number[] =>
  packing.spaces.map(
    (space) =>
      grid.columns * grid.rows - space.reduce((area, p) => area + p.span.cols * p.span.rows, 0),
  );

describe("pack invariants", () => {
  it("never overlaps two Tiles and keeps every Tile inside the Grid", () => {
    let shared = 0;
    fc.assert(
      fc.property(shapesArb, gridArb, orderArb, (shapes, grid, order) => {
        for (const space of pack(shapes, grid, { order }).spaces) {
          const cells = new Set<number>();
          for (const p of space) {
            expect(p.col + p.span.cols).toBeLessThanOrEqual(grid.columns);
            expect(p.row + p.span.rows).toBeLessThanOrEqual(grid.rows);
            for (let r = 0; r < p.span.rows; r++) {
              for (let c = 0; c < p.span.cols; c++) {
                const cell = (p.row + r) * grid.columns + p.col + c;
                expect(cells.has(cell)).toBe(false);
                cells.add(cell);
              }
            }
          }
          if (space.length >= 2) shared++;
        }
      }),
    );
    expect(shared).toBeGreaterThanOrEqual(100);
  });

  it("places every Tile exactly once with a Span of its clamped Shape", () => {
    let clamped = 0;
    let laterSpan = 0;
    fc.assert(
      fc.property(shapesArb, gridArb, orderArb, (shapes, grid, order) => {
        const fitted = clamp(shapes, grid);
        const placements = pack(shapes, grid, { order }).spaces.flat();
        expect(placements.map((p) => p.tile).toSorted((a, b) => a - b)).toEqual(
          shapes.map((_, i) => i),
        );
        for (const p of placements) {
          const shape = fitted[p.tile] ?? [];
          const rank = shape.findIndex((s) => s.cols === p.span.cols && s.rows === p.span.rows);
          expect(rank).toBeGreaterThanOrEqual(0);
          if (rank > 0) laterSpan++;
          const asked = shapes[p.tile]?.[rank];
          if (asked && (asked.cols !== p.span.cols || asked.rows !== p.span.rows)) clamped++;
        }
      }),
    );
    expect(clamped).toBeGreaterThanOrEqual(100);
    expect(laterSpan).toBeGreaterThanOrEqual(200);
  });

  it("leaves no Space with more Holes than an exhaustive search with the Tiles left", () => {
    // PRODUCT asks it of every Space but the last; the last is packed by the same search (T1.4).
    // Catches the T1.3 bound that took each Tile's smallest Span: put back, it fails every run.
    let comparedWithHoles = 0;
    fc.assert(
      fc.property(shapesArb, gridArb, (shapes, grid) => {
        // A budget high enough to be exact (PRODUCT), whatever default T1.9 chooses.
        const packing = pack(shapes, grid, { nodeBudget: Number.MAX_SAFE_INTEGER });
        const fitted = clamp(shapes, grid);
        const spaceHoles = holes(packing, grid);
        let placed = new Set<number>();
        packing.spaces.forEach((space, k) => {
          const left = fitted.filter((_, tile) => !placed.has(tile));
          const best = fewestHoles(left, grid);
          expect(spaceHoles[k]).toBe(best);
          if (best > 0) comparedWithHoles++;
          placed = new Set([...placed, ...space.map((p) => p.tile)]);
        });
      }),
    );
    expect(comparedWithHoles).toBeGreaterThanOrEqual(100);
  });

  it("keeps the Stage's order in strict mode", () => {
    let severalSpaces = 0;
    fc.assert(
      fc.property(shapesArb, gridArb, (shapes, grid) => {
        const packing = pack(shapes, grid, { order: "strict" });
        expect(packing.spaces.flat().map((p) => p.tile)).toEqual(shapes.map((_, i) => i));
        if (packing.spaces.length >= 2) severalSpaces++;
      }),
    );
    expect(severalSpaces).toBeGreaterThanOrEqual(100);
  });

  it("gives the same Packing when given the same input", () => {
    let severalSpaces = 0;
    fc.assert(
      fc.property(shapesArb, gridArb, orderArb, (shapes, grid, order) => {
        const packing = pack(shapes, grid, { order });
        expect(pack(structuredClone(shapes), { ...grid }, { order })).toEqual(packing);
        if (packing.spaces.length >= 2) severalSpaces++;
      }),
    );
    expect(severalSpaces).toBeGreaterThanOrEqual(100);
  });
});
