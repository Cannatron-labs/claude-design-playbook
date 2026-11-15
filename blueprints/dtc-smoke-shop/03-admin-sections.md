# 03 · Admin sections: customers, orders and the rest

Every screen uses the anatomies in `02-admin-design-system.md`. Customers and Orders are spelled out in full because
they are where staff spend their day; the other sections are listed with one line each so the nav is complete from
day one (unbuilt pages show "Coming soon").

## Left nav

| Item | Sub-pages | What it's for |
|---|---|---|
| Home | | Today: orders to fulfil, on hold, age checks waiting, fraud reviews, recent changes |
| **Orders** | Drafts · Abandoned checkouts · Fraud review · Chargebacks | Everything about an order after "Pay" |
| Products | Collections · Inventory · Back in stock · Gift cards | Catalog, stock, collections (manual and rule-based), restock sign-ups |
| **Customers** | Age verification · Segments | People, their orders, balances, consent and age checks |
| Content | Pages · Blog posts · Menus · Files · FAQs · Redirects | Draft → preview → publish; 301 redirects with chain/loop checks |
| Analytics | Reports · Live view | First-party events rolled up daily; CSV reports |
| Marketing | Campaigns | Scheduled sales: prices, discounts and content switched together and reverted at the end |
| Discounts | | Codes and automatic rules, bulk codes |
| Online Store | Themes · Customize | Section editor with live storefront preview |
| Apps | Workflows · Reviews · Loyalty · SMS · Email platform · Delivery tracking | Each optional; add when needed |
| Settings | (hub, pinned at the bottom) | See the end of this file |

---

## Customers

### List (`/customers`)
- **Header:** Add customer (primary), Import, Export (needs `data.export`).
- **Columns:** Customer (name, email or phone under it) · Email subscription badge (Subscribed / Pending /
  Unsubscribed / Not subscribed) · Location (default address city, state) · Orders · Amount spent (paid minus
  refunds) · Age verified badge.
- **Search, one box:** exact email, phone (several spellings tried) or id via index first; otherwise a trigram
  "contains" on name, email and phone digits (min 3 characters, ranked, capped). With no search, show the people who
  ordered most recently. Every list query runs with a short statement timeout.
- **Tabs (saved views, add when the list grows):** All · Subscribed · Repeat buyers · Blocked · Needs age check.
- Bulk work (big imports/exports) runs as background jobs, not in the table.

### Detail (`/customers/[id]`)
**Header:** name · "Customer since … · N orders · $ spent" · badges (Blocked, Fraud, Chargeback, Account off, Age
verified) · actions: Issue gift card, Adjust store credit, Block (tick email and/or phone, reason required).

| Main column | Sidebar |
|---|---|
| **Orders**: 25 per page, guest orders with the same email included; each row: number, date, payment + fulfilment badges, on-hold pill, total, refunded | **Contact**: name, email, phone (edit in a dialog), "has signed in", email-change history |
| **Store credit & gift cards**: balances, card list (last 4, status), ledger history (reason, who, note, order); Adjust dialog with signed amount, required reason, never below zero | **Marketing**: email and SMS, each with status, when it changed, where it came from. **Staff can only unsubscribe, never subscribe.** |
| **Loyalty** (if used): points, tier, history | **Age verification**: status, method, date, link to the check |
| **Activity**: this customer's slice of the audit log | **Notes & tags**: tags, staff-only note, birthday, with a save bar. System tags need a capability |
| | **Addresses**: add, edit, delete, make default; exactly one default; changing an address never changes past orders |

### Rules
- **Every order is on a customer.** Checkout, staff orders and renewals find or create a customer by email (a new one
  starts Not subscribed and is sent nothing). But an order linked only by a typed email **does not borrow account
  trust**: no store credit spending, no age-verified status, no fraud history, no tax exemption. Those need the
  signed-in account.
- **Email change:** unique, case-insensitive; staff addresses refused; the customer's sign-in link is dropped and
  re-made when they sign in with a code sent to the new address; customers with money on the account need Finance
  to change it; optionally move that email's guest orders over; everything audited with emails masked in the log.
