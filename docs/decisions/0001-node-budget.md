# 0001 · The default Node budget is 100,000 steps per Space

- **Status:** Accepted (T1.9, 2026-11-23), by the rule of the T1.9 entry in `docs/PLAN.md`.

## Context
The Packer stops each Space after a Node budget (DEC-08) and keeps the best filling found. The
default had to be the largest value whose median time per Space fits a frame budget of 4 ms on
the largest Grid benchmarked, so that a repack on resize stays inside a frame. The same run answers
the lab's first question: does the search fill the Spaces better than first-fit?

## Method
- `npm run bench` (`bench/pack.bench.ts`), run with Node 26.13.1 on an Apple M4 Pro (the
  owner's development laptop, otherwise idle).
- Two mixes of Shapes, seeded (mulberry32, seeds 1 to 10): **with 1x1** (`1x1`, `2x1`, `1x2`,
  `2x2`, `2x2 1x1`, `3x1 2x1`, `2x3 2x2`) and **no 1x1** (`2x1`, `1x2`, `2x2`, `3x2`,
  `3x1 2x1`, `2x3 2x2`). Each fixture has Tiles enough to cover about three Spaces.
- Grids 4x3, 6x4 and 12x8. Sides: first-fit (`bench/first-fit.ts`, the 2017 greedy without its
  bugs, Space by Space) and `pack` (`order: 'fill'`) at budgets from 100 to 1,000,000.
- Fixtures are built before any timing; each side runs on five fixtures as a warm-up; the order of
  the sides alternates per seed. Time is the median over the seeds of one packing's time divided by
  its Spaces. Holes are averaged over every Space but the last (the last holds what remains).
- Two runs gave the same Holes in every row. On 12x8 the times moved by under 10%; on 4x3 and 6x4
  they are a few microseconds, at the timer's resolution, so only the 12x8 times are meaningful.

## Results
| Mix | Grid | Packer | Median ms per Space | Holes per Space but the last |
|---|---|---|---|---|
| Mix | Grid | Packer | Median ms per Space | Holes per Space but the last |
| with 1x1 | 4x3 | first-fit | 0.001 | 0.29 |
| with 1x1 | 4x3 | search, budget 100 | 0.005 | 0.05 |
| with 1x1 | 4x3 | search, budget 1,000 | 0.005 | 0.05 |
| with 1x1 | 4x3 | search, budget 10,000 | 0.004 | 0.05 |
| with 1x1 | 4x3 | search, budget 100,000 | 0.004 | 0.05 |
| with 1x1 | 4x3 | search, budget 200,000 | 0.005 | 0.05 |
| with 1x1 | 4x3 | search, budget 500,000 | 0.004 | 0.05 |
| with 1x1 | 4x3 | search, budget 1,000,000 | 0.004 | 0.05 |
| with 1x1 | 6x4 | first-fit | 0.002 | 1.00 |
| with 1x1 | 6x4 | search, budget 100 | 0.008 | 0.05 |
| with 1x1 | 6x4 | search, budget 1,000 | 0.018 | 0.00 |
| with 1x1 | 6x4 | search, budget 10,000 | 0.049 | 0.19 |
| with 1x1 | 6x4 | search, budget 100,000 | 0.056 | 0.19 |
| with 1x1 | 6x4 | search, budget 200,000 | 0.054 | 0.19 |
| with 1x1 | 6x4 | search, budget 500,000 | 0.054 | 0.19 |
| with 1x1 | 6x4 | search, budget 1,000,000 | 0.057 | 0.19 |
| with 1x1 | 12x8 | first-fit | 0.011 | 0.00 |
| with 1x1 | 12x8 | search, budget 100 | 0.036 | 0.00 |
| with 1x1 | 12x8 | search, budget 1,000 | 0.048 | 0.00 |
| with 1x1 | 12x8 | search, budget 10,000 | 0.220 | 0.00 |
| with 1x1 | 12x8 | search, budget 100,000 | 1.830 | 0.00 |
| with 1x1 | 12x8 | search, budget 200,000 | 3.408 | 0.00 |
| with 1x1 | 12x8 | search, budget 500,000 | 8.259 | 0.00 |
| with 1x1 | 12x8 | search, budget 1,000,000 | 16.932 | 0.00 |
| no 1x1 | 4x3 | first-fit | 0.000 | 2.43 |
| no 1x1 | 4x3 | search, budget 100 | 0.002 | 2.21 |
| no 1x1 | 4x3 | search, budget 1,000 | 0.002 | 2.21 |
| no 1x1 | 4x3 | search, budget 10,000 | 0.002 | 2.21 |
| no 1x1 | 4x3 | search, budget 100,000 | 0.003 | 2.21 |
| no 1x1 | 4x3 | search, budget 200,000 | 0.003 | 2.21 |
| no 1x1 | 4x3 | search, budget 500,000 | 0.003 | 2.21 |
| no 1x1 | 4x3 | search, budget 1,000,000 | 0.003 | 2.21 |
| no 1x1 | 6x4 | first-fit | 0.001 | 1.78 |
| no 1x1 | 6x4 | search, budget 100 | 0.007 | 0.63 |
| no 1x1 | 6x4 | search, budget 1,000 | 0.014 | 0.09 |
| no 1x1 | 6x4 | search, budget 10,000 | 0.013 | 0.09 |
| no 1x1 | 6x4 | search, budget 100,000 | 0.014 | 0.09 |
| no 1x1 | 6x4 | search, budget 200,000 | 0.016 | 0.09 |
| no 1x1 | 6x4 | search, budget 500,000 | 0.015 | 0.09 |
| no 1x1 | 6x4 | search, budget 1,000,000 | 0.019 | 0.09 |
| no 1x1 | 12x8 | first-fit | 0.007 | 4.90 |
| no 1x1 | 12x8 | search, budget 100 | 0.028 | 2.35 |
| no 1x1 | 12x8 | search, budget 1,000 | 0.063 | 1.71 |
| no 1x1 | 12x8 | search, budget 10,000 | 0.340 | 1.17 |
| no 1x1 | 12x8 | search, budget 100,000 | 2.631 | 0.50 |
| no 1x1 | 12x8 | search, budget 200,000 | 4.811 | 0.29 |
| no 1x1 | 12x8 | search, budget 500,000 | 11.487 | 0.29 |
| no 1x1 | 12x8 | search, budget 1,000,000 | 22.654 | 0.29 |

## Decision
The default `nodeBudget` is **100,000**, the largest benchmarked budget whose 12x8 median fits 4 ms
on both mixes: 1.8 ms per Space with 1x1 Tiles and 2.6 ms without. 200,000 takes 4.8 ms without 1x1
Tiles (3.4 ms with them), so the exact limit lies between the two; a finer search would gain little.

## Consequences
- On the hard mix the search leaves 0.50 Holes per Space on 12x8 against first-fit's 4.90, and 0.09
  against 1.78 on 6x4; with 1x1 Tiles both sides fill large Grids, and the search still wins on
  small ones (0.05 against 0.29 on 4x3). On 12x8 at the default the search costs about 170 times
  first-fit's time with 1x1 Tiles and about 380 times without, still inside a frame.
- A larger budget can leave **more** Holes in later Spaces (with 1x1, 6x4: 0.00 at 1,000 against
  0.19 from 10,000 up): a perfect early Space may leave harder Tiles for the next ones. This is the
  Space-by-Space priority of DEC-08 working as decided, worth a line in the lab's write-up (M3).
- Times are for this machine; the engine measures its own frame cost in M2. A user who needs exact
  Packings on large Grids passes a larger `nodeBudget`.
