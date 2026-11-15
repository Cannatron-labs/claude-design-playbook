# {{BRAND}} HTML options: builder brief

You build ONE design direction as static pages in `mockups/options/<slug>/`: `index.html` (homepage) and
`{{PAGE2_FILE}}` ({{PAGE2_NAME}}). The team picks winners from these; the winner is later rebuilt in {{REAL_STACK}}.
Speed matters, quality matters more: it must look like a real brand's live site.

## Stack
- Plain HTML + Tailwind v4 browser build: `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>`
  (theme via `<style type="text/tailwindcss">@theme { ... }</style>`). Google Fonts `<link>`s. A little vanilla JS
  is fine (variant switcher, size picker, accordions, gallery, sticky bar). No frameworks, no build step.
- Link the pages to each other (logo -> index.html, buy buttons -> {{PAGE2_FILE}}).
- Images: `../../kit/img/...` (list: `mockups/kit/images.txt`); every `<img loading="eager">` with width/height or
  an aspect class. New images only if the direction truly needs them (max 4; lifestyle directions max 8), saved to
  `options/<slug>/img/`. Never an AI image of the product with text on it; use the kit renders for the product.
  People: varied poses, product not in hands{{PEOPLE_RULES}}.

## Content (hard rules)
- Copy ONLY from `mockups/kit/content.json`. You may shorten or pick lines, never add claims, numbers, times,
  ingredients or prices. Prices: {{PRICES}}.
- Banned words: {{BANNED}}.
- No captions or labels saying AI, concept, sample, placeholder or "replace with".
- Logo = {{LOGO_RULE}}, marked `data-logo` on its wrapper.

## Homepage must
- Phone first screen (390x844): the product, the message ({{MESSAGE}}) and ONE clear button, without scrolling.
  Desktop first screen the same.
- 5-7 sections, each designed (no filler): {{HOME_SECTIONS}}. Order and form follow your direction.
- Simple, bold, clear. Product over people (unless your direction is people-led).

## {{PAGE2_NAME}} must
{{PAGE2_MUST}}
{{FIXED_STRUCTURE}}

## Mobile rules
No horizontal scroll at 360-390px. Tap targets >= 44px. Inputs >= 16px. `min-h-svh`, never `100vh`. Buttons get
`touch-action: manipulation`. `break-words` on long strings.

## What the client rejected before (do not repeat)
{{REJECTED}}
Every option must feel like its own brand world (layout, type, palette, imagery, button shape), spacing tight and
intentional, every section finished.

## Deliver
1. `index.html`, `{{PAGE2_FILE}}` (and `img/` if you generated any).
2. `NOTES.md`: direction name (2-3 words), a clean 2-sentence pitch (no file paths), the reference brand(s) and the
   exact pattern taken from each with the screenshot path you looked at, fonts, palette hexes.
3. Run `bash mockups/tools/capture.sh <slug> <your-capture-session>` (static server on 127.0.0.1:4100 is running),
   READ the 8 screenshots in `mockups/shots/<slug>/`, fix what looks wrong or unfinished, capture again. `gate.json`
   `_pass` must be true. You do not score your own work.
