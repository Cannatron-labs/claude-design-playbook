export const meta = {
  name: 'html-options-pipeline',
  description: 'Build many homepage + second-page HTML options from real brand references, gate + 3-judge score each, director waves until dry, pairwise-rank the keepers',
  whenToUse: 'html-design-options skill, step 6. Pass args (see process.md). Does not publish; the main session publishes the returned ranking.',
  phases: [
    { title: 'Research', detail: 'scouts capture new references; their directions go straight to build' },
    { title: 'Build', detail: 'one builder per direction (static HTML + Tailwind)' },
    { title: 'Gate', detail: 'capture.sh screenshots + hard gates' },
    { title: 'Judge', detail: '3 independent judges, median per criterion' },
    { title: 'Revise', detail: 'one bold fix round for 65-79' },
    { title: 'Direct', detail: 'director proposes gap-filling directions' },
    { title: 'Rank', detail: 'pairwise tournament -> Elo' },
  ],
}

// ---------- args ----------
// { root, brand, product, rubric, cap=30, startAt=1, seeds=[{name,ref,shots,angle}], scouts=[{key,brands}],
//   rejected, kept=[{slug,name,score}], judgeAgent (optional agent type), swipeDir (optional), keepBar=80 }
const A = args || {}
if (!A.root || !A.brand || !A.rubric) throw new Error('args.root, args.brand and args.rubric are required')
const R = A.root.replace(/\\/g, '/')
const MK = `${R}/mockups`
const SW = A.swipeDir || `${MK}/refs/screens`
const CAP = A.cap || 30
const BAR = A.keepBar || 80
const JT = A.judgeAgent ? { agentType: A.judgeAgent } : {}
const W = { first_screen: 20, real_brand_craft: 25, clean_simple: 15, brand_fit: 10, second_page: 15, research_grounding: 5, distinct: 10 }
const CRIT = Object.keys(W)

// ---------- schemas ----------
const BUILD = { type: 'object', properties: { slug: { type: 'string' }, name: { type: 'string' }, pitch: { type: 'string' }, reference: { type: 'string' },
  fonts: { type: 'string' }, palette: { type: 'array', items: { type: 'string' } } }, required: ['slug', 'name', 'pitch', 'reference', 'palette'] }
const GATE = { type: 'object', properties: { pass: { type: 'boolean' }, fails: { type: 'array', items: { type: 'string' } } }, required: ['pass', 'fails'] }
const sp = {}
CRIT.forEach(c => { sp[c] = { type: 'number', minimum: 0, maximum: 10 } })
const JUDGE = { type: 'object', properties: { scores: { type: 'object', properties: sp, required: CRIT },
  invented_copy: { type: 'array', items: { type: 'string' } }, near_duplicate_of: { type: ['string', 'null'] },
  strength: { type: 'string' }, fixes: { type: 'array', items: { type: 'string' }, maxItems: 5 } },
  required: ['scores', 'invented_copy', 'near_duplicate_of', 'strength', 'fixes'] }
const DIR = { type: 'object', properties: { name: { type: 'string' }, ref: { type: 'string' }, shots: { type: 'string' }, angle: { type: 'string' } }, required: ['name', 'ref', 'shots', 'angle'] }
const DIRS = { type: 'object', properties: { directions: { type: 'array', items: DIR, maxItems: 6 }, reason: { type: 'string' } }, required: ['directions', 'reason'] }
const MATCH = { type: 'object', properties: { winner: { type: 'string', enum: ['A', 'B'] }, margin: { type: 'integer', minimum: 1, maximum: 3 }, reason: { type: 'string' } }, required: ['winner', 'margin', 'reason'] }

// ---------- state ----------
const all = (A.kept || []).map(k => ({ ...k, status: 'kept', carried: true }))
let n = (A.startAt || 1) - 1
const kebab = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 24)
const median = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] }
const kept = () => all.filter(o => o.status === 'kept').sort((a, b) => b.score - a.score)
const good = j => j.score >= BAR && j.floorOk && !j.invented.length

const capture = (slug, phase) => agent(`Run exactly this in bash and return its last printed JSON line as {pass, fails}: bash ${MK}/tools/capture.sh ${slug} cap-${slug}
(The static server on 127.0.0.1:4100 is running. Do not edit files.)`, { label: `gate:${slug}`, phase, schema: GATE, model: 'haiku', effort: 'low' })

