/**
 * Card effects (T3.19): the user's own motion for the cards of the Space that comes in, started on
 * `change`. The library slides the Space; these animate the card inside each Tile (DEC-06: never
 * the Tile's own `translate` or `opacity`), from the side the move's `direction` says. Copy one.
 * They read the cards' places from what the library wrote on their Tiles (`grid-column-start`,
 * `grid-row-start`, `data-ts-span`), so a move forces no layout. Each card starts hidden: skip
 * them when the new cards were already on screen (with `peek`, or after a Drag). A resize that
 * changes the Current space fires `change` too, and plays them.
 */
import type { Axis } from "../packages/vanilla/src/index.ts";

/** Animates the cards of the new Space; `direction` 1 when they come from the right (or below). */
export type CardEffect = (cards: HTMLElement[], direction: 1 | -1, axis: Axis) => void;

const EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** The cards start while the Space's 500 ms slide is ending. */
const START = 250;
const STEP = 60;

/** A card's place in its Space, in Cells: its Tile's first column and row, and its middle. */
const place = (card: HTMLElement) => {
  const tile = card.parentElement as HTMLElement;
  const [cols, rows] = (tile.dataset.tsSpan ?? "1x1").split("x").map(Number);
  const [col, row] = [Number(tile.style.gridColumnStart), Number(tile.style.gridRowStart)];
  return { col, row, x: col + (cols ?? 1) / 2, y: row + (rows ?? 1) / 2 };
};

/** The cards in the order the eye reads them along the axis; backwards, the other end first. */
const inOrder = (cards: HTMLElement[], direction: 1 | -1, axis: Axis) => {
  const keyed = cards.map((card) => ({ card, at: place(card) }));
  const [main, cross] =
    axis === "horizontal" ? (["col", "row"] as const) : (["row", "col"] as const);
  keyed.sort((a, b) => a.at[main] - b.at[main] || a.at[cross] - b.at[cross]);
  const sorted = keyed.map(({ card }) => card);
  return direction === 1 ? sorted : sorted.reverse();
};

const shift = (axis: Axis, px: number) =>
  axis === "horizontal" ? `translateX(${px}px)` : `translateY(${px}px)`;

export const cardEffects: Record<string, CardEffect> = {
  /** Each card slides in from the move's side, one after another. */
  cascade(cards, direction, axis) {
    for (const [i, card] of inOrder(cards, direction, axis).entries()) {
      card.animate(
        [
          { transform: shift(axis, direction * 40), opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 450, delay: START + i * STEP, easing: EASING, fill: "backwards" },
      );
    }
  },
  /** Each card turns in on its hinge, like a page, from the move's side, its free edge behind. */
  "3d"(cards, direction, axis) {
    const horizontal = axis === "horizontal";
    // Hinged on the edge it turns in from: the right one when it comes from the right.
    const hinge = horizontal
      ? direction === 1
        ? "right"
        : "left"
      : direction === 1
        ? "bottom"
        : "top";
    // rotateX turns the other way round from rotateY: the free edge starts behind on both axes.
    const turn = horizontal ? "rotateY" : "rotateX";
    const from = `${turn}(${horizontal ? -direction * 70 : direction * 70}deg)`;
    for (const [i, card] of inOrder(cards, direction, axis).entries()) {
      card.animate(
        [
          { transform: `perspective(800px) ${from}`, transformOrigin: hinge, opacity: 0 },
          { transform: `perspective(800px) ${turn}(0deg)`, transformOrigin: hinge, opacity: 1 },
        ],
        { duration: 600, delay: START + i * STEP, easing: EASING, fill: "backwards" },
      );
    }
  },
  /** Each card grows in from the middle of the Space outwards, wherever the move came from. */
  pop(cards) {
    const places = cards.map(place);
    const xs = places.map((p) => p.x);
    const ys = places.map((p) => p.y);
    const [cx, cy] = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
    const away = places.map((p) => Math.hypot(p.x - cx, p.y - cy));
    const far = Math.max(1, ...away);
    for (const [i, card] of cards.entries()) {
      card.animate(
        [
          { transform: "scale(0.6)", opacity: 0 },
          { transform: "none", opacity: 1 },
        ],
        {
          duration: 400,
          delay: START + ((away[i] ?? 0) / far) * 300,
          easing: "cubic-bezier(0.3, 1.4, 0.5, 1)",
          fill: "backwards",
        },
      );
    }
  },
};