- **Plan for later:** merge customers, privacy deletion and data-export requests, segments.

### Age verification (`/customers/age-verification`)
- Tabs: Needs review · Waiting for ID · Approved · Denied · Passed at checkout · Blocked · All.
- Detail: what the customer typed vs the ID photos (60-second private links; every view logged), Approve (releases
  the order hold) or Deny (keeps the hold, alerts Finance to cancel and refund, emails the customer). Nobody approves
  their own order. Names and dates of birth are masked for staff without the personal-data capability.
- Dashboard: checks per day, pass/fail/waiting rates, by method and by state, review time, money on hold.

---

## Orders

### List (`/orders`)
- **Header:** Create order (→ Drafts), Export (current view as CSV; large exports run as a background job).
- **Tabs with counts.** All filters, tab counts and the export share **one** SQL definition so they can't disagree.

| Tab | Means |
|---|---|
| All | everything |
| Unfulfilled | paid (or later), not cancelled/archived, not fully shipped; on-hold and partly shipped count |
| Unpaid | awaiting payment |
| On hold | held by fraud score, age check, staff or stock |
| Open | not archived |
| Archived | completed, cancelled, refunded |
| Waiting on a payment check | a charge was sent but the answer was lost |

- **Columns:** checkbox · Order · Date (relative) · Customer · Channel · Total · Payment badge · Fulfilment badge (+
  On hold) · Items ("3 items" popover: photo, name, option, SKU, qty; loads on open) · Delivery method · Tags (3, then
  +N).
- **Filters (chips):** payment status · fulfilment status · delivery status (problem, out for delivery, delivered…)
  · tagged with · date range in store-local time · `?customer=<id>` as a removable chip.
- **Sort:** newest (default), oldest, total high/low (only when the filters leave a manageable number of rows).
- **Search:** order number, payment transaction id, exact email, exact phone, then name/email contains.
- **Paging:** 50 per page by `hasNext`; counts capped ("5,000+") so big tables never run a slow COUNT.
- **Bulk:** Add tags · Remove tags · Archive · Print packing slips (up to 50).

### Detail (`/orders/[id]`)
**Header:** `#1042` · badges (payment, fulfilment, On hold, Cancelled, Fraud, Chargeback) · placed date and channel
· ‹ › newer/older · **Refund** · **Print** (packing slip, no prices) · **More actions**: Cancel order, Archive, Put
on hold / Release, Mark as fraud (optionally block email/phone/IP), Resend confirmation.

**Banners** for anything that needs a person: payment check needed, age check pending, fraud hold, refund still
being recorded.

