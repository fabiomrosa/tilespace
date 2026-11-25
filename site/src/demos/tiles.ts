/**
 * The playground's examples (HANDOFF "Playground tabs"), built with DOM APIs: user text goes in as
 * `textContent`. Each Tile holds a `.card`, which is the site's to style and move (DEC-06). The
 * Gallery and the Dashboard come with the tabs (T3.22).
 */

const el = <T extends HTMLElement = HTMLElement>(
  tag: string,
  props: Partial<T> = {},
  ...children: (Node | string)[]
): T => {
  const node = Object.assign(document.createElement(tag), props) as T;
  node.append(...children);
  return node;
};

/** A Tile of the given Shape, holding its card. */
const tile = (shape: string, ...children: (Node | string)[]) => {
  const node = el("div", {}, el("div", { className: "card" }, ...children));
  node.dataset.tsShape = shape;
  return node;
};

const SHAPES = ["2x2", "1x1", "2x1", "1x2", "3x2 2x2", "1x1", "2x1 1x1", "1x1", "2x2 1x1", "1x2"];

/** Mixed Shapes in the seven tile colours, each labelled with its place in the HTML. */
export const showcase = () =>
  Array.from({ length: 20 }, (_, i) =>
    tile(SHAPES[i % SHAPES.length] as string, el("b", { textContent: String(i + 1) })),
  );
