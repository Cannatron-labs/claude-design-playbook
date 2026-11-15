---
name: html-design-options
description: Generate many high-quality website design options (homepage + key page) as static HTML + Tailwind, each modelled on a real best-in-class brand, then gate, 3-judge score, pairwise-rank and publish them on a ranked chooser page so a team can pick a winner. Use when someone wants homepage/landing/product-page options, "show the team some directions", "make it look like a real brand", "the designs all look the same / too plain / generic", or wants to pick a site look before building it for real.
---

# HTML design options: build many, judge hard, rank, publish

The method: **don't design inside the real app.** Build each direction as two static HTML pages (Tailwind v4 browser
CDN, no build step) from one shared kit of real images and approved copy. Model each one on a named real brand whose
screenshots the builder studies. A script gates every option, three independent judges score it, a director adds
waves that fill gaps, a pairwise tournament ranks the keepers, and a chooser page goes live. The team picks; only the
winner is rebuilt in the real stack.

Why it works: options can't break each other (no shared build), builders run in parallel, every option uses the same
words and images (so the team compares design only), and quality is measured by agents that didn't make it.

## Read before starting
- `references/process.md`: the full step-by-step (setup, run, publish, hand-off). **Follow it in order.**
- `references/quality.md`: how to make these sites look like a real brand, what won and what got rejected.
- `references/judging.md`: rubric, judge lenses, calibration, tournament maths.
- `references/gotchas.md`: tooling traps that cost hours (Windows, agent-browser, workflows, Tailwind).
- `references/case-study.md`: real numbers from the first two runs: yield, cost, timing, what ranked top and why.

## The pipeline (one line each; details in process.md)
1. **Kit**: `mockups/kit/` = real product images (webp) + `content.json` (the ONLY copy builders may use) + a
   screenshot of anything the client already likes (`kit/ref/`), which becomes a fixed structure.
2. **Contract**: `mockups/BRIEF.md` from `templates/BRIEF.template.md` (stack, content rules, must-haves per page,
   mobile rules, the client's rejected-traits list, deliverables).
3. **Tools**: copy `scripts/` to `mockups/tools/`; serve `mockups/` on 127.0.0.1:<port>; test the capture gate on a dummy.
4. **Rubric**: copy `templates/rubric.yaml` to the repo's QA folder; adjust page names and brand-fit wording.
5. **Seeds**: 6-10 directions, each = one real brand + its screenshots (390 and 1280, fold and full) + what to take.
6. **Run** `workflows/options-pipeline.js` with args (Workflow tool). Scouts capture more brands while seeds build.
7. **Publish** from the main session: write `ranking.json`, run `make_index.py` + `publish.sh`, check every link.
8. **Hand-off**: the team picks; rebuild only the winner in the real stack; log the decision.

No Workflow tool? Run the same steps by hand with the Agent tool: one builder agent per option in parallel, then
three judge agents per option in parallel, and the tournament matches after that. The workflow script is the
reference for every prompt and schema.

## Hard rules
- Copy comes only from `content.json`; judges list any claim not in it and the option is dropped. No invented
  reviews, numbers, prices, times or ingredients.
- Every option names its reference brand and the exact patterns taken (NOTES.md); builders must READ the screenshots.
- Producers never score their own work. Three judges with different lenses; median per criterion.
- Phone first: the 390x844 first screen must show the product, the message and one button, without scrolling.
- Keep bar 80/100 with no criterion under 6. Calibrate the judges on real top sites first (they scored 79-81, so
  80 already means "as good as a top brand's live site"; nothing real scored 90).
- Spend budget on **new directions, not fix rounds**: near-misses moved only 0-2 points per round.
- The main session publishes (a deploy from a subagent gets flagged and can stall).
- Don't let one option's code or images touch another's folder.

## Scale and cost (first real run)
~50 min per run; 15 options in the first wave; total 29 options, ~500 agents. About 40% of builds clear 80.
Expect 15-25 genuinely distinct good directions before new ones start repeating; cap a run at 30.
