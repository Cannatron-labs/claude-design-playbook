# Blueprint: a direct-to-consumer smoke shop (storefront + Shopify-style backend)

How to build an online smoke shop (vape, tobacco, hemp, glass and accessories) as **two separate sites**:

| Domain | What it is |
|---|---|
| `www.<shop>.com` | **Storefront.** Fast, mostly static customer site with a 21+ age gate, cart and checkout. No database, no secrets in the browser. |
| `admin.<shop>.com` | **Backend.** A Shopify-style admin for staff (orders, customers, products, discounts, settings), the Store API the storefront calls, webhooks and background jobs. |

It describes structure, screens, data and rules, not a finished codebase. It was distilled from two production
builds: a direct-to-consumer vape brand that moved off Shopify to its own backend, and a wholesale store with a
Shopify-style admin. The wholesale-only parts (price tiers, payment terms, approvals, POs) were dropped, and no
names, data or credentials from either project are included.

**Claude: read this folder in order before writing code**, together with the playbook's `PLAYBOOK.md` (process,
agents, judging). Build in the order in `08-build-order.md`.

| File | What's in it |
|---|---|
| [01-architecture.md](01-architecture.md) | The two-domain shape, monorepo layout, stack, module convention, the 10 rules every module follows, env vars, staff roles |
| [02-admin-design-system.md](02-admin-design-system.md) | Tokens, the admin frame, ~20 primitives (Page, Card, IndexTable, IndexFilters, Badge, Timeline, Modal, ContextualSaveBar…) and the list / detail / settings page anatomies |
| [03-admin-sections.md](03-admin-sections.md) | The left nav; **Customers** and **Orders** screen by screen (lists, tabs, columns, filters, detail cards, actions, refund and cancel rules, order states, drafts, abandoned checkouts, fraud review, chargebacks); the Settings hub |
| [04-data-model.md](04-data-model.md) | Tables and columns: customers, addresses, orders (with frozen snapshots), lines, payments, the order timeline, reservations, one ledger for store credit / gift cards / points, discounts, age checks, state rules, blocklist, fraud, audit log, email sends, outboxes |
| [05-store-api.md](05-store-api.md) | Every Store API endpoint, auth (`x-store-key` + customer bearer token), shopper headers, error codes, the contract package and versioning, what `POST /checkout` does step by step |
| [06-storefront.md](06-storefront.md) | Storefront layout, caching and revalidation, middleware order, every route, the age gate, checkout steps, passwordless accounts across two domains, SEO, tracking and consent |
| [07-compliance.md](07-compliance.md) | What makes a smoke shop different: compliance classes, 21+ in three layers, state shipping rules, excise tax, high-risk payments, fraud, marketing claims, records. Every legal specific is marked `[VERIFY]` |
| [08-build-order.md](08-build-order.md) | Ten phases from decisions to launch, what "done" means for each, and which playbook agents and skills to use |

## The ideas that matter most
1. **The storefront never touches the database.** It only calls the Store API, server-side, with a key.
2. **Money is integer cents, and every money action is idempotent.** Pressing a button twice never charges or
   refunds twice.
3. **Every order status change goes through one state machine** and writes a timeline event in the same transaction.
4. **Compliance is data, not code:** product classes, state rules, excise rates and age settings are admin settings
   that staff with the right role can change, and every change is audited.
5. **The admin feels like the one staff already know**, built from our own primitives (never Polaris, whose licence
   only allows Shopify apps).
