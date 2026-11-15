# Page rubric: 7 dimensions (page builds only)

Applies to every built page and to HTML design options. Run it **in addition to** the YAML rubric. Both must pass.

## Pass rule
- Score each of the 7 dimensions 0-10. **PASS = average ≥ 8.0 with no dimension < 7.**
- Max **3 rounds**. Stop early if the average gained **< 0.3** over the previous round, then escalate to the owner
  with the best round and the 3 lowest dimensions.
- Evidence = screenshots at 390×844 and 1280×800 (fold + full page) plus the source file. No screenshot, no score.

## The 7 dimensions
| # | Dimension | 5 = | 8 = | 10 = |
|---|---|---|---|---|
| 1 | **hierarchy** | everything the same weight; the eye wanders | one clear first read (what it is + the one action), then the supporting facts | the page answers "what is it, can I get it, why this one" in one glance on a phone |
| 2 | **sizing/density** | cramped or empty sections | spacing follows a system; facts are dense but scannable (table, definition list) | as dense as a good spec sheet and still calm |
| 3 | **readability** | small grey text, long lines, mono body | ≥ 16px body on phone, 45-75ch lines, contrast AA, numbers in tabular figures | effortless to read on a phone, standing up |
| 4 | **consistency** | components differ page to page | one type scale, one button style, one table style across page types | a new page type could be built from the system with no new decisions |
| 5 | **distinctiveness** | could be any competitor or a stock theme | recognisably this brand; the product's own facts shape the design | someone could name the brand from a cropped screenshot |
| 6 | **mobile** | breaks or scrolls sideways at 390 | no h-scroll at 360-390, taps ≥ 44px, inputs ≥ 16px, sticky bars padded with `env(safe-area-inset-bottom)`, `min-h-svh` not `100vh` | verified on a real iPhone in Safari + Chrome |
| 7 | **code** | inline hacks, div buttons, layout shift | typed, small components, semantic `<button>`/`<a>`, valid JSON-LD, no layout shift from images | as 8, Lighthouse mobile ≥ 95 and no console errors |

## Banned generic patterns
These are the tells of an AI-made or template site. Each one found caps **distinctiveness at 5**, which fails the
page because 5 < 7. List each with its location in `page_rubric.banned_patterns`.
1. ALL-CAPS letter-spaced eyebrow labels above headings.
2. A grid of identical rounded cards that all have the same soft drop shadow.
3. Gradient washes (background gradients used as decoration).
4. `A · B · C` meta strings (dot-separated tag lines).
5. Arrows appended to button text ("Shop now →").
6. A big-number stat row as the first content section ("500+ customers · 12 countries · 1 mission").
7. Copy that sells instead of says. Write the concrete fact ("12 packs, 1 autograph per box"), not hype ("the
   hottest box of the year!").

## Copy rules checked here too
- No banned words. Default list: seamless, elevate, unleash, game-changer, revolutionary, world-class,
  cutting-edge, best-in-class, "in today's…", "when it comes to…". Add the project's own.
- No banned claims: invented numbers, fake scarcity ("only 2 left!" unless real stock data says so), fake reviews
  or ratings, implied partnerships that don't exist, plus anything the project's CLAUDE.md bans.
