---
name: qa-scorecard
description: The independent QA protocol. It covers how a judge agent scores a page, HTML design option, built page, fact record or research brief against qa/rubrics/*.yaml, plus pass thresholds, keep/revise/drop, revise-loop limits, the 7-dimension page rubric, the pairwise tournament and the qa/ledger.jsonl format. Load when judging, when running a produce → judge → revise loop, when someone asks "is this ready to ship", "score this", "judge these options", "does this pass", or when deciding whether work is good enough to show the owner.
---

# QA scorecard

The one idea: **whoever makes something never decides whether it is good.** A separate judge agent scores it against
a written rubric, using evidence (screenshots, files, URLs), and returns JSON. The main session decides what happens
next and keeps the record.

## Use when
- You are the judge (the `judge` agent in `.claude/agents/`, or a general agent told "do not edit files").
- You are orchestrating produce → judge → revise for pages, design options, data records or research.
- You must decide whether something is good enough to publish or show the owner.

## Rubrics (`qa/rubrics/`)
| Rubric | Scores |
|---|---|
| `html-option.yaml` | static HTML design options (html-design-options pipeline) |
| `page.yaml` | a built page in the real app |
| `fact-record.yaml` | one structured data record whose every fact must carry a source |
| `research-brief.yaml` | a research brief (market, competitors, keywords, teardowns) |

Write a new rubric for any new kind of artifact before you make the first one. Format: see any file above
(`pass`, `hard_gates`, `criteria` with `weight` + `ask` + `anchors` at 0/5/8/10, weights summing to 100).

## Rules
1. **Judge ≠ producer.** The judge gets the artifact, the rubric, the references and the evidence. It never sees
   the producer's reasoning or self-rating. From round 2 it sees only the previous fix list.
2. Score every criterion **0-10 against its anchors**. Weighted total = Σ(score × weight) / 10, on a 0-100 scale.
3. **PASS / KEEP** = weighted ≥ 80, no criterion < 6, every `hard_gate` true.
   **Launch-critical** work (homepage first screen, the main money page, page templates that will be copied many
   times) needs ≥ 85. **Revise** 65-79. **Drop** < 65. A rubric may set its own bar in `pass:`
   (`research-brief.yaml` uses 70).
4. **Hard gates are binary** and never averaged away. Any one fails the artifact whatever it scores. Typical gates:
   - an invented fact (a number, date, price, spec, review or quote with no source)
   - a banned claim or a banned word (the project's list)
   - an image from a source the project doesn't allow
   - broken mobile (sideways scroll at 390px, inputs < 16px, tap targets < 44px)
   - wrong structured data for the real state (e.g. "in stock" schema on a sold-out item)
5. Any score of **9+ must name the exemplar it matches or beats**: a screenshot path or a URL. With no exemplar,
   the maximum is 8. This one rule stops score inflation.
6. Creative work is also **ranked against the 2 best references**. If it is "competent but interchangeable with
   any competitor", distinctiveness and brand_fit are capped at 5.
7. **Spot-check** at least 20% of cited sources, and at least 4. Open each URL and find the quoted text. One
   fabrication sets `no_invented_facts: false`, which is a FAIL.
8. Output **max 8 fixes**, ordered by score gain. Each fix must be concrete enough to do without asking:
   file + element + change.
9. **Revise loop:** max 3 rounds. Stop early if the last round gained < 3 points (weighted). Then escalate to the
   owner with the best version and the top 3 blockers. For design options, spend budget on new directions rather
   than a second fix round: near-misses moved only 0-2 points per round in practice.
10. **Page builds are judged twice:** the YAML rubric **and** the 7-dimension page rubric in
    `references/page-rubric.md` (average ≥ 8/10, none < 7, ≤ 3 rounds, stop if the average gained < 0.3; its
    banned-pattern list caps distinctiveness). Both must pass.
11. **Tournament** for kept design options: `references/tournament.md`.
12. **Ledger:** only the main session appends to `qa/ledger.jsonl`. Judges and subagents return JSON; they
    never write the ledger. Format: `references/ledger.md`.

## Do not
- Grade on effort, length or polish of prose.
- Give a number without an evidence note (screenshot path, file#line, URL + quote).
- Edit the artifact you are judging.
- Accept "it's probably right" for a fact. Unsourced → `[VERIFY: …]` in the artifact and a line in
  `ops/open-items.md`, and the gate fails if the rubric says so.

## Judge output (JSON only, no prose)
```json
{"rubric":"page","slug":"pricing","round":1,
 "scores":{"<criterion>":7},"weighted":78.5,"hard_gates":{"<gate>":true},
 "page_rubric":{"scores":{"hierarchy":8},"avg":7.9,"banned_patterns":[]},
 "verdict":"KEEP|REVISE|DROP","fixes":["≤8, file + element + change, ordered by score gain"],
 "evidence":["criterion: screenshot/file#line/url + quote"],"spot_checks":[{"url":"","quote_found":true}],
 "reference_comparison":"one sentence","launch_critical":false,"escalate":false,
 "verify_items":["every [VERIFY] seen, for the main session to add to ops/open-items.md"]}
```
Include `page_rubric` only for page builds.

## Calibrate before first real use
1. Score a known-good sample and a known-bad sample. They must separate by ≥ 25 points; if not, rewrite the anchors.
2. For design work, score 10-25 real top sites in the category with the same rubric and judges. In practice the
   best real sites scored 79-81, so 80 means "as good as a top brand's live site". Put that sentence in every
   design-judge prompt. It stops inflation and stops builders chasing an impossible 90.
