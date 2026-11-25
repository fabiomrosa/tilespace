/**
 * The hero's cards cascade (T3.21): the site's own motion on `change`, as a user would write it
 * (DEC-10). The library slides the Space; each card, inside its Tile, falls a little behind during
 * the slide and settles in its turn, column by column from the side the move came. The wall peeks,
 * so the new cards are in view already: they never fade, and fall behind by at most the space gap,
 * never over the Space beside them. Their places come from what the library wrote on their Tiles.
 */

/** The library's default slide, which the cards fall behind during. */
const SLIDE = 500;
const SETTLE = 450;
const STEP = 60;
const EASING = "cubic-bezier(0.2, 0, 0, 1)";

/** Each card of the new Space falls `behind` px back from `direction`'s side, then settles. */
export function cascade(cards: HTMLElement[], direction: 1 | -1, behind: number) {
  const place = (card: HTMLElement) => {
    const tile = card.parentElement as HTMLElement;
    return [Number(tile.style.gridColumnStart), Number(tile.style.gridRowStart)] as const;
  };
  // Column by column, top to bottom; going back, the other end first.
  const order = cards
    .map((card) => ({ card, at: place(card) }))
    .sort((a, b) => a.at[0] - b.at[0] || a.at[1] - b.at[1])
    .map(({ card }) => card);
  if (direction === -1) order.reverse();
  const landed = { transform: `translateX(${direction * behind}px)` };
  for (const [i, card] of order.entries()) {
    const start = SLIDE + i * STEP;
    const total = start + SETTLE;
    card.animate(
      [
        { offset: 0, transform: "none", easing: EASING },
        { offset: SLIDE / total, ...landed },
        { offset: start / total, ...landed, easing: EASING },
        { offset: 1, transform: "none" },
      ],
      total,
    );
  }
}
