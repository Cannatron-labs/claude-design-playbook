# Case studies: what real runs produced

Two real projects used this method. Names are left out; the numbers and lessons are real.

## Run A: a direct-to-consumer beauty product (homepage + shop page)
A single product sold in a few variants (6 shades) and 3 pack sizes.

### Why we switched to HTML
Five rounds of homepage options built inside the real Next.js app were rejected in turn: too loud, too plain, messy,
clinical ("doctor's office"), and "they all look the same". Each round took hours, and one deploy failed because a
theme had a type error mid-edit. The client asked: "should we do it in HTML only to start, so we can see how they'd
look?" Yes.

### Runs
| Run | What | Agents | Time | Result |
|---|---|---|---|---|
| 1 options pipeline | 9 seeds from existing swipe screenshots + 3 scouts (12 new brands, 2 directions each) + 1 director wave (5) | ~200 | ~80 min | 20 built, 9 kept |
| 2 reference hunt | 4 hunters (premium Shopify themes, award galleries, top category brands, single-product DTC), 2 skeptical judges per site | 56 | 43 min | 26 real sites scored; best 80.5; none 90 |
| 3 combined | 9 concepts from the top real sites + 10 near-misses with 2 fix rounds + tournament (37 matches) | 256 | 52 min | 29 built, 11 kept, 16 almost, 1 dropped |

Subagent tokens: ~3 M for the hunt, ~20 M for the combined run.

### Final ranking (Elo from 37 head-to-heads), reference brand in brackets
1. Numbered Shade System (Olaplex), 81: the shade numbers became the brand; the easiest shade choice. 6/7 wins.
2. Warm Cream Serif (Our Place), 80: warm real-brand feel; the whole buy decision on one phone screen. 3/3.
3. Shade Stack (Color Wow), 80: all six shades stacked in the hero. 5/7.
4. Midnight Premium (AG1), 81: the most selling on the first phone screen. 5/7.
5. Snow Bold Hero (Snow), 82: the calmest, cleanest phone screen; the quickest shop page.

### Lessons that changed the method
- The highest absolute score (82) ranked 5th; head-to-heads matter more than points.
- Near-miss fix rounds didn't work (0-2 points per round); new directions did (2 of 9 concepts went straight in).
- Calibrating the judges on real sites showed 80 is top-brand level; stop chasing 90.
- The client liked one existing structure (the shop page top). Locking it into every option made the shop pages
  comparable, and it got the most praise in matchups.
- Mid-run updates kept the client engaged: a contact sheet of phone first screens after wave 1, the board live
  after wave 1, then the final ranked board.

## Run B: a retail store with a large catalog (homepage + category + product page in two stock states)
Round 1 options came back "too plain", and several broke owner rulings nobody had written down (the city name in
the hero, only two products in the hero). The fix that worked for round 2 was a **QUALITY-BAR.md**: a pass/fail rule
list where every rule has an ID (Q1.3) and cites a reference screenshot, written from six research teardowns
(award-winning stores, the category's best sites, mega-menu patterns, interactions, type). Judges then wrote "fails
Q0.2" instead of vague notes, and builders could pre-check. See `templates/project-docs/QUALITY-BAR.template.md` at
the repo root.

Lessons:
- Write the owner's rulings down as Q0 rules ("any failure sends the option back without scoring").
- Ban the overused fonts by name. Round 1 used six of the most common AI-site fonts, and judges kept calling
  the results generic.
- "Not plain" needs a number: at least 3 sections per page on a brand-colour or tinted surface.
- A product page with stock states needs a page per state (in stock, out of stock) in the gate and the judging.
