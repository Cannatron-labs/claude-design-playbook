# 01 · Architecture: two domains, one source of truth

```
            shoppers                                   staff
               │                                         │
   www.<shop>.com  (storefront)              admin.<shop>.com  (backend)
   Next.js on Vercel                          Next.js on Vercel
   - no database, no secrets in browser       - Shopify-style admin UI
   - static pages + cart/checkout UI          - Store API  /api/store/v1/*
               │                              - webhooks   /api/webhooks/*
               │   server-to-server           - background jobs (Inngest)
               └──── x-store-key ───────────► │
               ◄──── POST /api/revalidate ────┘   (backend tells storefront what changed)
                                              │
                                   Supabase: Postgres (Drizzle) · Auth · Storage
                                              │
                 payment gateway · tax · address check · email · SMS · carrier tracking
```

## Why two domains
- **Different jobs, different risk.** The storefront must be fast, static and crawlable. The backend holds money,
  customer data and staff logins. Splitting them keeps every secret off the public site.
- **The storefront can be rebuilt or redesigned without touching orders**, and the admin can ship features without
  risking the shop's page speed.
- **One rule makes it work:** the storefront never touches the database. It only calls the Store API with a server
  key. Changing the API means changing the contract package first (`05-store-api.md`).

## Repos and folders
Recommended: one pnpm + Turborepo monorepo, two Vercel projects (one per app), so the contract types are shared
without copying.

```
apps/backend/        admin UI, Store API, webhooks, Inngest functions       → admin.<shop>.com
apps/storefront/     the customer site                                       → www.<shop>.com
packages/db/         Drizzle schema + migrations (Supabase Postgres)
packages/core/       pure logic with Vitest tests: money, tax, order state machine, refunds, age rules, fraud score
packages/api-contract/  Store API types + typed client, versioned (v1.x)
packages/integrations/  one folder per vendor behind a small interface, each with a fake for local work
                        (payment gateway, BNPL, tax, address check, age check, email, SMS, tracking, CAPTCHA)
tools/               one-off CLIs (imports, backfills): dry run by default, --write to change data
docs/                one plain-English file per module + FEATURES.md (the full feature list)
```
Two separate repos also work (the storefront copies `contract.ts` and never edits it), but the monorepo removes
that copy step.

## Stack
| Layer | Choice | Notes |
|---|---|---|
| Both apps | Next.js 16 App Router, React 19, TypeScript strict, Tailwind v4 | Check the framework docs before using any API you're unsure of. |
| Admin UI | shadcn/ui + lucide + our own primitives (`02-admin-design-system.md`) | Never Polaris (licence). |
| Database | Supabase Postgres + Drizzle ORM | RLS on every table; the app connects server-side only. |
| Auth | Supabase Auth: **staff** (email code/magic link + authenticator app) on the backend; **customers** (emailed one-time code) used by the storefront through the backend | Staff and customer logins never mix. |
| Storage | Supabase Storage: public media bucket; **private** buckets for ID photos and exports | Private files only through short-lived signed URLs. |
| Jobs | Inngest (cron + event-driven, exact-time runs) | Concurrency groups keep order work ahead of sweeps. |
| Email | A transactional email API (e.g. Resend) | Every send has a "never twice" key. |
| Hosting | Vercel (two projects) | `*.vercel.app` hosts send `X-Robots-Tag: noindex`. |

## Module convention (backend)
```
apps/backend/src/modules/<name>/
  index.ts        the only thing other modules may import
  server/         DB reads and writes ('server-only')
  api/            Store API route handlers for this module
  admin/          admin screens and client tables
  jobs/           Inngest functions
packages/db/src/schema/<name>.ts      the tables this module owns (one owner per table)
docs/modules/<name>.md                plain-English doc, updated in the same commit
```
Route files in `src/app/**` stay thin: read through the module, render module components.

## Rules every module follows
1. **Money is integer cents; percentages are basis points.** Never floats. Helpers in `packages/core`.
2. **Every server action is a public endpoint.** First line: `assertStaff(capability)` (or the customer check).
   Never trust an id from the client without checking it belongs to the viewer.
3. **Saves follow one pattern:** zod validation → one database transaction → audit row → revalidate the
   storefront's cache tags.
4. **Order status only changes through the state machine** (`packages/core/order-state.ts`), and every change
   writes an `order_events` row in the same transaction (`04-data-model.md`).
5. **Idempotency on every external write.** A unique `idempotency_key` on payments, ledger entries and email sends.
   Write a `pending` payment row before calling the processor. Never auto-cancel an order once a charge was
   attempted; tag it for a payment check instead.
6. **Outbox for every outside service** (marketing email, SMS, loyalty, partner webhooks): the row is written in the
   business transaction, sent right away by an event, retried at exact times, swept as a safety net. Each outbox
   has a sending mode: off / shadow / allowlist / live (the lower of an env setting and the owner's admin switch),
   so nothing reaches real customers by accident.
7. **Never edit an old migration**; add a new one.
8. **No secrets or customer data in git.** Imports read from a folder outside the repo.
9. **Fail closed on money and compliance** (tax, age, state rules unreadable → checkout stops), **fail open on
   convenience** (browse blocking, recommendations).
10. **Docs in the same commit as the change**, in plain English: the owner and staff are not developers.

## Environment (names only)
| App | Variables |
|---|---|
| backend | `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STORE_API_KEY`, `STOREFRONT_URL`, `REVALIDATE_SECRET`, `INNGEST_*`, gateway / BNPL / tax / address / age-check / email / SMS keys, `*_SENDING_MODE` |
| storefront | `STORE_API_URL`, `STORE_API_KEY`, `REVALIDATE_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_GATEWAY_CLIENT_KEY` (browser card tokenizer), CAPTCHA site key, tag/pixel flags |

## Staff roles (capabilities, not page lists)
Owner · Finance · Merch (products, content) · Warehouse (fulfilment) · Support (customers, orders, limited
refunds). Each action checks a capability such as `orders.refund`, `credit.manage`, `age.review`,
`fraud.manage`, `security.manage`, `data.export`, `rules.write`. Money rows in the activity log are visible to
Owner and Finance only.
