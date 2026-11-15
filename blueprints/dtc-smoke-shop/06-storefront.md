# 06 · The storefront (`www.<shop>.com`)

The storefront is a fast, mostly static Next.js site with **no database and no secrets in the browser**. Everything
it knows comes from the backend's Store API (`05-store-api.md`).

## Stack and layout
- Next.js 16 App Router, React 19, TypeScript, Tailwind v4 (`@theme` tokens), Framer Motion. Vercel.
- Only extra runtime dependency: the Supabase client, for customer sign-in (see Accounts below).

| Path | Role |
|---|---|
| `src/app/**` | Routes, kept thin. `src/app/api/**` = the browser-facing proxy routes. |
| `src/components/<area>/` | `layout, product, collection, cart, checkout, account, orders, blog, sections, reviews, search, marketing, analytics, seo, system, ui` |
| `src/lib/store-api/client.ts` | Catalog reads, cached with tags. Each getter returns `null` on 404 so the page calls `notFound()`. |
| `src/lib/store-api/checkout.ts` | Cart, checkout, orders: `no-store`, `server-only`. |
| `src/lib/store-api/contract.ts` | Types copied from the backend's `api-contract` package. **Never edited here.** |
| `src/lib/store-api/fixtures/` | Fixture mode: with no `STORE_API_URL`, data comes from JSON in the contract's shape, so design work runs offline. |
| `src/lib/auth/` | Customer session helpers. |
| `src/proxy.ts` | The middleware (order below). |

## Talking to the backend
- Every call: `${STORE_API_URL}/api/store/v1/*` with header `x-store-key: <STORE_API_KEY>`, **server-side only**.
- The browser only calls the storefront's own routes (`/api/cart`, `/api/checkout`, `/api/suggest`, `/api/newsletter`,
  `/api/back-in-stock`, `/api/e` analytics collector…), which forward server-side. The store key never reaches the
  browser.
- Server helpers forward the shopper's IP and Vercel geo headers (`x-shopper-ip`, `x-shopper-country/-region/-city`)
  so the backend's rate limits, fraud score and state rules see the shopper, not the server.
- **Caching:** fetch cache with tags (`site, products, product:{handle}, collections, collection:{handle},
  page:{h}, policy:{h}, redirects, sitemap…`), 1-hour safety revalidate. The backend calls
  `POST /api/revalidate` (`Authorization: Bearer <REVALIDATE_SECRET>`, timing-safe compare) with
  `{tags[], paths[], immediate}` whenever staff change something. `immediate` is for prices and stock.
- Cart and saved-items providers load **after hydration**, so catalog pages never read cookies and stay static.

## `src/proxy.ts` (middleware) runs in this order
1. Maintenance gate (503 page; a staff bypass cookie).
2. IP / country block rules from the backend (fails open; never blocks verified search crawlers).
3. Legacy-URL handling and the redirect table (one 301, chains collapsed).
4. Token-to-cookie moves (order and resume links: the secret moves to an httpOnly cookie with a 303, so no tag ever
   sees it in the URL).
5. Account session refresh (only on `/account*`).
6. Rewrites, then a per-request CSP nonce on checkout, account and order pages.

## Routes

| Route | What it is |
|---|---|
| `/` | Home, built from sections the admin's theme editor controls; static, refreshed by tag. |
| `/collections/{handle}` | Collection grid (page 1 static), SEO copy, FAQ. Filters/sort/page render via an internal rewrite and are `noindex, follow`. |
| `/products/{handle}` | Gallery, variant picker, buy box, required warnings, "goes well with", reviews, FAQ, sticky add-to-cart, notify-me when sold out, "can't ship to your state" note when the API says so. |
| `/search?q=` | Results + "did you mean"; noindex. Header search overlay uses `/api/suggest`. |
| `/cart` | Full cart (also a drawer): server-priced lines, free-shipping progress from the API, one code box (discount, then gift card), terms checkbox gating Checkout, per-line `problem` messages. noindex. |
| `/checkout` | One page, **always a full page load** (its own strict CSP; no third-party tags at all). |
| `/orders/{id}` | Guest order status / thank-you: totals, tracking, the photo-ID upload if the age check asks for it. |
| `/account` + `/account/orders/{number}`, `/addresses`, `/profile`, `/balances` | Sign-in card or order history; order detail with tracking and Buy again; address book; profile and marketing choices; gift card and store credit. |
| `/pages/{handle}`, `/policies/{handle}`, `/blogs/{blog}/{handle}` | Content, policies (privacy, refund, shipping, terms, age policy), blog. |
| `/pages/data-sharing-opt-out` | "Do not sell or share my info". |
| `/sitemap.xml`, `/robots.txt` | See SEO. |
| `not-found.tsx`, `error.tsx` | Branded 404 / 500. |