const LENSES = [
  ['brand creative director', 'You judge craft first: typography, spacing, image use, finish. Would the creative director of the best brand in this category ship this?'],
  ['DTC conversion lead', 'You judge the buy path first: phone first screen clarity, one clear button, the second page decision on one screen, proof placement.'],
  ["the client's team", `You judge like the client's team. They rejected: ${A.rejected || 'too loud; too plain; messy; clinical white space; all look the same'}. You also judge distinctness against the kept board.`],
]

async function judge(o, phase, tag) {
  const board = kept().filter(k => k.slug !== o.slug).map(k => `${k.slug}: ${MK}/shots/${k.slug}/ (first-page 390 and 1280 fold)`).join('\n') || '(none kept yet)'
  const votes = (await parallel(LENSES.map(([who, how], i) => () => agent(
`Independent QA judge (${who}) for ${A.brand}. ${how}
Calibration: the best real sites in this kind of category score about 79-81 on this rubric, so ${BAR} means "as good as a top brand's live site". Do not inflate.
Score the HTML option "${o.slug}" against ${A.rubric} (read it; anchors 0/5/8/10; any 9+ must name the reference it matches).
Evidence: all 8 screenshots in ${MK}/shots/${o.slug}/ (both pages, 390 and 1280, fold and full), gate.json there, the HTML in ${MK}/options/${o.slug}/, NOTES.md, and the reference screenshots it names.
Copy check: list any sentence that is NOT from ${MK}/kit/content.json and makes a claim (invented_copy). Nav labels and section titles are fine.
Distinct: set near_duplicate_of to a kept slug only if it is the same look (layout + type + colour mood), else null. Kept board:
${board}
Do not edit files. Return strength (one plain sentence) and up to 5 concrete fixes (file + element + change), most important first.`,
    { label: `${tag}:${o.slug}:${i + 1}`, phase, schema: JUDGE, ...JT })))).filter(Boolean)
  if (!votes.length) return null
  const med = {}
  CRIT.forEach(c => { med[c] = median(votes.map(v => v.scores[c])) })
  const dups = votes.map(v => v.near_duplicate_of).filter(Boolean)
  return { med, score: Math.round(CRIT.reduce((s, c) => s + W[c] * med[c], 0) / 10), floorOk: CRIT.every(c => med[c] >= 6),
    invented: [...new Set(votes.flatMap(v => v.invented_copy))], dup: dups.length >= 2 ? dups[0] : null,
    why: votes.map(v => v.strength).sort((a, b) => a.length - b.length)[0], fixes: votes.flatMap(v => v.fixes.slice(0, 3)) }
}

function builderPrompt(d, slug) {
  return `You are building one ${A.brand} design direction. Read ${MK}/BRIEF.md and follow it exactly (it is the contract).
Product: ${A.product || '(see content.json)'}
Slug: ${slug}  (folder ${MK}/options/${slug}/)
Direction: ${d.name}
Reference: ${d.ref}
Reference screenshots: ${d.shots}  - READ the phone and desktop fold + full images before designing; name the patterns you take in NOTES.md. If the folder is empty, capture the reference yourself (390x844 and 1280x800, fold + full, home + main product page) into ${SW}/<brand>/.
What to take: ${d.angle}
Fixed structures to keep (restyled): ${MK}/kit/ref/ (read every image there).
Copy: ${MK}/kit/content.json only. Images: ${MK}/kit/images.txt.
Browser: agent-browser --session b-${slug} --idle-timeout 60m (never kill Chrome). Capture: bash ${MK}/tools/capture.sh ${slug} cap-${slug}
The bar is a top brand's live site, not a template. Read your screenshots and fix until it is right and gate _pass is true.
Return JSON: slug exactly "${slug}", name (2-3 words), pitch (2 plain sentences, no file paths), reference (brand + pattern), fonts, palette.`
}

