/** The phone's menu button: it opens the header's links as a sheet, and Escape closes it. */
export function setUpMenu(button: HTMLButtonElement, nav: HTMLElement): void {
  const open = (value: boolean) => {
    button.setAttribute("aria-expanded", String(value));
    nav.classList.toggle("open", value);
  };
  button.addEventListener("click", () => open(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) open(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      open(false);
      button.focus();
    }
  });
}