## Age gate and 21+ (see `07-compliance.md` for the rules behind it)
- **Entry gate:** a client-only overlay shown after hydration when the `<shop>_age_ok` cookie is missing. Server
  HTML is never blocked or redirected, so crawlers and no-JS visitors still get the page.
  - Logo, "You must be 21 or older to enter", one disclaimer line, three numeric date-of-birth boxes (MM/DD/YYYY)
    that auto-advance; `inputMode="numeric"`, `autocomplete="bday-*"`, 16px text, 44px targets; focus trapped,
    `aria-modal`. Under 21 → an inline "Sorry" message (no entry). A pass sets the cookie for 30 days.
  - Skipped on `/checkout*` and `/orders*` (checkout collects date of birth itself).
- **At checkout:** date of birth + "I am 21 or older" + terms, all required, and the API enforces them again. Age is
  computed in the business's home time zone.
- **Photo ID (optional, backend switch):** when the backend's age check can't verify someone, the order page shows
  an ID upload card (waiting for ID → in review → approved / denied). Photos are resized in the browser
  (≤ 1600px JPEG, which strips location data) and posted same-site, 4 MB cap.

## Checkout (one page, steps in order)
1. Contact: email; email and SMS marketing opt-ins as **separate, unticked** boxes.
2. Shipping address (US only), address autocomplete; warnings (PO box, ZIP/state mismatch) inform, a `block` result
   stops. The state list shows only states the shop ships to; lines that can't ship to the chosen state show their
   `problem` text.
3. Shipping method from the API (adult-signature methods when the product requires them).
4. Payment: the card is tokenized in the browser by the gateway's own JS; card numbers never touch our routes. Gift
   cards and store credit can apply.
5. Date of birth + 21+ + terms.
6. **Pay.** Each press sends a unique id (idempotency): a retry can never charge twice. Card errors map to friendly
   copy; a `428 challenge_required` shows a CAPTCHA above Pay.
7. Thank-you = `/orders/{id}` (token moved to a cookie first).

## Customer accounts across two domains
1. Passwordless: an emailed one-time code via Supabase Auth on the **backend's** Supabase project. The storefront
   holds only its URL and publishable key.
2. `requestCode` / `verifyCode` are server actions; before each, the storefront calls the backend's
   `POST /account/sign-in-limit` (shared rate limit per email and per IP; also refuses blocklisted emails).
3. Session cookies are httpOnly **on the storefront domain**; the browser never talks to Supabase directly.
4. Account pages read the access token server-side and call `/account/*` with `Authorization: Bearer`; the backend
   re-verifies it every call. A 401 shows the sign-in card again.
5. Session refresh happens only in the proxy for `/account*`.
6. Staff sign-in is completely separate, on the backend domain.

## SEO
- **URLs:** `/products/{h}`, `/collections/{h}`, `/pages/{h}`, `/blogs/{b}/{h}`, `/policies/{h}`. Keep every old URL;
  anything dropped gets a 301 in the backend's redirect table. Redirects are answered only in the proxy.
- **Head:** title and description from the API's `seo` block (no invented fallbacks), absolute canonical, one `<h1>`
  per page. Collection page 2+, filters and sorts → `noindex, follow`, canonical to page 1.
- **Private sections** (cart, checkout, orders, account, search) → noindex + disallowed in robots; `*.vercel.app`
  hosts send `X-Robots-Tag: noindex`.
- **Sitemaps:** index → products / collections / pages / blogs / articles; only indexable 200 self-canonical URLs.
- **JSON-LD:** Organization + WebSite (home); CollectionPage + BreadcrumbList (collections); Product with one Offer
  per variant + BreadcrumbList (product; AggregateRating **only** with real reviews); Article. Check
  `07-compliance.md` before adding health or effect claims anywhere, including FAQ schema.

## Tracking and consent
- Third-party tags load only when an env flag **and** a host allow-list both pass, and only after hydration.
- **No tags of any kind on `/checkout*`** (enforced by CSP). No session replay on account, order or checkout pages.
- Global Privacy Control honoured; an opt-out page stops ad pixels and sets ad consent to denied.
- Note: the big ad platforms restrict tobacco and vape advertising. Check each platform's policy before relying on
  its pixel for ads (`07-compliance.md`).

## Look and feel
The storefront design comes from the playbook's `html-design-options` run (phone-first, real product photos, one
accent colour for things you tap, none of the banned generic patterns). The mobile rules in the playbook's
`templates/CLAUDE.md.template` apply to every page.
