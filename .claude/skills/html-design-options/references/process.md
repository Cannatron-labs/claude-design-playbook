# Process: step by step

Paths assume the repo root is `<ROOT>` and everything lives in `<ROOT>/mockups/`. Use absolute forward-slash paths in
every agent prompt (`C:/Users/...` on Windows), never backslashes (see gotchas.md).

```
mockups/
  BRIEF.md            contract every builder follows
  kit/                shared, read-only for builders
    content.json      the only allowed copy
    images.txt        list of every kit image (builders pick from it)
    img/              product renders, studio shots, results, scenes (webp, <=1600px)
    ref/              screenshots of things the client already likes (fixed structures)
  options/<NN-slug>/  index.html, <page2>.html, NOTES.md, img/ (only if it generated images)
  shots/<NN-slug>/    capture.sh output: {page}-{390|1280}-{fold|full}.png + gate.json
  refs/               scout notes, hunt results, concept briefs
  tools/              capture.sh, make_kit.py, make_index.py, publish.sh
  thumbs/             board thumbnails (made by make_index.py)
  ranking.json        the board's data; index.html is generated from it
  board.config.json   brand name, title, page labels, "earlier directions" links
  vercel.json, .vercelignore
```

## 0. Ask only what you can't infer (2 minutes)
- What pages? (Usually the homepage plus one money page: shop, product, pricing, quote form.)
- Is there anything they already like? Screenshot it into `kit/ref/`; it becomes a fixed structure every option
  restyles but keeps (first run: the shop-page top, minus one price line the client wanted gone).
- What has the client rejected before? Write the list verbatim into BRIEF.md. This list is the most useful
  thing you will put in it ("too loud", "too plain", "messy", "clinical white space", "they all look the same").
- Which brands do they admire or compete with? Those become seeds.

## 1. Build the kit
- Images: run `scripts/make_kit.py --src <dir> [--src <dir>...]` to copy real product renders, studio shots, results
  and any scene library into `kit/img/` as webp and write `kit/images.txt`. Real product images beat AI ones: use
  AI only for scenes/people, never for the product with text on it.
- `content.json` (start from `templates/content.template.json`): headline options, sub, CTA labels, bullets,
  how-it-works steps, product variants (name, short code, hex), sizes and prices, rating + reviews (real, or
  clearly team-preview), FAQ, shipping line, banned words. Pull it from the repo's existing copy files; never let
  the builders write claims.
- `kit/ref/`: screenshots of the liked structure at 390x844 and 1280x800 (see capture recipe in gotchas.md).

## 2. Write the contract
Copy `templates/BRIEF.template.md` to `mockups/BRIEF.md` and fill every `{{...}}`. Keep it about one page. It must
contain: stack, image rules, content rules, per-page must-haves, the fixed structure, mobile rules, the rejected
list, deliverables (pages + NOTES.md + run capture and fix until gate passes).

## 3. Tools and server
- Copy `scripts/*` to `mockups/tools/`. Copy `templates/board.config.json` to `mockups/` and edit it.
- Start the static server in the background: `cd mockups && python -m http.server 4100 --bind 127.0.0.1` (the
  scripts default to port 4100; if you use another, change `BASE` in them and the port in the workflow prompt).
- Two capture engines, same outputs (`shots/<slug>/{page}-{390|1280}-{fold|full}.png`, `gate.json`, last line
  `{"pass","fails"}`):
  - `capture.sh`: uses agent-browser.
  - `capture.mjs`: Node 22+ driving Chrome directly; no other dependency. Prefer it if agent-browser isn't
    installed or hangs. To use it everywhere, make your `mockups/tools/capture.sh` just
    `exec node "$(dirname "$0")/capture.mjs" "$1"`, so the workflow's `bash capture.sh <slug>` calls still work.
- Smoke-test: make `options/_test/index.html` (+ the second page) with a logo marked `data-logo` and a button, run
  `bash mockups/tools/capture.sh _test`, read the PNGs, then delete `_test` from options/ and shots/.
