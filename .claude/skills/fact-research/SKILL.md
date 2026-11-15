---
name: fact-research
description: The method for building a sourced fact record (a product, catalog item, entity or release) where every fact carries field, value, url, accessed date and a verbatim quote, and anything unsourced is [VERIFY]. Covers the record shape, source priority, image policy, conflicts, the [VERIFY] → open-items flow and batch mode. Load for "add this product", "research this item", "build the record for…", "what's in this…", or before writing any facts into a database or onto a page.
---

# Fact research: every fact carries a source

Pages, copy and judges all read the same records. If the record is right, everything downstream can be checked;
if it is guessed, every page inherits the guess. So the record is built first, judged, and only then used.

## Record shape (`data/records/<slug>.json`; adapt the `entity` block to the project)
```json
{
  "slug": "maker-line-name-variant",
  "entity": { "maker": "", "line": "", "name": "", "variant": "", "year": "", "official_url": "" },
  "specs": { "<field>": "<value or [VERIFY: what's needed]>" },
  "description_md": "",
  "images": [
    { "url": "", "source": "own_photo | manufacturer | distributor", "credit": "", "license_note": "", "alt": "" }
  ],
  "facts": [
    { "field": "specs.<field>", "value": "", "url": "", "accessed": "YYYY-MM-DD", "quote": "verbatim text from the page" }
  ],
  "verify": ["what is still unknown and where it might be found"],
  "conflicts": [{ "field": "", "values": [], "urls": [], "used": "" }]
}
```

## Rules
1. **No quote, no fact.** Every non-`[VERIFY]` value in `entity`/`specs` has a `facts[]` entry whose `quote`
   actually contains it. Paraphrased quotes fail the judge's spot-check.
2. **Source priority** (write the project's own list into its CLAUDE.md): official/manufacturer page or spec sheet
   → distributor or trade documents → structured public datasets → nothing. Blogs, forums, marketplace listings
   and other retailers' pages are never the source of a fact. Some sites may be banned outright (e.g. ones whose
   terms forbid scraping); link to them if useful, never source from them.
3. **Images**: own photo > official/distributor asset (credited) > none. Never another seller's photos or
   marketplace listing images. Every image records `source` + `license_note`.
4. **Conflicts**: use the higher-priority source, keep both quotes in `conflicts[]`, say which was used.
5. **Unknowns**: `[VERIFY: …]` in the value + a line in `verify[]`. The main session copies every `verify[]` line
   into `ops/open-items.md` so nothing gets lost.
6. **No invented numbers ever**: specs, prices, dates, counts, odds, ratings, review counts, scarcity.
7. **description_md** is built only from sourced fields: what it is, what's in it / its specs, who it suits (only
   if it follows from the facts), links to official resources. 150-300 words, no hype, no banned words.

## Workflow
1. Identify the entity exactly. 2. Official source first. 3. Fill fields + facts together, never one without the
other. 4. Images by the policy. 5. Description. 6. Validate (`jq empty`, every field traced, every image sourced).
7. Hand to the judge with the `fact-record` rubric. 8. Only a PASSED record gets imported or used on a page.

## Batch mode
For a whole release or category: one record per variant, sharing the same `entity` block values; run one
curator agent per record in parallel; judge each record separately; the main session imports only the passes and
merges all `verify[]` lines into `ops/open-items.md` once.

## Indexing gate (for public pages built from records)
A page built from a record is search-indexable only when its specs are filled, it has a real allowed image, and
its facts are sourced. Otherwise it ships `noindex,follow`. Structured data must match the real state (never claim
pre-order or in-stock unless true).
