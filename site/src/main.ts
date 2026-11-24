import { setUpMenu } from "./menu.ts";
import { setUpTheme } from "./theme.ts";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

setUpTheme(byId<HTMLButtonElement>("theme-toggle"));
setUpMenu(byId<HTMLButtonElement>("menu-button"), byId("main-nav"));

// The install line, copied as the page shows it; the button and a status say so for a moment.
const copy = byId<HTMLButtonElement>("copy");
const copied = byId("copied");
let reset: ReturnType<typeof setTimeout> | undefined;
copy.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText("npm install @tilespace/vanilla");
    copy.textContent = copied.textContent = "Copied";
    clearTimeout(reset);
    reset = setTimeout(() => {
      copy.textContent = "Copy";
      copied.textContent = "";
    }, 2000);
  } catch {
    // No clipboard (an insecure page, a denied permission): select the line to copy by hand.
    getSelection()?.selectAllChildren(copy.previousElementSibling as Element);
  }
});
