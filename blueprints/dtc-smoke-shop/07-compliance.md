# 07 · Smoke-shop compliance (what makes this different from any other store)

> **This file describes mechanisms, not legal advice.** Tobacco, vape and hemp rules differ by state and change
> often. Every rule below marked `[VERIFY]` must be confirmed with the shop's lawyer and payment provider before
> launch, and the answers recorded in the project's `CLAUDE.md` (confirmed facts) and `ops/decisions.md`. Build the
> system so each rule is a **setting staff can change**, not code.

## 1. What the shop sells decides the rules
Give every product a **`compliance_class`** and pick rules per class, never per product:

| Class (example) | Typical products | Why it matters |
|---|---|---|
| `nicotine_vape` | e-liquids, disposables, pods | Most regulated: age, shipping, excise tax, flavour bans `[VERIFY: per state]` |
| `tobacco` | cigars, pipe tobacco, papers sold with tobacco | Excise tax, age `[VERIFY]` |
| `hemp` | hemp-derived products | Federal and state hemp rules are changing; some states ban some products `[VERIFY: current federal hemp definition and each target state]` |
| `device` | batteries, vaporisers, dry-herb devices | Some carriers/states restrict batteries or devices `[VERIFY]` |
| `accessory` | glass, grinders, rolling trays, apparel | Usually least restricted; still 21+ site-wide |

Products also get `excise_tax_class` (which state excise rules apply) and `requires_adult_signature`.

## 2. Age: 21+ everywhere, three layers
1. **Entry gate** on the storefront (`06-storefront.md`): date of birth, cookie for 30 days. It is a courtesy, not
   proof.
2. **Checkout:** date of birth + "I am 21 or older" + terms, all required by the API. Under 21 by date of birth →
   no order is created. Age is computed in the shop's home time zone.
3. **Verification at Place order** (after the fraud gate). The first rule that passes wins:
   1. Feature off → date of birth + attestation only (recorded).
   2. **Returning verified customer**: same email, name, date of birth and address as an earlier verified pass,
      newer than the re-check interval (setting, e.g. 12 months).
   3. **Database check** through an age-verification provider: match + 21+ passes; match + under 21 blocks; no
      match or a timeout → photo ID.
   4. **Photo ID:** the order is placed and paid but **held** (`age_check_pending`) and never sent to fulfilment.
      The customer uploads an ID (and optional selfie) on their order page. Staff approve or deny in Customers → Age
      verification. Deny → Finance cancels and refunds; the customer is emailed.
- A provider error never blocks a real customer **and never lets anyone through**: it falls to the next step.
- Settings: always-ID states, re-check interval, photo retention days (an hourly job purges files N days after the
  decision; the check row stays as the record of the sale).
- **At delivery:** many rules require an adult (21+) signature for vape deliveries `[VERIFY: PACT Act requirements
  for the shop's products and carriers]`. States or products that need it add an `adult-signature` tag that the
  warehouse and shipping-label step must honour.
- Store as little as possible: date of birth on the order and the check, never in logs; ID photos only in a private
  bucket, viewed through 60-second signed links, every view logged.

## 3. Where you can ship: state rules
- `state_rules` (class or all products × state → block/allow + the message the shopper sees), owner-only, switchable.
- Enforced in three places: the cart (each line's `problem` text), checkout (refuse before payment) and the product
  page ("can't ship to your state" once the shopper's state is known).
- Carriers: many national carriers and the postal service restrict shipping vape products to consumers
  `[VERIFY: which carriers and services the shop's products can legally use, and any carrier contract terms]`.
  Shipping methods therefore come from the rate table per class, not one global list.
- Remote-seller registration and reporting duties for vape/tobacco may apply (the federal PACT Act and state
  equivalents) `[VERIFY with counsel: registration, monthly reports to states, tax collection]`. Build a monthly
  **sales-by-state-by-class report** from day one so these reports are a download, not a project.

## 4. Taxes
- Sales tax per jurisdiction from a tax provider; provider down → checkout stops.
- **State excise / vape / tobacco taxes on top**, as admin settings per state (Settings → Taxes), two rule shapes:
  - **additive:** X% of the line on top of sales tax;
  - **top-up:** the line's total tax becomes Y%, so add Y% minus the sales tax already charged.
  - Some states tax per unit or per millilitre instead of a percentage `[VERIFY per state]`; keep the rule shape
    extensible (`percent`, `per_unit`, `per_ml`).
- Applied to the line price after discounts, rounded half-up per line; never to shipping or gift cards; US only.
- Stored as its own `excise` level in each line's `tax_breakdown`, so totals still reconcile to the cent; refunded in
  proportion to the line.
- **Fail closed:** if the rules or product flags can't be read, checkout stops.

## 5. Payments
- Many mainstream processors don't accept vape or tobacco merchants `[VERIFY: each processor's current restricted
  business list for the shop's exact products]`. Plan for a **high-risk merchant account** behind a card gateway,
  plus optionally a buy-now-pay-later provider that accepts the category, and a **backup merchant account**, because
  these accounts do get closed.
- Card data never touches our servers: the gateway's browser library returns a one-time token.
- Store AVS and CVV results, last 4, auth code. Full refund before settlement = void; otherwise refund.
- Safety: `pending` payment row before the charge; idempotency key on every Pay press; never auto-cancel an order
  once a charge was attempted (tag `payment-check` and alert staff); nothing is confirmed, emailed or shipped until
  the money is captured.

## 6. Fraud and abuse
- **Before payment:** blocklist (email/@domain, phone, IP/CIDR, country, US state, address, name), velocity limits
  (per email, IP, card BIN, cart), CAPTCHA after declines.
- **At "paid":** a rule-weighted score 0-100 with plain-English reasons (AVS/CVV, IP vs ship-to distance,
  VPN/datacenter, billing vs shipping, disposable email, first-order size, expedited shipping on a first order, gift
  cards on a first order, prior fraud or chargebacks, shared phone/IP/address with fraud, forwarders, mailbox stores,
  failed card attempts, address-check verdict, **recent under-21 attempts**). Weights are versioned; change one →
  bump the version and back-test.
  - High (≥ 60): paid but held, tagged `For review`, staff alerted. Medium (≥ 35): tagged, still ships. A blocklist
    hit is always High.
  - If scoring fails, the order is held and staff are told (configurable).
- Held orders show the customer only "Processing"; no hold email.

## 7. Marketing and content
- No health, cessation or safety claims about nicotine, vape or hemp products `[VERIFY: FDA rules on modified-risk
  claims and state rules]`. The copywriter agent treats any such claim as a banned claim.
- Required warning statements on product pages and packaging photos (e.g. the nicotine addictiveness warning)
  `[VERIFY: exact wording, size and placement rules for web listings]`. Keep warnings as product content the API
  returns, so they're managed in the admin, not hard-coded.
- Flavour restrictions in some states and cities `[VERIFY]` → a `state_rules` row per restricted class.
- Ad platforms restrict tobacco and vape advertising `[VERIFY each platform's policy]`; email and SMS marketing
  still need explicit, separate, unticked opt-ins, with the time and source stored.
- The storefront's FAQ and JSON-LD must follow the same claim rules.

## 8. Records
- Every order keeps: date of birth given, 21+ attested at, terms accepted at, age-check method and result, ship-to
  state, compliance classes sold, excise collected per state. These are the inputs to every report a regulator or
  processor will ask for.
- Audit log on every staff change to rules, taxes, age settings and holds.
