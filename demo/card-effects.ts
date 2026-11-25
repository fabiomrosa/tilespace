/**
 * Card effects (T3.19): the user's own motion for the cards of the Space that comes in, started on
 * `change`. The library slides the Space; these animate the card inside each Tile (DEC-06: never
 * the Tile's own `translate` or `opacity`), from the side the move's `direction` says. Copy one.
 */
import type { Axis } from "../packages/vanilla/src/index.ts";

/** Animates the cards of the new Space; `direction` 1 when they come from the right (or below). */
export type CardEffect = (cards: HTMLElement[], direction: 1 | -1, axis: Axis) => void;

const EASING = "cubic-bezier(0.2, 0, 0, 1)";
/** The cards start while the Space's 500 ms slide is ending. */
const START = 250;
const STEP = 60;

/** The cards in the order the eye reads them along the axis; backwards, the other end first. */
const inOrder = (cards: HTMLElement[], direction: 1 | -1, axis: Axis) => {
  const at = cards.map((card) => ({ card, box: card.getBoundingClientRect() }));
  const [main, cross] =
    axis === "horizontal" ? (["left", "top"] as const) : (["top", "left"] as const);
  at.sort((a, b) => a.box[main] - b.box[main] || a.box[cross] - b.box[cross]);
  const sorted = at.map(({ card }) => card);
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
  /** Each card turns in on its hinge, like a page, from the move's side. */
  "3d"(cards, direction, axis) {
    const turn = axis === "horizontal" ? "rotateY" : "rotateX";
    // Hinged on the edge it turns in from: the right one when it comes from the right.
    const hinge =
      axis === "horizontal"
        ? direction === 1
          ? "right"
          : "left"
        : direction === 1
          ? "bottom"
          : "top";
    for (const [i, card] of inOrder(cards, direction, axis).entries()) {
      card.animate(
        [
          {
            transform: `perspective(800px) ${turn}(${-direction * 70}deg)`,
            transformOrigin: hinge,
            opacity: 0,
          },
          { transform: `perspective(800px) ${turn}(0deg)`, transformOrigin: hinge, opacity: 1 },
        ],
        { duration: 600, delay: START + i * STEP, easing: EASING, fill: "backwards" },
      );
    }
  },
  /** Each card grows in from the middle of the Stage outwards, wherever the move came from. */
  pop(cards) {
    const boxes = cards.map((card) => card.getBoundingClientRect());
    const middle = (b: DOMRect) => [b.left + b.width / 2, b.top + b.height / 2] as const;
    const xs = boxes.map((b) => middle(b)[0]);
    const ys = boxes.map((b) => middle(b)[1]);
    const centre = [
      (Math.min(...xs) + Math.max(...xs)) / 2,
      (Math.min(...ys) + Math.max(...ys)) / 2,
    ];
    const away = boxes.map((b) =>
      Math.hypot(middle(b)[0] - (centre[0] ?? 0), middle(b)[1] - (centre[1] ?? 0)),
    );
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
