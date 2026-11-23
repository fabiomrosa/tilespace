/**
 * The playground (T1.10): type a Grid and Shapes, see every Space of the Packing drawn as a CSS
 * grid, each Tile labelled with its index and Span, and each Space's Holes and Score. Built with DOM
 * APIs only; user values reach the page as `textContent`.
 */
import {
  type Grid,
  type Order,
  type Packing,
  pack,
  type Shape,
} from "../packages/core/src/index.ts";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const columns = byId<HTMLInputElement>("columns");
const rows = byId<HTMLInputElement>("rows");
const shapesInput = byId<HTMLInputElement>("shapes");
const order = byId<HTMLSelectElement>("order");
const budget = byId<HTMLInputElement>("budget");
const seed = byId<HTMLInputElement>("seed");
const error = byId<HTMLParagraphElement>("error");
const spaces = byId<HTMLDivElement>("spaces");
const CELL = 48;

/** `"2x2 1x1, 1x2"` → Shapes. A malformed Span becomes NaN, which `pack` rejects with its message. */
function parse(text: string): Shape[] {
  if (text.trim() === "") return [];
  return text.split(",").map((tile) =>
    tile
      .trim()
      .split(/\s+/)
      .filter((span) => span !== "")
      .map((span) => {
        const match = /^(\d+)x(\d+)$/.exec(span);
        return {
          cols: match ? Number(match[1]) : Number.NaN,
          rows: match ? Number(match[2]) : Number.NaN,
        };
      }),
  );
}

/** The default Score's terms for one Space, as `pack` ranks it; Displacement counts across Spaces. */
function score(space: Packing["spaces"][number], shapes: Shape[], grid: Grid, before: number) {
  const covered = space.reduce((area, p) => area + p.span.cols * p.span.rows, 0);
  const rank = space.reduce((sum, p) => {
    const shape = shapes[p.tile] ?? [];
    return (
      sum +
      shape.findIndex(
        (s) =>
          Math.min(s.cols, grid.columns) === p.span.cols &&
          Math.min(s.rows, grid.rows) === p.span.rows,
      )
    );
  }, 0);
  const displacement = space.reduce((sum, p, i) => sum + Math.abs(before + i - p.tile), 0);
  return { holes: grid.columns * grid.rows - covered, rank, displacement };
}

function draw(): void {
  const grid: Grid = { columns: Number(columns.value), rows: Number(rows.value) };
  const shapes = parse(shapesInput.value);
  let packing: Packing;
  try {
    packing = pack(shapes, grid, { order: order.value as Order, nodeBudget: Number(budget.value) });
  } catch (e) {
    error.textContent = e instanceof Error ? e.message : String(e);
    spaces.replaceChildren();
    return;
  }
  error.textContent = "";
  let before = 0;
  spaces.replaceChildren(
    ...packing.spaces.map((space, s) => {
      const { holes, rank, displacement } = score(space, shapes, grid, before);
      before += space.length;
      const section = document.createElement("section");
      section.className = "space";
      const title = document.createElement("h2");
      title.textContent = `Space ${s}: ${space.length} Tiles, ${holes} Holes, Score [${holes}, ${rank}, ${displacement}]`;
      const cells = document.createElement("div");
      cells.className = "grid";
      cells.style.gridTemplateColumns = `repeat(${grid.columns}, ${CELL}px)`;
      cells.style.gridTemplateRows = `repeat(${grid.rows}, ${CELL}px)`;
      for (const p of space) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.style.gridColumn = `${p.col + 1} / span ${p.span.cols}`;
        tile.style.gridRow = `${p.row + 1} / span ${p.span.rows}`;
        tile.style.setProperty("--hue", String((p.tile * 47) % 360));
        tile.textContent = `${p.tile} · ${p.span.cols}x${p.span.rows}`;
        cells.append(tile);
      }
      section.append(title, cells);
      return section;
    }),
  );
}

/** A seeded random set of Tiles for the current Grid (mulberry32), about three Spaces' worth. */
function randomTiles(): void {
  let a = Number(seed.value) >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const kinds = ["1x1", "2x1", "1x2", "2x2", "2x2 1x1", "3x1 2x1", "2x3 2x2", "3x2"];
  const tiles: string[] = [];
  let area = 0;
  while (area < 3 * Number(columns.value) * Number(rows.value) && tiles.length < 200) {
    const kind = kinds[Math.floor(next() * kinds.length)] ?? "1x1";
    tiles.push(kind);
    const [c, r] = kind.split(" ")[0]?.split("x").map(Number) ?? [1, 1];
    area += (c ?? 1) * (r ?? 1);
  }
  shapesInput.value = tiles.join(", ");
  draw();
}

byId<HTMLFormElement>("controls").addEventListener("input", draw);
byId<HTMLButtonElement>("random").addEventListener("click", randomTiles);
draw();
