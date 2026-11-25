import { mountHero } from "./demos/hero.ts";
import { mountPlayground } from "./demos/playground.ts";
import { setUpMenu } from "./menu.ts";
import { setUpTheme } from "./theme.ts";

const byId = <T extends HTMLElement | null>(id: string) => document.getElementById(id) as T;

setUpTheme(byId<HTMLButtonElement>("theme-toggle"));
setUpMenu(byId<HTMLButtonElement>("menu-button"), byId("main-nav"));

// The install line, copied as the page shows it; the button and a status say so for a moment.
// Only the home has the install line, the wall and no playground; main.ts mounts what is there.
const copy = byId<HTMLButtonElement | null>("copy");
const copied = byId<HTMLElement>("copied");
let reset: ReturnType<typeof setTimeout> | undefined;
copy?.addEventListener("click", async () => {
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

if (byId<HTMLElement | null>("wall")) {
  mountHero(
    byId("wall"),
    byId("wall-prev"),
    byId("wall-next"),
    byId("wall-count"),
    byId("wall-pager"),
  );
}
if (byId<HTMLElement | null>("playground")) mountPlayground(byId("playground"));
