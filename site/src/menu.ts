/** The phone's menu button: it opens the header's links as a sheet, and Escape closes it. */
export function setUpMenu(button: HTMLButtonElement, nav: HTMLElement): void {
  const open = (value: boolean) => {
    button.setAttribute("aria-expanded", String(value));
    nav.classList.toggle("open", value);
  };
  button.addEventListener("click", () => open(button.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (event) => {
    if ((event.target as Element).closest("a")) {
      open(false);
      // After the jump to the link's section, which takes the focus along: no scroll back up.
      setTimeout(() => button.focus({ preventScroll: true }));
    }
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
      open(false);
      button.focus();
    }
  });
}
