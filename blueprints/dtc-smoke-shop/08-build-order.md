# 08 · Build order (and which playbook pieces to use)

Each phase ends with the playbook's `judge` (and `design-reviewer` for UI) before the next one starts. Unfinished nav
items show "Coming soon" so the admin always looks whole.

| Phase | Build | Done when | Playbook pieces |
|---|---|---|---|
| 0 · Decide | Fill `CLAUDE.md` from the template: what's sold (compliance classes), states served, payment provider, carriers, tax provider, age-check provider; resolve every `[VERIFY]` in `07-compliance.md` that blocks launch | Every launch-blocking `[VERIFY]` is answered in `ops/decisions.md` | `templates/CLAUDE.md.template`, `researcher`, `strategist` |
| 1 · Look | Storefront design options (homepage + product page + age gate + cart) | Owner picks a direction from the ranked board | `swipe-analyst`, `html-design-options`, `judge` |
| 2 · Foundation | Monorepo, two Vercel projects, two domains, Supabase, schema for catalog / customers / orders / ledger / audit, staff auth + roles, the admin frame and primitives | Staff can sign in with 2FA and see an empty Orders list at 390 and 1440 | `web-builder`, `design-reviewer` |
| 3 · Catalog | Products, variants, inventory, collections, media, redirects; Store API catalog endpoints; storefront home / collection / product from fixtures, then live | A product edited in the admin updates the storefront within seconds (revalidate) | `fact-curator` + `fact-research` for product facts, `copywriter` |
| 4 · Cart and checkout | Cart, shipping rates, **state rules**, tax + **excise**, address check, gateway tokenization, idempotent Pay, age gate + checkout age fields, order placement, emails | A test order end to end in sandbox mode, including a blocked state and an under-21 refusal | `judge` (page rubric), `design-reviewer`, real iPhone check |
| 5 · Orders admin | Orders list + detail, fulfil, refund page, cancel, hold/release, timeline, packing slips, drafts | Staff can run a day of orders without touching the database | `judge`, `design-reviewer` |
| 6 · Customers admin | Customers list + detail, addresses, marketing consent, store credit/gift cards ledger, block | Every order sits on a customer; consent changes are logged with source and time | |
| 7 · Trust and safety | Age verification chain + review queue, fraud score + review queue, blocklist, chargebacks | Back-test the fraud score on test orders; a held order can't ship | |
| 8 · Growth | Discounts, abandoned checkouts, back in stock, reviews, email/SMS outboxes, analytics, content editor | Each outbox runs in `shadow` before `live` | |
| 9 · Launch | Redirects from any old site, sitemaps, robots, monitoring, the monthly sales-by-state-by-class report, maintenance switch | The launch-critical pages pass the judge at 85+ and a real iPhone check | `qa-scorecard` |

## Tests
- Vitest only for the pure logic in `packages/core`: money, tax and excise maths, refund plans, the order state
  machine, age rules, fraud scoring, state-rule matching.
- Everything else is checked in a real browser (agent-browser or Claude in Chrome) at 390 and 1440, then on a real
  iPhone in Safari and Chrome.

## Keep `docs/FEATURES.md`
One table per admin area: feature · what it does · where in the admin · status (Planned / Built / Live) · link to the
how-to. Every commit that adds, removes or switches a feature updates it. This is how the owner (not a developer)
knows what exists.
