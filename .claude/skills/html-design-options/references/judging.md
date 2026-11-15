# Judging: gate, score, distinctness, tournament

Quality comes from people who didn't build it, judging evidence (screenshots), against a calibrated bar.

## Layer 1: deterministic gate (`scripts/capture.sh`)
For each page at 390x844 and 1280x800: first-screen PNG, full-page PNG (after scrolling through once), and one
`eval` of gate facts. Fails: sideways scroll, broken images, banned words, no CTA on the phone first screen of the
homepage, logo not marked `data-logo`. Two fix attempts, then drop. Cost: ~15 s per option.
The judges read these same 8 PNGs, so the evidence is identical for everyone.

## Layer 2: three independent judges, median per criterion
Run three judges in parallel, each with a different lens, never shown the builder's notes on quality or the other
judges' output:
1. **Brand creative director**: type, spacing, image use, finish. "Would the CD of <admired brand> ship this?"
2. **DTC / conversion lead**: phone first screen, one clear button, second page decision on one screen, proof.
3. **The client's team**: the rejected-traits list verbatim, plus distinctness against the kept board.
Each scores every criterion 0-10 against the anchors (rubric.yaml), lists invented copy, names a near-duplicate (or
null), gives one strength line and up to 5 concrete fixes. Use the repo's judge agent type if it has one
(e.g. `judge` from this kit); otherwise a general agent with "do not edit files".

Score = Σ weight × median(criterion) / 10. Keep: >= 80 and every median >= 6 and no invented copy. Almost: 70-79.
Drop: < 70, invented copy, or a near-duplicate (2 of 3 judges) of a kept option that scores the same or higher.

Rubric weights used (sum 100): first_screen 20, real_brand_craft 25, clean_simple 15, brand_fit 10, second_page 15,
research_grounding 5, distinct 10. Any 9+ must name the reference it matches (anti-inflation).

## Calibration (do this; it changed how we read every score)
Score 10-25 real top sites (the reference hunt) with the same judges. First-run result: the best real sites in the
category scored 79-81 (Rare Beauty, Our Place, Ghia, Cure Hydration ~80; Merit 76; Oura 71). Nothing real scored 90.
So: 80 = "as good as a top brand's live site". Put that sentence in every judge prompt; it stops inflation and
stops builders chasing an impossible 90. Don't ask a hunter for "90+ sites": nothing passes; take the top scorers.

## Fix rounds: what we learned
- One revise round on 65-79 moved scores 0-2 points. A second round with "be bold, redesign the weak section" did
  not push any near-miss over 80, and a fresh calibrated re-judge sometimes scored lower.
- New directions from strong references cleared the bar first time (Our Place -> #2, Ghia -> #8).
- So: allow ONE bold revise round, stop when gain < 2, and spend the rest of the budget on new directions.

## Director waves (loop until dry)
After the first wave, a director agent reads the board (slug | reference | status | score | best line | drop reason)
and the reference notes, and proposes up to 6 NEW directions that fill gaps and should beat the current top 8.
Stop when a wave adds nothing to the top 8, the director returns none, or the cap (30) is hit.

## Layer 3: pairwise tournament -> Elo
Absolute scores bunch at 80-82; head-to-heads separate them. Pairs: each option vs its 3 neighbours by score, plus a
round robin of the top 8 (~3N + 28 matches). A judge sees five PNGs per option (home 390 fold + full, home 1280
fold, second page 390 fold + 1280 fold), picks the one the client's team should launch, margin 1-3, one reason.
Alternate A/B order by match index to cancel position bias.
Elo: start 1500 + (score - 80) × 4; 30 passes over all matches with K = 32 / (1 + pass/5), weighted by
(0.5 + margin/6). Rank by Elo, score breaks ties. Report wins/played; an option with few games (3/3) is less certain.

## Why lines on the board
Write them in the main session from the match reasons, one plain sentence each ("Looks most like a real, warm brand,
and the phone shop page fits everything to buy on one screen. Won all 3 of its matchups."). Raw judge text is long,
technical and full of file paths.
