# {{PROJECT}} quality bar

<!-- For builders and judges. Every rule is pass/fail and has an ID, so a judge can write "fails Q5.3" and a builder
     can pre-check. Every rule cites the reference it came from: a screenshot path in research/swipe/ or a teardown.
     Write it AFTER the swipe research and BEFORE a design round, then revise it after each round with what the owner
     rejected. The rules below are a proven starting set from real runs; delete what doesn't apply, and add your own
     with evidence. Path key: S/ = research/swipe/ screenshots, R1/ = round-1 shots (what not to repeat). -->

## Q0. Owner rulings: any failure here sends the option back without scoring
- **Q0.1** {{The owner's rulings, verbatim, each with the round-1 screenshot that broke it.}}
- **Q0.2** The hero shows the product range, not one or two items (at least {{N}} distinct products at 1280 and
  {{n}} at 390), when the business sells a range.
- **Q0.3** No banned fonts (Q2.1).
- **Q0.4** Not plain: at least 3 sections per page sit on a brand-colour or tinted surface, not white with grey cards.
- **Q0.5** No invented facts. Copy, prices, dates and specs come only from `mockups/kit/content.json`. Unconfirmed
  dates show "Date TBA".

## Q1. First screen (390x844 and 1280x800, no scrolling)
- **Q1.1** Wordmark, a real H1, the product and ONE primary button are all visible on the phone first screen.
- **Q1.2** Chrome above the hero is at most 96px at 1280 and 72px at 390, including any announcement strip.
- **Q1.3** Nothing covers the first screen: no email modal, cookie sheet, app banner or location panel.
- **Q1.4** If the site has more than ~20 products, search is visible on the phone (a field, or the largest header control).
- **Q1.5** Products and prices are in the first paint: no intro loader, WebGL scene or reveal-from-invisible.

## Q2. Type
- **Q2.1 Banned** (they read as "AI site" / default theme): Inter, Inter Tight, Roboto, Poppins, Montserrat, DM Sans,
  Space Grotesk, Geist, Figtree, Bricolage Grotesque, Archivo, Hanken Grotesk, Newsreader. {{Add your own.}}
- **Q2.2** Each direction gets an assigned pairing: one loud display face plus one quiet text face, at most 2 families
  loaded, only the weights/axes used. {{table: direction | display | text | evidence}}
- **Q2.3** Hero size comes from one `clamp()` between the 390 and 1280 sizes, not per-breakpoint rules.
- **Q2.4** Stress test: the longest real product name fits in 3 lines or fewer in a 390 tile.
- **Q2.5** Prices, dates and counts use `font-variant-numeric: tabular-nums lining-nums`.
- **Q2.6** Body ≥ 16px. Nothing a customer must read is under 14px. Condensed widths only at 24px and above.

## Q3. Colour
- **Q3.1** The page surface is a brand colour or a warm tint, and the ink is a dark brand colour rather than #000.
- **Q3.2** The palette is 1 surface, 1 ink, up to 2 category colours, 1 accent and the status colours, all as tokens.
- **Q3.3** Text contrast ≥ 4.5:1 (3:1 for 24px+).
- **Q3.4** One accent colour, used only for things you tap.

## Q4. Layout rhythm
- **Q4.1** The homepage has 5-7 sections that alternate a full-bleed colour band (one headline, one button) with a
  tight product row.
- **Q4.2** One primary button shape sitewide.
- **Q4.3** Radii come from one scale (sm/md/lg/pill) used on every container.
- **Q4.4** At most one marquee/ticker per page, honest claims only.
- **Q4.5** Every section is finished: no empty slots, no orphan tile; grids end on a full row or a "+N" tile.
- **Q4.6** None of the banned generic patterns (`qa-scorecard` skill, `references/page-rubric.md`).

## Q5. Navigation / mega menu (if the catalog needs one)
- **Q5.1** Top-level triggers are `<button aria-expanded aria-controls>`; click/tap opens; hover may open after
  ~150ms; Esc closes and returns focus; outside click closes.
- **Q5.2** At most 6 top items and two levels. Each group's first row is "All X".
- **Q5.3** At 1280x800 the panel fits the viewport with no internal scroll; the first row is pre-selected so the
  panel is never empty.
- **Q5.4** The menu is a place to shop: product images as tiles; at most one featured card per panel, with real data.
- **Q5.5** On the phone each drill-down level has back, title and close; rows ≥ 56px; background `inert`, scroll
  locked, focus moves in and back.

## Q6. Product tiles
- **Q6.1** One fixed `aspect-ratio` image cell on a consistent backdrop, `object-contain`, never stretched.
- **Q6.2** At most 5 elements: image, name, one detail line, price or status chip, one action.
- **Q6.3** Status is a small chip beside the price, not a banner. Pre-order tiles print the date or "Date TBA".
- **Q6.4** Hover and keyboard focus share one state. One stretched title link plus a separate `<button>`.
- **Q6.5** Stickers state facts ("9 packs", "Pre-order"), never hype ("Hot", "Selling fast").

## Q7. Product page
- **Q7.1** On a 390 first screen: image, name, the key detail, price, a status line, variant picker if any, ONE
  full-width primary button.
- **Q7.2** One trust block directly under the button.
- **Q7.3** "What's in it" as a graphic or table, from content.json values only.
- **Q7.4** A sticky buy bar appears after the main button scrolls away, padded with `env(safe-area-inset-bottom)`.
- **Q7.5** Breadcrumb up, sibling variants sideways.

## Q8. Sold out / upcoming (if the business has stock states)
- **Q8.1** Same layout, same image. No buyable price, no Add to cart. The H1 is the product name, never "Out of stock".
- **Q8.2** The primary action is an inline waitlist form (labelled, `type="email"`, `autocomplete="email"`, 16px+).
- **Q8.3** The page stays useful: facts, description, and an "in stock now" alternative rail.
- **Q8.4** Upcoming items show the absolute date first. A countdown only to a confirmed date. Otherwise "Date TBA".

## Q9. Interactions
- **Q9.1** Exactly ONE showpiece interaction per direction; at most 2 showy effects visible per screen.
- **Q9.2** The default state is the finished state. Motion only inside `prefers-reduced-motion: no-preference`;
  scroll timelines also inside `@supports (animation-timeline: view())`.
- **Q9.3** Pointer effects only under `(hover: hover) and (pointer: fine)`, on 1-2 elements. No tilt on touch.
- **Q9.4** Animate only transform and opacity, with shared easing/duration tokens.
- **Q9.5** No smooth-scroll libraries, no loaders, no heavy 3D for a shop.

## Q10. Mobile (the CLAUDE.md rules, checked by the judge)
- **Q10.1** No horizontal scroll at 360-390px. Taps ≥ 44px with `touch-action: manipulation`. Inputs 16px+.
- **Q10.2** `svh`/`dvh`, never `100vh`. `viewport-fit=cover` + safe-area padding on fixed bars. No unscoped smooth
  scroll. Nav links close the menu and scroll to top synchronously.

## Q11. Code (for the HTML options; the real build follows the web-builder agent)
- **Q11.1** Static HTML + Tailwind v4 browser build is fine for options. Tokens in `@theme`, no inline hex values.
- **Q11.2** Semantic HTML: one H1, landmarks, real buttons and links, alt text on every image.
- **Q11.3** `loading="eager"` with width/height on images (stable screenshots, no layout shift).
