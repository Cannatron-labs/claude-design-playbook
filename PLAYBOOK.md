# The playbook: how we run a project with Claude Code

**If you are a Claude session, read this whole file before doing anything else in a project that uses this kit.**
It explains how the agents, skills, rubrics and files fit together, and the order to use them in. Each section
links to the file that holds the detail.

The kit came out of real client projects (a DTC beauty brand and a retail store with a large catalog). Every rule
in it is there because skipping it once cost hours or produced work the owner rejected.

---

## 1. The four ideas everything else follows from

1. **Whoever makes something never decides whether it is good.** Builders build; a separate `judge` agent scores
   the result against a written rubric, using screenshots and sources as evidence, and returns JSON. The main
   session reads the verdict and decides what happens next.
2. **Nothing is invented.** Every fact (number, spec, price, date, review, claim) comes from a source with a
   verbatim quote, or from the owner's confirmed facts in `CLAUDE.md`. Anything else is written as
   `[VERIFY: what's needed]` and listed in `ops/open-items.md`. A blank beats a confident guess.
3. **Design starts from evidence, not taste.** Before designing, screenshot the best real sites (competitors, the
   best brands in the category, award winners) and write down what they actually do. Every design option names
   the real brand it learned from and the exact pattern it took.
4. **Make many, judge hard, rank, then build one.** Don't design inside the real app. Build 10-30 static HTML
   directions in parallel, gate and judge every one, rank the keepers head to head, publish a board, and let the
   owner pick. Only the winner is rebuilt for real.

---

## 2. What's in the kit

| Piece | File | What it does |
|---|---|---|
| **Agents** (`.claude/agents/`) | | Each runs in its own context with its own tools. |
| judge | `judge.md` | Scores anything against `qa/rubrics/*.yaml`. Read-only. Returns JSON. Also referees tournament matches. |
| swipe-analyst | `swipe-analyst.md` | Screenshots reference sites at 390 + 1280, writes teardowns and `research/swipe/INDEX.md`. |
| design-reviewer | `design-reviewer.md` | After any frontend change: opens the page in a real browser, checks desktop + mobile, console, network and the project's rules; returns a punch list. Read-only. |
| copywriter | `copywriter.md` | Writes copy only from sourced facts; 3 variants per headline; every unknown is `[VERIFY]`. |
| fact-curator | `fact-curator.md` | Builds one record per product/entity where every fact has url + quote. Never writes the database. |
| strategist | `strategist.md` | SEO / local / paid-search briefs from live tool data only. Never estimates a number. |
| web-builder | `web-builder.md` | Builds the real site from the picked option; mobile-first, iOS-safe; verifies in a browser, then hands to the judge. |
| docs-keeper | `docs-keeper.md` | Keeps `docs/` in sync with the code after a feature ships. |
| **Skills** (`.claude/skills/`) | | Instructions loaded when the task matches. |
| html-design-options | `html-design-options/` | The whole design-options pipeline: kit, brief, capture gate, 3 judges, director waves, tournament, board. Scripts and workflow included. |
| qa-scorecard | `qa-scorecard/` | The judging protocol: thresholds, hard gates, revise limits, 7-dimension page rubric, tournament, ledger. |
| fact-research | `fact-research/` | The sourced-record method: record shape, source priority, images, `[VERIFY]` flow, batch mode. |
| researcher | `researcher/` | Quick web research through a subagent: direct answer + sources, no speculation. |
| **Rubrics** (`qa/rubrics/`) | | Weighted criteria with 0/5/8/10 anchors and hard gates. Weights sum to 100. |
| | `html-option.yaml` | Static design options. |
| | `page.yaml` | Built pages in the real app. |
| | `fact-record.yaml` | Sourced fact records. |
| | `research-brief.yaml` | Research and teardowns (bar 70). |
| **Templates** (`templates/`) | `CLAUDE.md.template` | Project rules: confirmed facts, architecture, non-negotiables, iOS mobile rules, banned copy, folders, tools. |
| | `project-docs/` | `STATUS.md` (hand-off), `decisions.md` (newest first), `open-items.md`, `QUALITY-BAR.template.md`. |

---

## 3. Setting up a new project (do this once, in order)

1. **Copy the kit in.** Put `.claude/agents/` and `.claude/skills/` in the repo (or in `~/.claude/` to use them in
   every repo). Copy `qa/` to the repo root.
2. **Write `CLAUDE.md`** from `templates/CLAUDE.md.template`. Interview the owner only for what you can't infer:
   - What the business sells and doesn't, who buys, where, launch date → **Confirmed facts**.
   - Which systems own which data → **Architecture**.
   - Allowed and banned sources for facts and images.
   - Banned claims (legal, brand or trust reasons) and banned words.
   - Brands they admire, competitors, and anything they've already rejected (write their words verbatim).
