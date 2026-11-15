# 02 · Admin design system (the "Shopify feel")

Staff should be able to sit down at this admin and feel they already know it. That comes from a small set of tokens,
one frame and about 20 primitives, built from scratch with Tailwind, shadcn/ui and lucide icons.

**Legal rule:** do not install or copy `@shopify/polaris`, `@shopify/polaris-icons`, `@shopify/polaris-tokens` or
Polaris web components. Their licences only allow building Shopify apps. Don't use Shopify's name, logo or
trademarks. Only the top-left wordmark carries the shop's brand. Everything below is our own code that follows the
same conventions.

## 1. Tokens (`apps/backend/src/app/globals.css`, Tailwind v4 `@theme`)

| Token | Value | Tailwind |
|---|---|---|
| Page background | `#f1f1f1` | `bg-background` |
| Text / secondary / disabled | `#303030` / `#616161` / `#b5b5b5` | `text-foreground`, `text-text-secondary` |
| Card | white, 12px radius, hairline bevel shadow | `bg-surface rounded-xl shadow-card` |
| Card footer / table header | `#f7f7f7` | `bg-surface-subdued` |
| Row hover / active / selected | `#f7f7f7` / `#f3f3f3` / `#f1f1f1` | `bg-surface-hover` … |
| Borders / dividers / strong | `#e3e3e3` / `#ebebeb` / `#cccccc` | `border-border` … |
| Input border | `#8a8a8a` | `border-input` |
| Links + focus ring | `#005bd3` (2px ring, 1px offset on `:focus-visible`) | `text-link` |
| Icons | `#4a4a4a` / secondary `#8a8a8a` | |
| Left nav / hover / active | `#ebebeb` / `#f1f1f1` / `#fafafa` | `bg-nav*` |
| Top bar / search field | `#1a1a1a` / `#303030` | `bg-topbar`, `bg-topbar-field` |
| Primary button | near-black `#303030`, soft bevel | `<Button>` |
| Secondary button | white with a bottom edge | `<Button variant="outline">` |
| Header-action button | 6% black fill | `<Button variant="secondary">` |
| Critical | `#c70a24` | `variant="destructive"`, `text-critical` |
| Charts 1-5 | `#0094d5` `#29845a` `#e88800` `#8051ff` `#c70a24` | |

**Badge tones** (background / text): success `#c8f6d5 / #0b4d30` · info `#d6ebff / #00466e` ·
attention `#ffeb80 / #4f4700` · warning `#ffd7a8 / #5e3d00` · critical `#fdd5d6 / #8e0b21` ·
neutral `#e3e3e3 / #4a4a4a`.

**Type:** Inter (fine for an internal tool; the storefront must not use it). Body 13/20 (`text-sm`), small 12/16,
card titles 13px weight 650, page titles 20/24 bold. `font-medium` = 550. **Inputs are 16px on phones** (iOS zooms
on anything smaller), 13px from 768px up.

**Spacing and sizes:** 4px scale. Cards `p-4`, `gap-4` apart. Page widths: default ~998px, index pages 1200px,
simple forms 662px. Buttons and inputs are 28-32px tall on desktop and 44px on phones, with
`touch-action: manipulation`.

**Radii:** 4 / 6 / 8 / 12 / 16 / 20 / 24px. **Shadows:** `shadow-card`, `-popover`, `-modal`, `-btn`, `-btn-primary`,
`-btn-pressed`.

## 2. The frame (`components/admin/frame/`)

| Part | Behaviour |
|---|---|
| Top bar | Fixed, dark, 56px + safe-area inset. Wordmark left; **search** centre (⌘K / Ctrl+K: orders by number or transaction id, customers by email, products by title, jump to any page or setting); account menu right (name, role, Settings, Log out). |
| Left nav | 240px, below the top bar from `lg`. A `NAV[]` config (`{href,label,icon,children?,match?}`); the active item is a white pill and its section's sub-pages open underneath; **Settings pinned at the bottom**. Longest-prefix match picks the active item. |
| Phone nav | Below `lg` a menu button opens a left sheet with the same nav. Tapping a link closes it and scrolls to top **inside the tap** (iOS rule). |
| Main | `max-w-[75rem]`, `lg:pl-60`, bottom padding includes the safe-area inset. A `ScrollToTop` runs on route change. |
| Not built yet | A catch-all `[...missing]` route shows "Coming soon" for nav items whose page doesn't exist, so the nav never 404s. |
| Shell | `app/(admin)/layout.tsx` calls `requireStaff()` inside `<Suspense fallback={<FrameSkeleton/>}>`, mounts the toaster, and sets `robots: noindex`. |

## 3. Primitives (`components/admin/ui/`, one barrel `index.ts`)

