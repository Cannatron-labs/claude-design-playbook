# 04 · Data model

Drizzle schema in `packages/db/src/schema/<module>.ts`, one owning module per table.

**Conventions:** UUID primary keys · `created_at` / `updated_at` on every row · snake_case in SQL, camelCase in
TypeScript · **money in integer cents, percentages in basis points** · `citext` for emails · RLS on every table
(nothing reachable through Supabase's public API; the app connects server-side) · a unique `idempotency_key` on every
row that records an outside write · never edit an old migration.

## Customers

**`customers`**
| Column | Type | Notes |
|---|---|---|
| email | citext, unique when present | |
| phone | text (E.164) | |
| first_name, last_name | text | |
| email_marketing, sms_marketing | enum subscribed · not_subscribed · unsubscribed · pending | each with `_updated_at`, `_source` and opt-in level, so consent is provable |
| tags | text[] | system tags need a capability |
| note | text | staff only |
| birthday | date | optional, from the profile |
| age_verified_at, age_verified_method | timestamptz, text | set by a passed check on the **signed-in** account |
| tax_exempt | bool | |
| auth_user_id | uuid, unique | linked at first sign-in |
| disabled_at | timestamptz | |
| attributes | jsonb | created_via, email history, import facts |

**`customer_addresses`**: customer_id (FK, cascade) · first/last name · company · line1 · line2 · city · region ·
postal_code · country (default US) · phone · is_default (exactly one per customer).

## Orders

**`orders`**
| Group | Columns |
|---|---|
| Identity | number (sequence), name (`#1042`, unique), source (web · draft · import), customer_id, email, phone |
| State | status (state-machine enum), on_hold, hold_reasons text[], tags text[], note, placed_at, paid_at, cancelled_at |
| Money (cents) | subtotal, discount_total, shipping_total, shipping_discount_total, tax_total, grand_total, refunded_total, currency |
| Payment | payment_method (card · bnpl · gift_card · store_credit · manual · none), payment_ref |
| Addresses | shipping_address, billing_address as **jsonb snapshots, never changed by later address edits** |
| Shipping | shipping_method, shipping_rate_code, tracking_numbers text[], shipped_at |
| Tax | tax_provider, tax_ref, tax_committed_at, tax_breakdown jsonb (per jurisdiction + a separate `vape`/excise level) |
| Risk | risk jsonb (AVS/CVV, address check, fraud score copy, how the customer was linked), customer_ip |
| **Compliance** | **buyer_dob, age_attested_at, terms_accepted_at, age_verification jsonb (status, method, check id)** |
| Consent at checkout | accepts_marketing, accepts_sms_marketing, sms_marketing_phone |
| Links | cart_id, lookup_token_hash (guest order page), idempotency_key (unique), confirmation_sent_at |

Identity that must always hold: `subtotal − discount + shipping + tax = grand_total`.

**`order_lines`**: variant_id (FK, set null) · **sku, title, variant_title, qty, unit_price, line_total,
discount_total, tax_total, tax_breakdown, tax_code** (all frozen at sale) · kind (product · bundle ·
bundle_component) · parent_line_id · taxable · is_gift_card · discount_allocations jsonb `[{ruleId, code, title,
amount}]`.

**`order_payments`** (the transactions table): provider (gateway · bnpl · gift_card · store_credit · manual) · kind
(authorization · capture · charge · refund · void · redeem) · status (pending · succeeded · failed) · amount_cents ·
transaction_id · auth_code · avs_result · cvv_result · card_type · last4 · ledger_account_id · error_message ·
idempotency_key (unique). **A `pending` row is written before the processor is called.**

**`order_events`** (the timeline): order_id · event (e.g. `placed`, `paid`, `hold`, `release_hold`,
`fulfillment_created`, `delivery_update`, `refund_issued`, `cancel`, `email_sent`, `comment`, `tags_added`,
`mark_fraud`, `age_check_passed`, `payment_check_needed`) · from_status · to_status · actor (`system`,
`staff:<id>`, `webhook`, `job:<name>`) · metadata jsonb · created_at. Indexes on (order, time), (event, time) and
(order, metadata->>'requestKey') so a repeated refund request is found and refused.

**Refunds and fulfilments don't need their own tables to start:** a refund = `order_payments` refund rows +
an `order_events` `refund_issued` row (lines, quantities, shipping, tax, request key in metadata) +
`orders.refunded_total`. A fulfilment = an `order_events` `fulfillment_created` row (items, quantities, carrier,
tracking) plus `shipment_trackers` / `tracking_events` for carrier scans. Promote them to tables if returns or
split shipments get complex.

**`reservations`**: variant_id · order_id · qty · status (active · released · consumed) · expires_at (about 20 min
for card, 60 for BNPL). Stock is held during payment and released if the payment doesn't complete.

**`draft_orders`**: status (open · invoice_sent · completed · cancelled), lines, shipping, discount, customer,
totals snapshot (display only, never used to charge).

**`carts`, `cart_lines`**: carts hold **no prices**; every read re-prices on the server.

## Catalog (short)
`products` (handle, title, description, status, vendor, type, tags, seo, **compliance_class**, **excise_tax_class**,
requires_adult_signature) · `variants` (sku, options, price_cents, compare_at_cents, barcode, weight) · `inventory`
(variant_id, on_hand, safety_buffer) · `collections` (manual or rule-based) · `media` · `redirects`.

## Money other than cards
**One ledger for store credit, gift cards and loyalty points.** `ledger_accounts` (type store_credit · gift_card ·
loyalty_points, unit USD · POINTS, customer_id) and `ledger_entries` (signed amount, reason, order_id, actor, note,
expires_at, idempotency_key unique). Append-only; balance = sum of entries; mistakes are fixed with a reversing entry.
`gift_cards`: code_hash (sha256 of the normalised code; **the code itself is never stored**), last4,
ledger_account_id, customer_id, expires_at, disabled_at. Gift cards and store credit are **tenders, not discounts**.

## Discounts
`discounts` (kind: percentage · fixed_amount · free_shipping · buy_x_get_y; method: code · automatic; value_bps /
value_cents; target jsonb; minimums; starts/ends; usage_limit; once_per_customer; combines_with) ·
`discount_codes` (citext unique, own limits) · `discount_usages` (per order: applied · released, so a cancel frees
the use).

## Compliance and risk
**`age_checks`**: order_id · customer_id · email · first/last name · dob · region · address_key · status (passed ·
blocked · waiting_for_id · in_review · approved · denied · cancelled) · method (returning · database · id_upload ·
attestation · staff) · reason · provider · provider_ref · provider_result (a summary, **never the raw response**) ·
held_cents · id_front_path · selfie_path · upload_count · decided_at / decided_by · decision_reason ·
purge_after · files_deleted_at. **`age_check_events`** logs every step, including every photo view.

**`state_rules`**: compliance_class (or null = every product) · region · action (block · allow) · enabled ·
message (shown to the shopper). Owner-only edits.

**`blocklist_entries`**: list (block · allow; allow wins) · kind (email · phone · ip · country · state · address ·
name · customer) · value (normalised) · reason · created_by · expires_at · browse (bool) · hit_count ·
last_hit_at. Unique (list, kind, value).

**`fraud_assessments`**: order_id · score 0-100 · level · reasons jsonb `[{code, points, text}]` · signals jsonb (no
personal data) · version · decision. **`address_checks`**: address_hash · provider · verdict · suggestion.

**`checkout_attempts`**, **`rate_limits`**: velocity rows (email, IP, card BIN, outcome) and a token-bucket table.

**`chargebacks`**, **`chargeback_events`**: status, source, matched order, respond_by.

## Operations
**`admin_audit_log`**: staff id · action · area · entity_type / id / label · changes `{field: {before, after}}`
(redacted) · details · money flag. Written in the **same transaction** as the change.

**`email_sends`**: primary key = the "never twice" key (e.g. `order_confirmation:<orderId>`) · template ·
order_id · status (pending · sending · sent · logged · failed · skipped) · attempts · provider_id · content_hash.
Queued in the same transaction as the event that caused it.

**Outboxes** (`marketing_email_outbox`, `sms_outbox`, `partner_webhook_outbox`…): payload, idempotency_key,
status, attempts, next_attempt_at. See the outbox rule in `01-architecture.md`.

**`staff`**, **`staff_roles`**: auth_user_id, role, capabilities, 2FA status.