- Edit the defaults at the top of your copy of `capture.sh` (agents call it without env vars): `PAGES` (default
  `home:index.html shop:shop.html`; the key names must match `board.config.json` pages), `CTA_RE` (button words
  that count as the call to action), `BANNED` (the brand's extra banned words).

## 4. Rubric
Copy `templates/rubric.yaml` into the repo's QA folder (e.g. `qa/rubrics/html-option.yaml`). Rename the second-page
criterion (shop_page -> pricing_page, quote_page...) and rewrite `brand_fit` for this brand. Keep weights summing
to 100. Do not loosen the 80 bar; it is calibrated (judging.md).

## 5. Seeds and references
- Existing research first: if the repo already has screenshot swipe files, use them.
- Each seed = `{name, ref, shots, angle}`: a 2-3 word direction name, the real brand, the screenshot folder, and a
  1-3 sentence instruction of exactly what to take. Spread seeds across moods (bold product hero, warm editorial,
  premium dark, friendly colour, people/lifestyle, competitor-style, configurator buy flow).
- Always include one competitor-style seed and one people-led/lifestyle seed if the client asked for them.
- Optional but strong: run `workflows/reference-hunt.js` first or alongside. It hunts four sources (premium
  Shopify themes, award galleries, top brands in the category, best single-product DTC outside it), has two
  skeptical judges score each real site, and writes concept briefs for the best. The real sites' scores are your
  calibration line.

## 6. Run the pipeline
Load the `workflow-authoring` skill, then call Workflow with `scriptPath` = this skill's
`workflows/options-pipeline.js` and `args` (pass real JSON, not a string):
```json
{ "root": "C:/path/to/repo", "brand": "ACME", "product": "one-line description of what is sold",
  "rubric": "C:/path/to/repo/qa/rubrics/html-option.yaml", "cap": 30, "startAt": 1,
  "seeds": [{"name": "...", "ref": "...", "shots": "C:/.../screens/brand/", "angle": "..."}],
  "scouts": [{"key": "a", "brands": "site1.com, site2.com, site3.com, site4.com"}],
  "rejected": "too loud; too plain; messy; clinical white space; all look the same",
  "kept": [] }
```
What it does: seeds build immediately while scouts capture new brands and feed two directions each straight into
building (no barrier). Each option: build -> capture gate (2 fix tries) -> 3 judges -> one bold revise if 65-79 ->
keep / almost / drop -> director waves until a wave adds nothing to the top 8 (or the cap) -> pairwise tournament.
It returns `{ranked, almost, dropped, matches, state}`; it does NOT publish.

While it runs: check progress by reading the run's `journal.jsonl` (label -> result), and send the client a
contact sheet of phone first screens after the first wave so they can react early.

## 7. Publish (main session)
1. Write `mockups/ranking.json`: `{"built": N, "options": [{slug, name, pitch, reference, score, elo, rank,
   status: "kept"|"almost", why, palette, fonts}]}`. Write the `why` lines yourself from the match reasons: one
   plain sentence each. Judge text is too long and full of file paths.
2. `python mockups/tools/make_index.py` then open the board locally at 390 and 1280 and check: no sideways scroll,
   no broken thumbnails, no file paths in the text.
3. First deploy only: create a separate static Vercel project (`vercel project add <name>`, `vercel link`), turn
   deployment protection off, add `noindex`. Then `bash mockups/tools/publish.sh` (deploys `--prod` and aliases
   the stable URL in board.config.json).
4. Check every option link returns 200 (`curl -s -o /dev/null -w '%{http_code}'`).
5. Append one ledger line per option if the repo has a QA ledger; log the board in the decisions file; copy the
   board folder (minus `shots/`) to Drive if the project syncs there.

## 8. Hand-off
The team picks (or mixes: "#2's look with #1's buy box"). Rebuild only that design in the real app, reusing its
real checkout/data. Keep the HTML as the visual spec and diff the rebuilt pages against the option's screenshots.
