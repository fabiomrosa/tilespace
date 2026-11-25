/** Each card shows its Tile's Span, which the library chooses and writes (`data-ts-span`). */
export function labelSpans(stage: HTMLElement): void {
  for (const tile of stage.children as HTMLCollectionOf<HTMLElement>) {
    const card = tile.firstElementChild as HTMLElement | null;
    if (card) card.dataset.span = tile.dataset.tsSpan ?? "";
  }
}
