# Quality: how to make these look like a real brand

Drawn from 29 options on the first run, ~700 judge fixes and 37 head-to-head decisions. Put the relevant parts into the
BRIEF and the builder prompts. Builders that skip the screenshots produce templates.

## What separated the winners
1. **Build the brand system out of the product's own facts.** #1 turned the shade numbers (#2 #3 #5...) into the
   whole visual language: huge numerals, mono names, the product lineup on a floor sweep. Judges called it "the most
   ownable idea on the board". Ask: what does this product already have (numbers, colours, a shape, a ritual) that
   could carry the design?
2. **Warmth beats cleanliness.** #2 (from Our Place) won all its matchups: cream and sand paper, a light editorial
   serif, an in-use photo hero, one action colour. "Clean" with lots of white reads clinical; warm neutrals plus
   real texture read like a brand.
3. **The product range as the hero.** #3 put all variants in one stack in the first screen; the range is the story.
4. **The second page decides close matchups.** Again and again a matchup went to "B has the better phone shop
   page". Fit the whole buy decision on one 390x844 screen: gallery, title + rating, variant swatches, size options
   with the price inside them, one full-width button carrying the live total.
5. **One accent colour, used only for things you tap.** Brand blue on buttons and selected states only; chrome in
   ink. Options that flooded sections with the brand colour got "too loud".
6. **Each option is a different brand world, not a recolour.** Change at least four of: layout skeleton, type
   pairing, palette, image treatment, button shape, section rhythm. Same skeleton + new colours gets flagged as a
   near-duplicate and dropped.

## Phone first screen (390x844), checked on every option
- The real product, large and readable (crop it so the logo/label isn't cut: "YEGO" got flagged).
- The message in one glance (tagline or plain-language headline + one line of what it is).
- One clear button. Rating line under it is fine. No second competing button.
- Nothing important behind a slider or ticker; tickers slow, pausable, stop on reduced motion.

## Common judge fixes (most frequent first) - pre-empt them in the brief
- **Hero/fold problems**: product too small, cropped, muddy colour grade turning a white pack tan; headline wraps
  badly; important content just below the fold.
- **Desktop dead space**: empty columns beside a gallery (make the gallery sticky), giant gaps between sections.
- **Too loud**: several saturated full-bleed bands in a row, condensed caps everywhere, tilted stickers on price rows
  (keep tilt for playful spots, never at the money decision).
- **Template tells**: every section a rounded bordered card stack; "dark boxed cards with number tiles"; identical
  review cards. Use open columns, rules, image-led rows instead.
- **Overused mono/typewriter fonts** at 11-13px for buttons, prices and FAQ: hard to read, "deli receipt". Mono only for
  tiny labels.
- **Phone carousels**: arrows on top of products, cards cutting words mid-line, 2x3 grids that run 900px tall (use
  one sideways row of shorter tiles).
- **Overlaps**: translucent cards over product images, badges covering faces in review collages, text over pack copy.
- **Brand fit too weak**: tagline only as a tiny eyebrow; product colours appear only far down the page. Put the
  variant row under the hero button.
- **Mismatched state**: the selected variant says #3 but the photo shows other variants.
- **Repeated proof**: the same rating block three times; repeated subhead pills.

## Section craft
- Spacing system: sections ~48-72px desktop, ~40-56px phone; tight and intentional, never empty white.
- 5-7 homepage sections, each with a visual and a sharp line: results/proof, the range, how it works (3 steps),
  reviews, short FAQ, a final buy block.
- Type: one display face + one text face (+ optional mono for micro labels). Close Google Fonts matches for the
  reference's type are fine (Newsreader, Fraunces, Bodoni Moda, Archivo, Bricolage Grotesque, Figtree, Inter...).
- Images: real product renders for the product, always. Scenes/people may be AI (max ~4-8 per option, generated
  empty of the product, then the real cut-out composited by CSS or in the image). People: different poses, product
  not in hands, ages matching the buyer.
- Before/after: label pairs, keep both faces the same size, never the product in the photo.
- Reviews: varied layout (one big quote + list, masonry wall), name + variant + verified tag; never a box covering
  a face.
- Footer: compact, wordmark, the essential links, legal line.

## The second page (shop/product) checklist
Gallery (big, thumbnails under on desktop, dots on phone) / title / rating linked to reviews / variant label with
the chosen name / swatches with the code on them / one-line help ("in between two? pick the lighter one") / size
options as rows or tiles with price and Save badge inside, best value preselected / one full-width button whose
label updates ("Get 16 pouches · $49") / small reassurance line / bullets / accordions (how to use, what's inside,
shipping) / results / reviews / FAQ / sticky buy bar on phone that appears on scroll down.

## Content discipline (hard)
- Only content.json copy; judges trace every claim. Nav labels and section titles may be new; claims may not.
- No captions saying AI, concept, sample, placeholder, "replace with".
- No duplicate price line under the rating if the size picker shows prices.
- Banned words list in the brief and in capture.sh.

## Mobile rules (gate + brief)
No sideways scroll at 360-390; tap targets >= 44px; inputs >= 16px; `min-h-svh` not `100vh`; `touch-action:
manipulation` on buttons; images `loading="eager"` with sizes so screenshots and layout are stable; long strings
(`break-words`) never push the page wide.
