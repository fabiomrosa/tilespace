/** The phone's menu button: it opens the header's links as a sheet, and Escape closes it. */
export function setUpMenu(button: HTMLButtonElement, nav: HTMLElement): void {
  const open = (value: boolean) => {
    button.setAttribute("aria-expanded", String(value));
    nav.classList.toggle("open", value);
  };
  button.addEventListener("click", () => open(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    // A link jumps to its section, and the next Tab goes on from there: the focus stays with it.
    if ((event.target as Element).closest("a")) open(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      open(false);
      button.focus();
    }
  });
}