async function processOption(d) {
  const slug = String(++n).padStart(2, '0') + '-' + kebab(d.name)
  const o = { slug, dir: d, status: 'building' }
  all.push(o)
  const b = await agent(builderPrompt(d, slug), { label: `build:${slug}`, phase: 'Build', schema: BUILD })
  if (!b) { o.status = 'dropped'; o.note = 'builder failed'; return o }
  Object.assign(o, { name: b.name, pitch: b.pitch, reference: b.reference, fonts: b.fonts, palette: b.palette })
  let g = await capture(slug, 'Gate')
  for (let t = 0; g && !g.pass && t < 2; t++) {
    await agent(`The ${A.brand} option ${slug} (${MK}/options/${slug}/) failed hard gates:\n${g.fails.join('\n')}\nRead ${MK}/BRIEF.md, fix only these, keep the design. Do not run capture.`, { label: `gatefix:${slug}`, phase: 'Gate' })
    g = await capture(slug, 'Gate')
  }
  if (!g || !g.pass) { o.status = 'dropped'; o.note = 'gate: ' + (g ? g.fails.join('; ') : 'capture failed'); return o }
  let j = await judge(o, 'Judge', 'judge')
  if (!j) { o.status = 'dropped'; o.note = 'judges failed'; return o }
  o.round1 = j.score
  if (!good(j) && j.score >= 65) {
    const low = CRIT.filter(c => j.med[c] < 8).sort((a, b) => j.med[a] - j.med[b])
    await agent(`Revise the ${A.brand} option ${slug} (${MK}/options/${slug}/, contract ${MK}/BRIEF.md). Three independent judges scored it ${j.score}/100 (bar ${BAR}, no criterion under 6). Medians: ${JSON.stringify(j.med)}. Weakest: ${low.join(', ')}.
Fixes, most important first:\n- ${j.fixes.join('\n- ')}${j.invented.length ? '\nRemove or replace with content.json copy: ' + j.invented.join(' | ') : ''}
Timid fix rounds move scores 1-2 points. Make the changes that move the weakest criteria; redesign a section outright if needed. Keep the direction's identity.
Then run bash ${MK}/tools/capture.sh ${slug} cap-${slug}, READ all 8 screenshots, fix anything off, and make sure gate _pass is true.`, { label: `revise:${slug}`, phase: 'Revise' })
    g = await capture(slug, 'Revise')
    if (!g || !g.pass) { o.status = 'dropped'; o.note = 'gate after revise'; return o }
    j = (await judge(o, 'Revise', 'rejudge')) || j
  }
  Object.assign(o, { score: j.score, med: j.med, why: j.why, fixes: j.fixes })
  if (j.invented.length) { o.status = 'dropped'; o.note = 'invented copy: ' + j.invented.join(' | '); return o }
  if (j.dup) {
    const other = all.find(x => x.slug === j.dup && x.status === 'kept')
    if (other && other.score >= j.score) { o.status = 'dropped'; o.note = `duplicate of ${j.dup}`; return o }
    if (other) { other.status = 'dropped'; other.note = `duplicate of ${slug} (scored higher)` }
  }
  o.status = good(j) ? 'kept' : (j.score >= 70 ? 'almost' : 'dropped')
  log(`${slug}: ${o.status} at ${j.score} (${kept().length} kept / ${all.length} total)`)
  return o
}

async function scout(s) {
  const r = await agent(`${A.brand} reference scout ${s.key}. Capture these best-in-class sites: ${s.brands}.
For each: homepage and the main product/money page at 390x844 and 1280x800, above-the-fold and full page, into ${SW}/<brand>/ (agent-browser --session scout-${s.key} --idle-timeout 60m; open about:blank, set viewport, then the URL; close popups; scroll once before --full; never kill Chrome). Skip sites that block you.
Write ${MK}/refs/scout-${s.key}.md: per brand, what makes its homepage and product page work (hero, type, colour, imagery, section order, buy box), with screenshot paths.
Then propose the 2 strongest DIFFERENT design directions for ${A.brand} (${A.product || 'see content.json'}) from what you captured: name (2-3 words, a look not a brand), ref, shots (folder), angle (exactly what to take). They must differ from: ${(A.seeds || []).map(x => x.name).join(', ')}.`,
    { label: `scout:${s.key}`, phase: 'Research', schema: DIRS })
  if (!r) return []
  return parallel(r.directions.slice(0, 2).filter(() => all.length < CAP).map(d => () => processOption(d)))
}

const boardText = () => all.map(o => `${o.slug} | ${o.name || (o.dir && o.dir.name)} | ref: ${o.dir ? o.dir.ref : o.reference || ''} | ${o.status}${o.score != null ? ' ' + o.score : ''}${o.note ? ' (' + o.note + ')' : ''}${o.why ? ' | best: ' + o.why : ''}`).join('\n')

// ---------- wave 1: seeds build now; scouts research and feed builds as they finish ----------
phase('Build')
await parallel([...(A.seeds || []).map(d => () => processOption(d)), ...(A.scouts || []).map(s => () => scout(s))])

