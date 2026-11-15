export const meta = {
  name: 'html-options-reference-hunt',
  description: 'Hunt the best real reference sites from 4 sources, score each with 2 skeptical judges (this is also the judge calibration), and turn the top ones into concept briefs + seeds',
  whenToUse: 'html-design-options skill, step 5 (optional but strong). Returns scored references and ready-to-use seeds for options-pipeline.js.',
  phases: [
    { title: 'Hunt', detail: '4 hunters, each a different source' },
    { title: 'Verify', detail: '2 skeptical judges per site' },
    { title: 'Translate', detail: 'concept brief per top reference' },
  ],
}
// args: { root, brand, product, category ("beauty / haircare", "B2B packaging"...), already: "brands already captured",
//         sources: optional override [{key, task}], top: 9, swipeDir (optional) }
const A = args || {}
if (!A.root || !A.brand) throw new Error('args.root and args.brand are required')
const MK = `${A.root.replace(/\\/g, '/')}/mockups`
const SW = A.swipeDir || `${MK}/refs/screens`
const TOP = A.top || 9
const CAND = { type: 'object', properties: { candidates: { type: 'array', maxItems: 8, items: { type: 'object', properties: {
  name: { type: 'string' }, url: { type: 'string' }, shots: { type: 'string' }, why: { type: 'string' }, standout: { type: 'string' } },
  required: ['name', 'url', 'shots', 'why', 'standout'] } } }, required: ['candidates'] }
const VERD = { type: 'object', properties: { score: { type: 'number', minimum: 0, maximum: 100 }, first_screen: { type: 'number' }, craft: { type: 'number' },
  clean_not_clinical: { type: 'number' }, buy_path: { type: 'number' }, fits: { type: 'number' }, weakness: { type: 'string' } },
  required: ['score', 'first_screen', 'craft', 'clean_not_clinical', 'buy_path', 'fits', 'weakness'] }
const SEED = { type: 'object', properties: { name: { type: 'string' }, ref: { type: 'string' }, shots: { type: 'string' }, angle: { type: 'string' }, brief_path: { type: 'string' } }, required: ['name', 'ref', 'shots', 'angle', 'brief_path'] }

const SOURCES = A.sources || [
  { key: 'themes', task: `Premium Shopify (or category-standard) THEMES used by top ${A.category || ''} brands: browse the theme store, pick the best-reviewed high-end themes, capture their live demo stores and 1-2 real brands running each.` },
  { key: 'awards', task: `Award-level stores: Awwwards (e-commerce), Commerce Cream, Siteinspire, Land-book, Httpster, Godly. Pick ${A.category || ''} stores featured in the last 2 years that also SELL well (clear product + buy path), not art pieces.` },
  { key: 'category', task: `The best-designed ${A.category || 'category'} brands not yet captured. Keep only those whose homepage + product page are truly top tier.` },
  { key: 'outside', task: 'Best-in-class single-hero-product DTC outside this category whose design could carry over (e.g. Graza, Ghia, Our Place, Liquid Death, Oura, Ritual). Keep the knockout first screens and product pages.' },
]
const slugify = s => s.toLowerCase().replace(/\(.*$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)

phase('Hunt')
const scored = []
await pipeline(SOURCES,
  h => agent(`${A.brand} reference hunter (${h.key}). We sell: ${A.product}. We need the best real sites to model a homepage + product page on: instant first screen, clear buy path, real-brand craft, clean and warm (not clinical, not loud).
Source: ${h.task}
Skip brands already captured: ${A.already || '(none)'}.
Look at many, keep the 5-8 best. Capture each: homepage + main product page, 390x844 and 1280x800, above-the-fold and full page, into ${SW}/<kebab-name>/ (agent-browser --session hunt-${h.key} --idle-timeout 60m; open about:blank, set viewport, then the URL; close popups; scroll once before --full; never kill Chrome). Return only sites you captured, each with why it is top tier and the ONE standout pattern we could use.`,
    { label: `hunt:${h.key}`, phase: 'Hunt', schema: CAND }),
  (r, h) => parallel((r ? r.candidates : []).map(c => () => parallel([1, 2].map(i => () => agent(
`Skeptical reference judge #${i}. How good is this real site as a model for a ${A.brand} homepage + product page? Most good sites are 75-85; be strict.
Site: ${c.name} (${c.url}). Screenshots: ${c.shots} (read phone + desktop fold and full, home and product page).
Score 0-10: first_screen, craft, clean_not_clinical, buy_path, fits (could ${A.product} use this well). score = overall 0-100. Name its biggest weakness. Do not edit files.`,
    { label: `verify:${h.key}:${slugify(c.name)}:${i}`, phase: 'Verify', schema: VERD }))).then(vs => {
      vs = vs.filter(Boolean)
      if (!vs.length) return null
      const rec = { ...c, source: h.key, score: vs.reduce((s, v) => s + v.score, 0) / vs.length, fit: vs.reduce((s, v) => s + v.fits, 0) / vs.length, weakness: vs.map(v => v.weakness).join(' / ') }
      scored.push(rec)
      return rec
    })))
)
scored.sort((a, b) => b.score - a.score || b.fit - a.fit)
log(`${scored.length} real sites scored; best ${scored[0] ? scored[0].name + ' ' + scored[0].score : 'n/a'}`)

phase('Translate')
const top = scored.filter(s => s.fit >= 6.5).slice(0, TOP)
const seeds = (await parallel(top.map(v => () => agent(
`Turn this top-scoring real site into a ${A.brand} concept brief a builder can execute. Reference: ${v.name} (${v.url}), screenshots ${v.shots}. Why it is strong: ${v.why}. Standout: ${v.standout}. Judges' weakness note: ${v.weakness}.
Read the screenshots closely. Write ${MK}/refs/concepts/${slugify(v.name)}.md: exact patterns to lift (first-screen composition, type pairing with close Google Fonts, colour logic, section order, image treatment, the product-page buy box, micro-details), how each maps onto ${A.brand} (kit images, brand colours, tagline, proof; copy only from ${MK}/kit/content.json), what NOT to copy (its weakness, anything clinical/loud/messy), and the one thing that must be true for it to clear the bar.
Return a seed: name (2-3 words, a look not the brand name), ref, shots, angle (dense 3-5 sentence builder instruction that tells it to read the brief), brief_path.`,
  { label: `translate:${slugify(v.name)}`, phase: 'Translate', schema: SEED })))).filter(Boolean)

return { calibration: scored.map(s => ({ name: s.name, url: s.url, source: s.source, score: Math.round(s.score * 10) / 10, fit: s.fit, standout: s.standout })), seeds }
