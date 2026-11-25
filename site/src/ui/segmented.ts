/**
 * A segmented control: a group of buttons, the pressed one is the value (`aria-pressed`). Calls
 * `changed` with the new value when another one is pressed.
 */
export function segmented(group: HTMLElement, changed: (value: string) => void) {
  const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button"));
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      for (const other of buttons) other.setAttribute("aria-pressed", String(other === button));
      changed(button.dataset.value as string);
    });
  }
}
