import { mountHero } from "./demos/hero.ts";
import { mountPlayground } from "./demos/playground.ts";
import { setUpMenu } from "./menu.ts";
import { setUpTheme } from "./theme.ts";

const byId = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

setUpTheme(byId<HTMLButtonElement>("theme-toggle"));
setUpMenu(byId<HTMLButtonElement>("menu-button"), byId("main-nav"));

// The install line, copied as the page shows it; the button and a status say so for a moment.
const copy = document.getElementById("copy") as HTMLButtonElement | null;
if (copy) setUpCopy(copy, byId("copied"));

function setUpCopy(copy: HTMLButtonElement, copied: HTMLElement) {
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
}

// Each page mounts what it has: the home its wall, the playground page its playground.
const wall = document.getElementById("wall");
if (wall) {
  mountHero(wall, byId("wall-prev"), byId("wall-next"), byId("wall-count"), byId("wall-pager"));
}
const playground = document.getElementById("playground");
if (playground) mountPlayground(playground);
