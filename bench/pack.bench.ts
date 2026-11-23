/**
 * The lab's benchmark (T1.9): Holes and time per Space of `pack` at several Node budgets against
 * first-fit, over seeded random Tiles. Fixtures are built before any timing; each side is warmed up;
 * the side that runs first alternates per seed; times are medians (CONVENTIONS §5).
 * Run: `npm run bench`.
 */
import { type Grid, pack, type Shape } from "../packages/core/src/index.ts";
import { firstFit } from "./first-fit.ts";

const GRIDS: Grid[] = [
  { columns: 4, rows: 3 },
  { columns: 6, rows: 4 },
  { columns: 12, rows: 8 },
];
const BUDGETS = [100, 1_000, 10_000, 100_000, 200_000, 500_000, 1_000_000];
const SEEDS = 10;
const SPACES = 3; // Tiles enough to fill about this many Spaces.
const s = (cols: number, rows: number) => ({ cols, rows });
/** Two mixes of Shapes: one with 1x1 Tiles, which fill any gap, and one with none. */
const MIXES: [string, Shape[]][] = [
  [
    "with 1x1",
    [
      [s(1, 1)],
      [s(2, 1)],
      [s(1, 2)],
      [s(2, 2)],
      [s(2, 2), s(1, 1)],
      [s(3, 1), s(2, 1)],
      [s(2, 3), s(2, 2)],
    ],
  ],
  ["no 1x1", [[s(2, 1)], [s(1, 2)], [s(2, 2)], [s(3, 2)], [s(3, 1), s(2, 1)], [s(2, 3), s(2, 2)]]],
];

/** mulberry32: a small seeded generator, so the same seed gives the same Tiles. */
function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function tiles(kinds: Shape[], grid: Grid, seed: number): Shape[] {
  const next = random(seed);
  const shapes: Shape[] = [];
  let area = 0;
  while (area < SPACES * grid.columns * grid.rows) {
    const shape = kinds[Math.floor(next() * kinds.length)] as Shape;
    shapes.push(shape);
    area += (shape[0]?.cols ?? 1) * (shape[0]?.rows ?? 1);
  }
  return shapes;
}

type Run = { ms: number; spaces: number; holes: number };
type Packer = (
  shapes: Shape[],
  grid: Grid,
) => { spaces: { span: { cols: number; rows: number } }[][] };

/** Times one packing; Holes are those of every Space but the last (the last holds what remains). */
function run(packer: Packer, shapes: Shape[], grid: Grid): Run {
  const start = performance.now();
  const packing = packer(shapes, grid);
  const ms = performance.now() - start;
  const cells = grid.columns * grid.rows;
  const holes = packing.spaces
    .slice(0, -1)
    .reduce(
      (sum, space) => sum + cells - space.reduce((a, p) => a + p.span.cols * p.span.rows, 0),
      0,
    );
  return { ms, spaces: packing.spaces.length, holes };
}

const median = (values: number[]) => {
  const sorted = values.toSorted((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? (sorted[mid] as number)
    : ((sorted[mid - 1] as number) + (sorted[mid] as number)) / 2;
};

console.log("| Mix | Grid | Packer | Median ms per Space | Holes per Space but the last |");
console.log("|---|---|---|---|---|");
for (const [mix, kinds] of MIXES)
  for (const grid of GRIDS) {
    const fixtures = Array.from({ length: SEEDS }, (_, seed) => tiles(kinds, grid, seed + 1));
    const sides: [string, Packer][] = [
      ["first-fit", firstFit],
      ...BUDGETS.map((nodeBudget): [string, Packer] => [
        `search, budget ${nodeBudget.toLocaleString("en")}`,
        (shapes, g) => pack(shapes, g, { nodeBudget }),
      ]),
    ];
    const runs = new Map<string, Run[]>(sides.map(([name]) => [name, []]));
    for (const [, packer] of sides) run(packer, fixtures[0] as Shape[], grid); // warm-up
    fixtures.forEach((shapes, seed) => {
      const order = seed % 2 === 0 ? sides : sides.toReversed();
      for (const [name, packer] of order) runs.get(name)?.push(run(packer, shapes, grid));
    });
    for (const [name] of sides) {
      const all = runs.get(name) ?? [];
      const msPerSpace = median(all.map((r) => r.ms / r.spaces));
      const holes =
        all.reduce((sum, r) => sum + r.holes, 0) / all.reduce((sum, r) => sum + r.spaces - 1, 0);
      console.log(
        `| ${mix} | ${grid.columns}x${grid.rows} | ${name} | ${msPerSpace.toFixed(3)} | ${holes.toFixed(2)} |`,
      );
    }
  }
