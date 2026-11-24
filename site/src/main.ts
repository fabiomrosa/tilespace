import { setUpMenu } from "./menu.ts";
import { setUpTheme } from "./theme.ts";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

setUpTheme(byId<HTMLButtonElement>("theme-toggle"));
setUpMenu(byId<HTMLButtonElement>("menu-button"), byId("main-nav"));

// The install line, copied as the page shows it; the button says so for a moment.
const copy = byId<HTMLButtonElement>("copy");
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("npm install @tilespace/vanilla");
    copy.textContent = "Copied";
    setTimeout(() => {
      copy.textContent = "Copy";
    }, 2000);
  } catch {
    // No clipboard (an insecure page, a denied permission): the line stays there to select.
  }
});