3. **Create the tracking docs** from `templates/project-docs/`: `docs/STATUS.md`, `ops/decisions.md`,
   `ops/open-items.md`. Log the setup decisions as the first entry.
4. **Tune the rubrics.** Rename criteria to the project's pages (e.g. `second_page` → pricing page), rewrite
   `brand_fit` for this brand, add the project's hard gates. Keep the weights at 100 and the 80 bar.
5. **Calibrate the judge** (once, before real use): score one known-good and one known-bad sample; they must
   separate by ≥ 25 points. For design, score 10-25 real top sites; expect the best to land at 79-81. That is what
   80 means. Put that sentence in every design-judge prompt.
6. **Tools:** Node 22+ and Chrome for the capture scripts (`html-design-options/scripts/capture.mjs`,
   `shoot.mjs`), Python 3 for `make_index.py` / `make_kit.py`. Optional: `agent-browser` (npm) for interactive
   browser work, the Claude in Chrome extension for checking pages in a real browser, the Vercel CLI for
   publishing the board.

---

## 4. The lifecycle of a project

```
research ─► quality bar ─► design options ─► owner picks ─► facts + copy ─► build ─► judge + review ─► iPhone check ─► ship
   │            │               │                              │              │            │
swipe-analyst  you         html-design-options          fact-curator    web-builder   judge (page.yaml + page rubric)
strategist                 (builders, gate, 3 judges,   copywriter                    design-reviewer
                            director, tournament)
```

### Stage 1: Research (evidence before design)
- `swipe-analyst`: ~6 sites per study (direct competitors, category leaders, outside-the-category benchmarks, and
  the best example of your hardest flow). Screenshots at 390×844 and 1280×800, fold and full. Teardowns record
  what IS there; patterns need ≥ 3 sites, otherwise they are hypotheses.
- `strategist` (if search matters): live keyword and SERP data, tool named for every number.
- The `judge` scores each brief with `research-brief.yaml` (bar 70).

### Stage 2: The quality bar
Write `research/design/QUALITY-BAR.md` from `templates/project-docs/QUALITY-BAR.template.md`: pass/fail rules with
IDs, each citing a screenshot. Put the owner's rulings at the top as Q0 rules. This is what turned "too plain"
feedback into a second round that passed: judges write "fails Q0.2", and builders can check before they submit.

### Stage 3: Design options (`html-design-options` skill)
Follow `html-design-options/references/process.md` exactly. In short:
1. **Kit:** real product images + `content.json` (the only copy builders may use) + screenshots of anything the
   owner already likes (it becomes a fixed structure in every option).
2. **Brief:** `mockups/BRIEF.md` from the template: stack, content rules, page must-haves, mobile rules, the
   rejected list.
3. **Seeds:** 6-10 directions, each = one real brand + its screenshots + exactly what to take from it.
4. **Run** `workflows/options-pipeline.js` with the Workflow tool (or by hand with parallel Agent calls). Each
   option: build → capture gate (2 fix tries) → 3 judges with different lenses (creative director, conversion
   lead, the owner's team), median per criterion → one bold revise if 65-79 → keep / almost / drop. A director
   agent adds waves of new directions until a wave adds nothing to the top 8. Then a pairwise tournament → Elo.
5. **Publish** from the main session: `ranking.json` → `make_index.py` → `publish.sh` (or publish `board.html` as
   a private Claude artifact). Write the one-line "why" for each option yourself, from the match reasons.
6. Send the owner a contact sheet after the first wave, so they react early.

What decides quality (from ~700 judge fixes): build the brand system from the product's own facts; warmth beats
sterile "clean"; one accent colour used only for things you tap; the second page decides close matchups (fit
the whole buy decision on one phone screen); each option a different brand world (change at least four of
layout, type, palette, image treatment, button shape, rhythm). Details: `references/quality.md`.

Spend budget on **new directions, not fix rounds.** Near-misses moved 0-2 points per round; strong new references
went straight in.

### Stage 4: Facts and copy
- `fact-curator` builds one record per product with the `fact-research` skill; the `judge` scores each with
  `fact-record.yaml` and spot-checks ≥ 20% of quotes by opening the URLs. Only passing records get used.
- `copywriter` writes from records + confirmed facts only, 3 variants per headline, every unknown `[VERIFY]`.
- The main session copies every `[VERIFY]` into `ops/open-items.md`.

### Stage 5: Build
- `web-builder` rebuilds the picked option in the real stack, using the option's HTML and screenshots as the
  visual spec. The mobile rules in `CLAUDE.md` are not optional; they come from real iOS bugs.
- It verifies in a real browser at 390 and 1280, then hands off. It never scores itself.

### Stage 6: Judge, review, check on an iPhone
- `judge` with `page.yaml` **and** the 7-dimension page rubric (`qa-scorecard/references/page-rubric.md`). Both
  must pass. Launch-critical pages need 85.
- `design-reviewer` for visual correctness: console, network, overflow, tap sizes, off-token colours.
- Max 3 revise rounds; stop if the last round gained < 3 points; then escalate to the owner with the best version
  and the top 3 blockers.
- A person checks a real iPhone in Safari and Chrome before anything is called done. Desktop devtools emulation is
  Blink, not WebKit; it hides every iOS bug in the mobile rules.

---

## 5. How the main session runs agents

- **Brief subagents like peers.** They know only what's in the prompt: give the goal, the files to read (absolute
  paths, forward slashes), the output path and format, and what's already ruled out.