| Main column | Sidebar |
|---|---|
| **Unfulfilled** card: lines (image, title, variant, SKU, qty × price, discount); **Mark as fulfilled** (part or all, carrier, tracking, "send shipping email"); refuses when unpaid or held, with an override tick | **Notes** (the customer's note) |
| One **Fulfilled** card per shipment: date, carrier, tracking link, lines | **Additional details**: terms accepted at, 21+ confirmed at, date of birth given, marketing choices at checkout, age-check status |
| **Delivery tracking**: carrier status and scans | **Customer**: link · "N orders" (opens the list filtered to them) · contact · shipping address with copy button and an edit pencil (only before anything ships, same checks as checkout) · billing address or "same as shipping" |
| **Payment**: subtotal, discount (codes), shipping, taxes (expand: sales tax vs state vape excise), total; **paid by** tender (card last 4, BNPL, gift card, store credit); refunded; net. Expandable **Transactions** table: time, kind, gateway, status with the decline reason in words, amount, card, transaction id, AVS/CVV | **Order risk**: Low / Medium / High with plain-English reasons, AVS and CVV verdicts, address-check result, IP, hold reasons, Approve / Cancel buttons |
| **Timeline**: comment box, then events grouped by day, newest first, each with who did it (staff name, Checkout, Background job, Webhook, carrier) | **Tags** |
| **Activity**: the audit-log slice for this order | **Fulfilment partner** card (if a 3PL is used): sync status, retry |

### Actions (each checks a capability, writes an `order_events` row and an audit row)
- **Refund page** (its own screen, the familiar shape): per-line quantity steppers, restock tick, shipping refund,
  extra goodwill amount (never refunds tax), reason, "notify customer", or "refund as store credit instead" (capped at
  what was paid). The maths lives in `packages/core/refunds.ts`: each line's net and tax shared out by quantity, the
  last unit takes the remainder, card/BNPL first then gift cards, never more than what's left. Pressing twice never
  refunds twice.
- **Cancel**: only if nothing shipped. Voids or refunds the payment, releases stock and the discount usage, returns
  gift-card spend; optional store credit; customer-facing reason + staff reason.
- **Hold / release**, **mark as fraud**, **confirm payment** (for a lost gateway answer), **resend confirmation**,
  **notes / tags / comments**, **archive**.
- Later: returns (request → approve → refund + restock) and order editing before fulfilment.

### Order states
A hard state machine (`packages/core/order-state.ts`): `draft → placed → awaiting_payment → paid → fulfilled →
completed`, plus `cancelled`, `refunded`, `partially_refunded` (and a `sent_to_3pl / send_failed` pair if a
fulfilment partner is used). `transition()` throws on an illegal move; cancelled and refunded are terminal;
completed can still be refunded. Separate dimensions, not states: `on_hold` + `hold_reasons[]`
(`fraud_score_high`, `age_check_pending`, `avs_mismatch`, `staff`, `no_stock`…) and tags (`payment-check`,
`For review`, `fraud`, `chargeback`, `adult-signature`). Badges are derived from the money and shipments, so the
badge can say "Partially refunded" while the state is still `paid`.

### Drafts (`/orders/drafts`)
Statuses: open · invoice sent · completed · cancelled. Lines are catalog items (always priced by the server) or
custom items (price + taxable flag; custom items hold the order until Finance releases it). Shipping from the table or
custom; one discount (code, or manual % / amount with a reason; above a cap needs Finance). Buttons: Save · **Send
invoice** (signed link to the real checkout with a locked cart, so age and payment checks still run) · **Mark as
paid** (cash/other, needs a 21+ confirmation tick, Finance only).

### Abandoned checkouts
A cart with an email, not converted, idle ≥ 1 hour (selectable). Tabs: All · Not recovered · Recovered. Detail:
re-priced lines and a timeline (link copied, email sent, link opened, recovering order). Recovery: a copy link
(signed, only the hash stored) and a rate-limited email **only to shoppers who said yes to marketing**.

### Fraud review
Queue: Needs review · On hold · High risk · All scored. Approve (releases to fulfilment) or Cancel and refund
(optionally block the buyer).

### Chargebacks
One list of disputes: status (needs review, open, fighting, accepted, won, lost), respond-by date, matched order,
printable evidence; add by hand, by CSV or from forwarded dispute emails.

---

## Settings hub
| Page | Covers |
|---|---|
| Store details | Name, currency, time zone, order number format |
| Users and permissions | Invite staff (one-time link + 2FA); roles Owner / Finance / Merch / Warehouse / Support |
| Shipping and delivery | Rates (zone, price, subtotal bands, free-shipping threshold), **state rules** (`07-compliance.md`), adult-signature states |
| Payments | Gateway and BNPL status, webhook setup |
| Taxes | Provider status, states where tax is collected, **state vape/tobacco excise rules** (Owner/Finance) |
| Age verification | On/off, methods, re-check interval, photo retention days, always-ID states |
| Fraud and address check | Thresholds, hold medium risk, auto-cancel high, disposable domains, address-check strictness |
| Security | Block and allow lists (email, phone, IP, country, state, address, name), import/export, website browsing switch |
| Notifications | Every customer email (edit wording, preview, test, publish), staff alert lists, sent log with Retry |
| Website maintenance | Storefront "back soon" switch with a staff bypass |
| Policies | Links to the policy pages in Content |
| Activity log | Filterable audit log; money rows for Owner/Finance only |