| Component | Purpose | Main props |
|---|---|---|
| `Page` | Every screen's frame | `title, titleMetadata (badges), subtitle, backAction{href,label}, primaryAction, secondaryActions, moreActions, pagination{previousHref,nextHref}, width default·wide·narrow` |
| `PageActions` / `MoreActionsMenu` | Header actions | `ActionDescriptor{content, href, onAction, icon, destructive, disabled, loading, menuOnly}` |
| `Layout`, `Layout.Section` | Detail grid: main 2/3 + sidebar 1/3, stacks on phones | `variant main·oneThird·fullWidth` |
| `AnnotatedSection` | Settings row: title + help left, cards right | `title, description` |
| `Card`, `CardSection`, `SummaryRow` | White card with title row, divided sections, grey footer; money rows | `title, titleBadge, description, headerAction, footer, subdued, padding default·none`; `SummaryRow{label, sub, value, strong}` |
| `IndexTable` | URL-driven list with row select, bulk actions, sortable headers, server paging | `items, columns[{id,header,cell,sortKey,align,hideOnMobile}], getId, rowHref, resourceName, promotedBulkActions, bulkActions[{content,onAction(ids),destructive}], sort, pagination{page,hasNext}, loading, emptyState` |
| `IndexFilters` | Saved-view tabs + search + filter chips + sort, all in the URL; any change resets `page` | `tabs[{id,label,params}], selectedTab, queryValue, queryPlaceholder, filters[{key,label,options}], sortOptions, sortValue` |
| `IndexTabs` | Plain link tabs with counts | `tabs[{key,label,href,count?}], active` |
| `Badge` (+ `PaymentStatusBadge`, `FulfillmentStatusBadge`, `ProductStatusBadge`, `AgeCheckBadge`) | Status pills | `tone, progress incomplete·partial·complete, icon` |
| `Button`, `ButtonGroup` | Buttons | `variant default·outline·secondary·ghost·destructive, size, asChild` |
| `Banner` | Page/card message | `tone info·success·warning·attention·critical, title, action, onDismiss` |
| `Modal` | Dialog with title bar and footer | `open, onClose, title, primaryAction, secondaryActions, size small 380·medium 620·large 980` |
| `ConfirmAction` | Are-you-sure that runs a server action, toasts, refreshes; can require a typed reason | `label, title, description, confirmLabel, run(reason), destructive, reasonLabel` |
| `ContextualSaveBar` | Unsaved-changes bar over the top bar; `beforeunload` warning | `dirty, saving, onSave, onDiscard, message` |
| `EmptyState` | Friendly empty state; separate copy for "no results for these filters" vs "nothing yet" | `heading, icon, action, secondaryAction, compact` |
| `Thumbnail` | Square image with placeholder | `src, alt, size 24·40·60·80` |
| `Text` | Type styles | `variant headingXl…bodySm, tone, numeric, truncate` |
| `Timeline` | Comment box + events grouped by day | `events[{id,at,content,author,kind event·comment}], onComment` |
| `DescriptionList` | Label/value pairs | `items[{term,description}]` |
| `Skeleton*` | Loading placeholders | `SkeletonPage{variant detail·index}`, `SkeletonCard`, `SkeletonBodyText` |
| `Pagination` | ‹ › pager (newer/older record on detail pages) | `previousHref, nextHref` |
| `toast` / `AdminToaster` | Dark toast, red on error (sonner) | `toast.success`, `toast.error` |

## 4. Page anatomies (build every screen from one of these)

**List page** (Orders, Customers, Products…)
```
Page (width wide) — title · primary action (Create order) · secondary (Export)
└ Card padding=none
  ├ IndexFilters — tabs with counts · search · filter chips · sort      (all state in the URL)
  └ IndexTable  — first column = bold link with the phone facts stacked under it;
                  other columns hideOnMobile · bulk actions · ‹ › paging by hasNext (no COUNT(*) on big tables)
```
Wrapped in `<Suspense fallback={<SkeletonPage variant="index" width="wide"/>}>`.

**Detail page** (an order, a customer)
```
Page — ‹ back · title + status badges · subtitle (date · source) · actions · ‹ › newer/older
Banners (on hold, cancelled, age check pending…)
Layout
├ main (2/3): the working cards (items/fulfilment, payment, …) → Timeline last
└ sidebar (1/3): notes · contact · addresses · tags · risk/age cards · editors (ContextualSaveBar when dirty)
```
Validate the id with zod first; unknown → `notFound()`.

**Settings**
`/settings` is one card listing rows (icon, title, one-line description, status badge, chevron). Each sub-page is
`Page backAction=Settings` + `AnnotatedSection` blocks. A shared `useSettingsForm` hook: values, dirty, discard,
save → server action → toast → field errors → `router.refresh()`. Staff without permission see an info banner and a
read-only form.

## 5. Behaviour rules
- Every action shows a toast (success or the error message). Every destructive action asks first (`ConfirmAction`
  or a destructive modal action); money and cancel actions require a typed reason.
- Plain-English labels and help text. Staff are not developers.
- Lists are server-paged and URL-driven so a filtered view can be bookmarked and shared.
- Each admin screen is checked at 1440 and 390 wide before it ships (the playbook's `design-reviewer`).