- **Run independent work in parallel** (several Agent calls in one message). Builders never touch another
  option's folder.
- **Never let a subagent publish or deploy.** Publishing from a subagent gets flagged and can stall. The main
  session publishes.
- **Never let a subagent write the ledger.** Judges return JSON; the main session appends one line per score to
  `qa/ledger.jsonl` (format in `qa-scorecard/references/ledger.md`).
- **Judges never see the builder's self-assessment.** From round 2 they see only the previous fix list.
- **Never trust a number from an agent that didn't name the tool it came from.** (A strategist once returned
  estimates as real data; they were off by 50-100×.)
- **End every session by rewriting `docs/STATUS.md`** and adding decisions to `ops/decisions.md` with the owner's
  words quoted. The next session starts by reading STATUS.md.

---

## 6. Browser automation rules (these cost real hours)

- **Always use a named session** with agent-browser: `agent-browser --session <proj>-<task> --idle-timeout 60m`.
  The default session can spawn a new browser per command (~7 s each vs ~0.25 s).
- **Never pipe the command that starts a session** (`open … | grep`): the daemon holds the pipe and the shell
  hangs until the idle timeout. Redirect the first command to a file.
- **Set the viewport before opening the URL**, or you get desktop layouts in "phone" screenshots.
- **Batch DOM reads into one `eval`** returning a JSON object. Never `wait <ms>`; use `wait --load networkidle`.
- **Never kill Chrome globally** (`taskkill /IM chrome.exe`, `pkill chrome`): it closes the user's own tabs. Use
  `agent-browser close --all`, or filter processes by command line.
- If agent-browser misbehaves, use the dependency-free scripts: `node capture.mjs <slug>` (gate + screenshots for
  an option) and `node shoot.mjs <url> <outdir> <name>` (any reference site). They drive Chrome directly over CDP.
- More traps (Windows paths, CRLF in workflow scripts, Tailwind overflow, Vercel protection):
  `html-design-options/references/gotchas.md`.

---

## 7. Banned patterns and copy (shared by builders, copywriter and judges)

- Words: seamless, elevate, unleash, game-changer, revolutionary, world-class, cutting-edge, best-in-class,
  "in today's…", "when it comes to…", plus the project's own list. If a line could sit on a competitor's site
  unchanged, rewrite it.
- Generic layout tells (each caps distinctiveness at 5): tracked ALL-CAPS eyebrows, grids of identical shadowed
  cards, decorative gradients, `A · B · C` meta strings, arrows on button text, a stat row as the first section,
  copy that sells instead of says.
- No fake scarcity, fake reviews, invented numbers or implied partnerships. Ever.

---

## 8. Quick reference

| Situation | Do this |
|---|---|
| "Make us some homepage options" | `html-design-options` skill, start at `references/process.md` step 0 |
| "Is this ready?" / "score this" | `judge` agent + the matching rubric (protocol: `qa-scorecard`) |
| "Add this product" | `fact-curator` + `fact-research` skill, then `judge` with `fact-record.yaml` |
| "Write the page copy" | `copywriter`, then `judge` |
| "What should we rank for?" | `strategist` |
| "Build the page" | `web-builder`, then `judge` (page.yaml + page rubric) + `design-reviewer` |
| Just changed any UI | `design-reviewer` before telling the owner it's done |
| Unsure of an outside fact | `researcher` skill; never guess |
| End of session | Rewrite `docs/STATUS.md`; log decisions; move `[VERIFY]`s to `ops/open-items.md` |
