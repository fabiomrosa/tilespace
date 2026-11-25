# tilespace site — handoff for Claude Code

Nov 24, 2026 · Fábio Rosa

> Screens for every section are in `screens/` (see `README.md`). Living version of this doc: https://claude.ai/artifact/AQrbHQursK3ixA4b2Ccs3x

## Goal and scope

Build the tilespace one-page site as a static Vite + TypeScript page on GitHub Pages, matching the approved layout in the [design canvas](https://claude.ai/artifact/B1cfiALWpYNfzuL4y93wKx). The canvas has three boards: Desktop (1440), Mobile (390) and a Spec board with structure, type, colour and spacing. Where this doc and the canvas disagree, this doc wins.

**In scope:** the six sections (hero, Bring your own tiles, playground, quick start, the lab, footer), light and dark mode, responsive down to 360 px, keyboard and screen-reader support. Every demo runs on the real `@tilespace/vanilla` engine, never a CSS imitation.

**Out of scope:** the lab write-up page itself (link only), React and Angular adapters, analytics, any backend.

**Done when:**

- `npm run build` outputs a static `dist/` that deploys to GitHub Pages under the repo's base path.
- All three live demos (hero, playground, quick-start result) pack and move with buttons, arrow keys, wheel and drag.
- Lighthouse accessibility is 100, and the page works with `prefers-reduced-motion: reduce` and with JavaScript off (static fallback tiles, no broken layout).
- No horizontal page scroll at 360, 768, 1024 and 1440 px, except the intentional bleed inside the hero wall.

## Stack and file structure

Use plain HTML, CSS and TypeScript with Vite. No UI framework and no CSS framework. The only runtime dependency is the workspace's own `@tilespace/vanilla` (and `@tilespace/core` through it). Fonts come from Google Fonts with `display=swap`, or are self-hosted under `public/fonts` if you'd rather avoid the third-party request.

```text
site/
  index.html            # all six sections as static markup
  vite.config.ts        # base: '/tilespace/' (or '/' for a custom domain)
  src/
    main.ts             # boots theme, nav, the three demos
    theme.ts            # light/dark: system default + toggle, saved in localStorage (try/catch)
    demos/
      hero.ts           # full-bleed wall, peek: bleed
      playground.ts     # tabs, control bar, options panel
      quickstart.ts     # the snippet's own result
      tiles.ts          # tile factories: showcase, gallery, dashboard
    ui/
      live-counter.ts   # shared "Space n of N" aria-live text
      segmented.ts      # aria-pressed button groups
    styles/
      tokens.css        # every value from the Design tokens section
      base.css          # reset, type, focus ring
      layout.css        # container, 12-col grid, sections
      components.css    # buttons, segmented, code block, chart, frames
  public/
    gallery/            # photos for the Gallery tab (see Open items)
.github/workflows/pages.yml   # build site/ and deploy to GitHub Pages
```

If the library lives in the same repo, put the site in the workspace as `site/` and import the package by workspace name, so the site always runs the current build. The Quick start code block must be the snippet that `quickstart.ts` actually runs: generate it from one source or check it in CI.

## Design tokens

All of these go into `tokens.css` as custom properties. Dark mode swaps only the UI tokens. The tile colours stay the same in both modes and always carry ink text `#14161B`, which passes 4.5:1 on every one of them.

```css
:root, [data-theme="light"] {
  --bg: #F6F6F3;  --surface: #FFFFFF;  --ink: #14161B;  --muted: #585D69;
  --line: #E1E1DA;  --accent: #2F54EB;  --code-bg: #14161B;
}
[data-theme="dark"] {
  --bg: #0F1115;  --surface: #171A20;  --ink: #ECEEF2;  --muted: #9AA1AE;
  --line: #2A2E37;  --accent: #7C9BFF;  --code-bg: #0A0B0E;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme]) { /* dark values */ } }
:root {
  --tile-coral: #FF8A65;  --tile-blue: #6B8CFF;  --tile-amber: #FFC24B;  --tile-teal: #3FCFBF;
  --tile-violet: #A98BFF; --tile-lime: #A8E05F;  --tile-pink: #FF8CC6;  --tile-ink: #14161B;
  --font-display: "Space Grotesk", system-ui, sans-serif;
  --font-ui: Inter, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-6: 24px; --s-8: 32px;
  --s-12: 48px; --s-14: 56px; --section: 136px;          /* 88px below 640px */
  --r-control: 8px; --r-tile: 14px; --r-frame: 20px; --r-round: 999px;
  --container: 1200px; --gutter: 24px; --page-pad: 24px; /* 16px below 640px */
}
```

| Role | Font · weight | Desktop size / line height | Phone size / line height | Notes |
| --- | --- | --- | --- | --- |
| Display (hero name) | Space Grotesk 700 | 112 / 0.92 | 64 / 0.95 | letter-spacing −0.045em |
| H2 | Space Grotesk 700 | 48 / 1.05 | 34 / 1.1 | −0.025em |
| H3 | Space Grotesk 700 | 22 / 1.3 | 20 / 1.3 | −0.01em |
| Lead | Inter 400 | 24 (hero) · 20 | 18 · 17 | colour `--muted` |
| Body / UI | Inter 400–600 | 16 · 14 | 16 · 14 | line height 1.5 |
| Eyebrow | JetBrains Mono 400 | 13 | 12 | uppercase, +0.04em, `--muted` |
| Code, counter, tile size | JetBrains Mono 400–500 | 14 (code) · 13 | 12 | code line height 1.7 |

Use fluid `clamp()` between the phone and desktop sizes. Breakpoints: below 640 px is phone, 640–1023 px is tablet, 1024 px and up is desktop. The content box is 1200 px with 24 px gutters on a 12-column grid. Touch targets are at least 44 px. Desktop segmented buttons are 32 px tall inside a 36 px group.

## Section spec

Each demo container has a fixed height, because the grid needs a sized box to pack into. The cell height follows from that height.

| # | Section · anchor | Desktop (≥1024) | Phone (<640) | Engine options |
| --- | --- | --- | --- | --- |
| 0 | Header | Logo mark + "tilespace", links Playground · Quick start · The lab · GitHub, theme toggle (40 px icon button) | Logo + 44 px menu button opening a sheet with the same links | — |
| 1 | Hero · `#top` | Left 7 cols: eyebrow, name, tagline. Right 5 cols: install pill with Copy, GitHub (solid) and npm (outline) buttons. Below: full-bleed wall, 10×4 cells, 436 px tall, aligned to the container on the left; the next Space bleeds past the right screen edge. Prev / "Space 1 of 4" / Next under it. | Stacked text, full-width buttons. Wall 4×4, 312 px; a Space is 320 px wide so about 38 px of the next one shows. | `peek: bleed`, space gap 32 (16 on phone), tile gap 12 (8 on phone), wheel + drag + keys on the region |
| 2 | Bring your own tiles | 3 columns, each a 200 px visual card + H3 + 2 lines: Headless (dashed grid with one `<your-card>` tile), Flexible spans (2×2, 2×1, 1×1 shapes + `data-ts-shape` line), Every input (← → keycaps, wheel, drag, `ts.next()` chips) | 1 column, 132 px visuals | Static markup, no engine |
| 3 | Playground · `#playground` | H2 left, tablist right (Showcase · Gallery · Dashboard). Framed demo, 480 px, 8×4 cells, radius 20, clips neighbours. Control bar below: Axis segmented, Transition select, Peek segmented (Off · Inset · Bleed), Gap and Space gap sliders with px readout, Loop checkbox, then prev / "Space n of 5" / next pushed to the right. Bar wraps to two rows below about 1100 px. One-line note per tab under the bar. | Tabs as a full-width 3-up segmented control. Frame 360 px, 4×5 cells, swipeable. Bar collapses to prev / counter / next + an "Options" disclosure button (`aria-expanded`) that reveals the same controls stacked as rows. | All options live. Inset = padding inside the frame so neighbours show; Bleed = frame `overflow: visible`, clipped by the section |
| 4 | Quick start · `#quick-start` | Code block 7 cols (index.html + main.ts, file labels, a "container needs a height" note), live result 5 cols (6×3, at least 360 px) with "Space 1 of 2" | Code above (scrolls sideways, 12 px), result 240 px (4×3) | Exactly the snippet's options |
| 5 | The lab · `#lab` | Left 5 cols: eyebrow, H2 "Does searching beat first-fit?", one paragraph, "Read the full write-up →". Right 6 cols: chart card (see below) | Text, chart with labels above the bars, then the link | — |
| 6 | Footer | About 5 cols, Packages 3 cols (`@tilespace/core` — packing, no DOM; `@tilespace/vanilla` — DOM engine; "React and Angular coming"), Links 3 cols (GitHub, npm, MIT License) | Stacked; links as a row of 44 px targets | — |

**Playground tabs.** Showcase: tiles in the seven tile colours, labelled with a number and their size. Gallery: photos accepting several shapes (for example `3x2 2x2 1x1`), with the filename as caption and `alt` text. Dashboard: widgets with real inputs (textarea, text input, counter, slider, checkbox). Type something, change Space, come back: the value is still there, which proves tilespace never re-renders content.

**Lab chart.** It is a card of two small horizontal bar groups on a 12×8 grid, per page. Empty cells per page (lower is better): search 0.5, first-fit 4.9. Time per page: search about 2.6 ms, first-fit to be filled in. Search bars use `--accent` and first-fit bars use `--muted`. Values are labelled at the bar end, and each group has a `role="img"` with an `aria-label` stating the numbers. Build it as hand-written HTML/SVG, with no chart library.

## Motion and accessibility

The motion is the library's own. The site only chooses the defaults below, and every demo must stay usable with no motion at all.

- **Default transition:** the Space slides as one block in about 420 ms with `cubic-bezier(.2,.8,.2,1)`, then each card settles in order: a fade plus an 8 px slide over 180 ms, 30 ms apart. These are starting values to tune against the engine. *Superseded by DEC-10 (amended 2026-11-25): the library's default is the slide only; the settle is one of the demo's card effects, run on `change`.*
- **Drag** scrubs the animation 1:1 and snaps to the nearest Space on release. Wheel and arrow keys move one Space per step.
- **Reduced motion:** with `prefers-reduced-motion: reduce`, use a 150 ms crossfade with no slide and no stagger. Drag still works. The hero wall never auto-advances.
- **Real controls:** use `<button>` for every action, `role="tablist"`/`role="tab"` with `aria-selected` and arrow-key roving focus for the example tabs, `aria-pressed` on segmented buttons, `<label>` on every slider, select and checkbox, and an `aria-label` on icon-only buttons (theme, menu, prev, next).
- **Live counter:** each demo has exactly one `aria-live="polite"` text, "Space 2 of 5", that is updated after a move ends, not on every scrub frame.
- **Demo regions:** each frame is `tabindex="0"` with `role="region"`, `aria-roledescription="carousel"` and a label that names the keys. Arrow keys work only while it has focus; there are no global key handlers. Tiles in off-screen Spaces get `inert` so Tab never lands on hidden content.
- **Focus:** a 2 px `--accent` ring at 3 px offset on everything via `:focus-visible`, including the demo frames.
- **Contrast:** body and muted text pass 4.5:1 in both modes, and tile text is always `--tile-ink`. Check the dark-mode first-fit bar (`--muted` on `--surface`) for 3:1.

## Open items and placeholders

Six things in the design are guesses or blanks. Resolve them from the library repo before shipping, and don't invent values for them.

| Item | In the design | What to do |
| --- | --- | --- |
| API names in Quick start | `createTilespace(el, { columns, rows, peek })`, `ts.next()` | Replace with the real `@tilespace/vanilla` signature and option names, including axis, gap, space gap, loop and transition |
| GitHub owner | `github.com/[OWNER]/tilespace` | Fill in the real repo URL (header, hero, footer, license link) |
| Write-up link | `[WRITE-UP URL]` | Point to the lab write-up, for example `docs/lab.md` on GitHub |
| First-fit time per page | `[MS]`, dashed bar | Take it from the benchmark output; if it doesn't exist, drop that bar and keep only the search time as a sentence |
| Gallery photos | Neutral placeholder blocks | Use license-free photos in `public/gallery/` with real `alt` text; credit them in the footer if the license asks |
| Space counts | Hero "of 4", playground "of 5", quick start "of 2" | These come from the packer at runtime, so render the real count |

## Build order

Work top to bottom. Each step should leave the page buildable, so it can be reviewed as it goes.

- [ ] Scaffold `site/` with Vite + TS, set `base`, and add the Pages workflow; deploy an empty page to prove the pipeline.
- [ ] Write `tokens.css`, `base.css` and `layout.css`; add the theme toggle with system default and saved choice.
- [ ] Write the static markup for all six sections from the Section spec, with the no-JS fallback tiles inside each demo container.
- [ ] Build the hero wall on `@tilespace/vanilla`: bleed peek, keys, wheel, drag, live counter.
- [ ] Build the playground: three tile factories, the tablist, the control bar wired to engine options, prev/next and the counter, then the phone Options disclosure.
- [ ] Build the Quick start from one snippet source, so the code shown equals the code run.
- [ ] Build the lab chart card in HTML/SVG with its aria labels.
- [ ] Resolve every row in Open items and placeholders.
- [ ] Check reduced motion, keyboard-only use and a screen reader (VoiceOver or NVDA), and confirm no page scroll at 360, 768, 1024 and 1440 px. Then run Lighthouse.
