# 05 · The Store API (`admin.<shop>.com/api/store/v1/*`)

The only door between the storefront and the backend.

## Rules
- **Server-to-server only.** Every call carries `x-store-key` (constant-time compare, fails closed). One wrapper,
  `storeRoute()`, handles the key check, maps errors to `{ "error": { "code", "message" } }`, sends `no-store`, and
  answers 503 if the database is down.
- **Customer endpoints** also need `Authorization: Bearer <customer access token>`, verified with Supabase on every
  call. On first sign-in the token is linked to the customer row by email.
- **Shopper context headers** from the storefront: `x-shopper-ip` (required on cart and checkout),
  `x-shopper-ua`, `x-shopper-country`, `-region`, `-city`, `x-cart-id`. Rate limits, fraud scoring and state rules
  use these, not the storefront server's IP.
- **Error codes the storefront handles:** 401 bad key · 403 `blocked` · 409 `conflict` (e.g. a locked invoice cart)
  · 428 `challenge_required` (show the CAPTCHA) · 429 `rate_limited` with `Retry-After`.
- **Contract:** `packages/api-contract/src/v1.ts` holds every request/response type plus a changelog header (v1.0,
  v1.1…), and `client.ts` is a typed client. Additive optional fields stay in v1; anything breaking is v2. Change
  the contract **first**, then the backend, then the storefront.

## Endpoints

| Group | Endpoints |
|---|---|
| Site | `GET /health` · `/site` (settings, menus, theme sections, free-shipping threshold, age-gate text) · `/site/maintenance` · `/sitemap/{type}` · `/redirects` · `/redirects/lookup` |
| Catalog | `GET /products/{handle}` (incl. compliance_class, required warnings, shippable states) · `/collections/{handle}?filter.*&sort_by&page` · `/recommendations/cart` · `GET/POST /products/{handle}/reviews` |
| Content | `/pages/{handle}` · `/blogs/{blog}` · `/blogs/{blog}/articles/{handle}` · `/policies/{handle}` |
| Search | `/search` · `/search/suggest` · `/search/redirects` |
| Cart | `POST /cart` · `GET/PATCH /cart/{id}` · `/cart/{id}/lines` (+ `/{lineId}`) · `/email` · `/shipping-address` · `/shipping-method` · `/discount` · `/gift-cards` · `/store-credit` · `POST /cart/resume` (signed invoice or recovery link). Every cart answer is re-priced, and each line carries `problem: string \| null` (e.g. "We can't ship this to your state"). |
| Checkout | `GET /checkout/config` (payment methods, age-check mode, consent wording) · `POST /checkout/address-check` · `POST /checkout` with `{ idempotencyKey, cardToken, cardBin, dob, ageAttested, termsAccepted, marketing, sms, challengeToken }` · BNPL confirm/cancel |
| Orders (guest) | `GET /orders/{id}?token=` (only the token's hash is stored) · `POST /orders/{id}/age-check` (ID photo upload) |
| Account (Bearer) | `/account/me` · `/account/orders` (+ `/{name}`, `/{name}/buy-again`) · `/account/addresses` (+ `/{id}`) · `/account/balances` · `POST /account/sign-in-limit` (shared rate limit + blocklist check, called **before** a sign-in code is sent) |
| Marketing | `/newsletter` (double opt-in) · `/back-in-stock` (+ `/unsubscribe`) · `/events` (first-party analytics) |
| Security | `GET /security/rules` (IP/country browse rules for the storefront's proxy; modes off / log / on) · `POST /security/hits` |

## What `POST /checkout` does, in order
1. Rate limits and blocklist (email, IP, card BIN, address, state) → 403 / 429 / 428.
2. Re-price the cart from the database (never trust client prices); check every line against `state_rules` for the
   ship-to state; check stock and place `reservations`.
3. Address check (confirmed / corrected / unconfirmed / undeliverable per settings).
4. Tax: sales tax from the provider + state excise on flagged lines (`07-compliance.md`). Provider down → stop.
5. **Age:** under 21 by date of birth → refuse, no order. Otherwise run the age-check chain (`07-compliance.md`); a
   check that needs a photo ID still lets the order be paid, but it is **held**.
6. Write the order (`placed`) and a `pending` payment row, then charge with the gateway token (`idempotencyKey`
   makes a retry safe).
7. Paid → state `paid`, fraud score, holds applied, confirmation email queued (never twice), outbox events written,
   reservation consumed. All in transactions with `order_events` rows.
8. Answer with the order id and its status-page token.

## Backend → storefront
`POST https://www.<shop>.com/api/revalidate` with `Authorization: Bearer <REVALIDATE_SECRET>` and
`{ tags: [...], paths: [...], immediate: bool }` after every admin save that changes what shoppers see.

## Webhooks in (backend)
`/api/webhooks/<vendor>` for the payment gateway, BNPL, carrier tracking, email platform, age-check provider. Each
is signature-checked and idempotent (store the event id; a repeat is a no-op).

## Optional extra surfaces
A partner API (`/api/partner/v1/*`, per-partner keys and allow-lists) and a read-only staff API (personal hashed
keys) can be added later with the same wrapper pattern.
