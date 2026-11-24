/** The viewer's saved theme; the system's when none (HANDOFF "Stack": `theme.ts`). */
const KEY = "tilespace-theme";
type Theme = "light" | "dark";

const saved = (): Theme | null => {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    // Storage can be blocked (a private window, cleared site data): the system's theme then.
    return null;
  }
};

const shown = (): Theme =>
  (document.documentElement.dataset.theme as Theme | undefined) ??
  (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

/** Applies the saved theme and wires the toggle, whose name says what it switches to. */
export function setUpTheme(toggle: HTMLButtonElement): void {
  const root = document.documentElement;
  const label = () => {
    toggle.setAttribute("aria-label", `Switch to ${shown() === "dark" ? "light" : "dark"} mode`);
  };
  const theme = saved();
  if (theme) root.dataset.theme = theme;
  label();
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", label);
  toggle.addEventListener("click", () => {
    const next: Theme = shown() === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // Not saved: the choice holds for this visit only.
    }
    label();
  });
}