// ---------- director waves until dry ----------
let wave = 1
while (all.length < CAP) {
  wave++
  const top8 = new Set(kept().slice(0, 8).map(o => o.slug))
  const d = await agent(`You are the ${A.brand} design director. Goal: many high-quality, genuinely different homepage + second-page directions, each grounded in a proven brand's live site. No slop.
Board so far (slug | name | reference | status score | best):
${boardText()}
References: ${SW}/*/ (screenshots) and ${MK}/refs/*.md. You may name a brand not yet captured if you are sure it fits (the builder captures it).
Propose up to ${Math.min(6, CAP - all.length)} NEW directions that fill real gaps (a look, mood or proven pattern missing from the board) and that you expect to beat the current top 8. Learn from what was dropped and why. If nothing would clear the bar, return an empty list - that ends the run.`,
    { label: `director:w${wave}`, phase: 'Direct', schema: DIRS })
  if (!d || !d.directions.length) { log(`Director stopped: ${d ? d.reason : 'no answer'}`); break }
  const recs = (await parallel(d.directions.slice(0, CAP - all.length).map(x => () => processOption(x)))).filter(Boolean)
  const entered = kept().slice(0, 8).filter(o => !top8.has(o.slug) && recs.some(r => r.slug === o.slug)).length
  log(`Wave ${wave}: ${recs.filter(r => r.status === 'kept').length} kept, ${entered} entered the top 8`)
  if (entered === 0) { log('Dry: no new option reached the top 8.'); break }
}

// ---------- pairwise tournament ----------
phase('Rank')
const K = kept()
const pairs = [], seen = new Set()
const add = (a, b) => { const k = [a.slug, b.slug].sort().join('|'); if (a !== b && !seen.has(k)) { seen.add(k); pairs.push([a, b]) } }
K.forEach((a, i) => { for (let j = i + 1; j <= i + 3 && j < K.length; j++) add(a, K[j]) })
K.slice(0, 8).forEach((a, i) => K.slice(0, 8).forEach((b, j) => { if (j > i) add(a, b) }))
const matches = (await parallel(pairs.map(([x, y], i) => () => {
  const [P, Q] = i % 2 ? [y, x] : [x, y]
  return agent(`Head-to-head: which of these two ${A.brand} options should the client's team launch? Judge as a demanding creative director who also cares about sales: phone first screen, real-brand craft, clean and simple (not any rejected trait: ${A.rejected || 'loud, plain, messy, clinical'}), how easy the second page makes the decision.
A = ${P.slug}: ${MK}/shots/${P.slug}/ - read the first page 390 fold + full, the first page 1280 fold, the second page 390 fold and 1280 fold
B = ${Q.slug}: ${MK}/shots/${Q.slug}/ - the same five files
Ignore earlier scores. Margin 1 = close, 3 = clear. One plain-sentence reason first. Do not edit files.`, { label: `match:${P.slug}~${Q.slug}`, phase: 'Rank', schema: MATCH, ...JT })
    .then(m => m && { w: m.winner === 'A' ? P.slug : Q.slug, l: m.winner === 'A' ? Q.slug : P.slug, margin: m.margin, reason: m.reason })
}))).filter(Boolean)
const elo = {}
K.forEach(o => { elo[o.slug] = 1500 + (o.score - BAR) * 4 })
for (let p = 0; p < 30; p++) {
  const k = 32 / (1 + p / 5)
  matches.forEach(m => { const e = 1 / (1 + Math.pow(10, (elo[m.l] - elo[m.w]) / 400)); const d = k * (0.5 + m.margin / 6) * (1 - e); elo[m.w] += d; elo[m.l] -= d })
}
const tally = s => ({ wins: matches.filter(m => m.w === s).length, played: matches.filter(m => m.w === s || m.l === s).length })
const ranked = [...K].sort((a, b) => (elo[b.slug] - elo[a.slug]) || (b.score - a.score))
  .map((o, i) => ({ rank: i + 1, slug: o.slug, name: o.name, pitch: o.pitch, reference: o.reference, score: o.score, elo: Math.round(elo[o.slug]), ...tally(o.slug), why: o.why, palette: o.palette, fonts: o.fonts, carried: !!o.carried }))
return {
  ranked,
  almost: all.filter(o => o.status === 'almost').map(o => ({ slug: o.slug, name: o.name, pitch: o.pitch, reference: o.reference, score: o.score, why: o.why, palette: o.palette, fonts: o.fonts })),
  dropped: all.filter(o => o.status === 'dropped').map(o => ({ slug: o.slug, score: o.score, note: o.note })),
  matches,
  nextStartAt: n + 1,
}
