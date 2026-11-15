// Capture one option for judging + run the hard gates, by driving the installed Chrome over CDP.
//   node mockups/tools/capture.mjs <slug>
// Same outputs as the html-design-options capture.sh: mockups/shots/<slug>/{page}-{390|1280}-{fold|full}.png,
// gate.raw, gate.json; prints {"pass", "fails"} as the last line.
// Use it instead of capture.sh when agent-browser is not installed or misbehaves: it needs only Node 22+ and Chrome.
// Env overrides: BASE, PAGES, CTA_RE, BANNED, CHROME.
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const slug = process.argv[2]
if (!slug) { console.error('usage: node capture.mjs <slug>'); process.exit(2) }
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'shots', slug)
mkdirSync(OUT, { recursive: true })
const BASE = process.env.BASE || 'http://127.0.0.1:4100/options'
const PAGES = (process.env.PAGES || 'home:index.html shop:shop.html').split(/\s+/).map(p => p.split(':'))
const CTA_RE = process.env.CTA_RE || 'shop|get \\d|buy|add to|order|book|start|quote|contact'
const BANNED = ['seamless', 'elevate', 'unleash', 'game-changer', 'revolutionary', 'world-class', 'cutting-edge',
  'best-in-class', 'lorem', 'placeholder', 'replace with', 'ai-generated', 'ai generated',
  ...(process.env.BANNED || '')
    .split(',').map(w => w.trim().toLowerCase()).filter(Boolean)]
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => existsSync(p))
if (!CHROME) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(2) }
const SIZES = [[390, 844], [1280, 800]]

const GATE = `JSON.stringify((()=>{
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const ctas = [...document.querySelectorAll('a,button')].filter(e => new RegExp(${JSON.stringify(CTA_RE)},'i').test(e.innerText||''));
  const text = document.body.innerText.toLowerCase();
  const banned = ${JSON.stringify(BANNED)}.filter(w => text.includes(w));
  const imgs = [...document.images];
  return { w: innerWidth, noHScroll: document.documentElement.scrollWidth <= innerWidth + 1,
    ctaAboveFold: ctas.some(vis), brokenImages: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    banned, height: document.documentElement.scrollHeight, hasLogo: !!document.querySelector('[data-logo]') };
})())`
const SCROLL = `(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0);await new Promise(r=>setTimeout(r,200));return document.documentElement.scrollHeight})()`

const sleep = ms => new Promise(r => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'mockup-capture-'))
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
const wsUrl = await new Promise((res, rej) => {
  let buf = ''
  const t = setTimeout(() => rej(new Error('Chrome did not start in 30s')), 30000)
  chrome.stderr.on('data', d => { buf += d; const m = buf.match(/DevTools listening on (ws:\/\/\S+)/); if (m) { clearTimeout(t); res(m[1]) } })
  chrome.on('exit', c => rej(new Error('Chrome exited ' + c)))
})

const ws = new WebSocket(wsUrl)
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })
let id = 0
const pending = new Map(), listeners = []
ws.onmessage = ev => {
  const m = JSON.parse(ev.data)
  if (m.id && pending.has(m.id)) { const { res, rej } = pending.get(m.id); pending.delete(m.id); m.error ? rej(new Error(m.error.message)) : res(m.result) }
  else if (m.method) listeners.forEach(l => l(m))
}
const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
  const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params, sessionId }))
})
const once = (method, sessionId, ms = 20000) => new Promise(res => {
  const t = setTimeout(() => { listeners.splice(listeners.indexOf(f), 1); res(null) }, ms)
  const f = m => { if (m.method === method && m.sessionId === sessionId) { clearTimeout(t); listeners.splice(listeners.indexOf(f), 1); res(m) } }
  listeners.push(f)
})

const raw = []
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, s)
  for (const [key, file] of PAGES) {
    for (const [W, H] of SIZES) {
      const mobile = W < 600
      await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile }, s)
      await send('Emulation.setTouchEmulationEnabled', { enabled: mobile }, s)
      const loaded = once('Page.loadEventFired', s)
      await send('Page.navigate', { url: `${BASE}/${slug}/${file}` }, s)
      await loaded
      await sleep(1200) // fonts, Tailwind browser build, images
      let g = null
      try {
        const r = await send('Runtime.evaluate', { expression: GATE, returnByValue: true }, s)
        g = r.result && r.result.value ? JSON.parse(r.result.value) : null
      } catch { g = null }
      const fold = await send('Page.captureScreenshot', { format: 'png' }, s)
      writeFileSync(join(OUT, `${key}-${W}-fold.png`), Buffer.from(fold.data, 'base64'))
      const sh = await send('Runtime.evaluate', { expression: SCROLL, awaitPromise: true, returnByValue: true }, s)
      const fullH = Math.min(16000, Math.max(H, Number(sh.result && sh.result.value) || H))
      const full = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true,
        clip: { x: 0, y: 0, width: W, height: fullH, scale: 1 } }, s)
      writeFileSync(join(OUT, `${key}-${W}-full.png`), Buffer.from(full.data, 'base64'))
      raw.push([`${key}-${W}`, g])
    }
  }
} finally {
  try { ws.close() } catch {}
  chrome.kill()
  await sleep(300)
  try { rmSync(profile, { recursive: true, force: true }) } catch {}
}

writeFileSync(join(OUT, 'gate.raw'), raw.map(([k, v]) => `${k}\t${JSON.stringify(v)}`).join('\n') + '\n')
const d = {}, fails = []
const first = PAGES[0][0]
for (const [k, v] of raw) {
  d[k] = v
  if (!v) { fails.push(`${k}: page did not load`); continue }
  if (!v.noHScroll) fails.push(`${k}: horizontal scroll`)
  if (v.brokenImages.length) fails.push(`${k}: broken images ${JSON.stringify(v.brokenImages.slice(0, 3))}`)
  if (v.banned.length) fails.push(`${k}: banned words ${JSON.stringify(v.banned)}`)
  if (k === `${first}-390` && !v.ctaAboveFold) fails.push(`${k}: no call-to-action button on the first phone screen`)
  if (!v.hasLogo) fails.push(`${k}: logo is missing data-logo`)
}
d._pass = !fails.length
d._fails = fails
writeFileSync(join(OUT, 'gate.json'), JSON.stringify(d, null, 1))
console.log(JSON.stringify({ pass: d._pass, fails }))
process.exit(0)
