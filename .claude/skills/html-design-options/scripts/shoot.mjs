// Screenshot a reference site (any URL) at 390x844 and 1280x800, fold + full, with the installed Chrome over CDP.
//   node mockups/tools/shoot.mjs <url> <outdir> <name>   -> <outdir>/<name>-{390|1280}-{fold|full}.png
// Use it instead of capture.sh when agent-browser is not installed or misbehaves: it needs only Node 22+ and Chrome.
// Env overrides: CHROME (path to the Chrome binary).
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync, rmSync, mkdtempSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const [url, outDir, name] = process.argv.slice(2)
if (!url || !outDir || !name) { console.error('usage: node shoot.mjs <url> <outdir> <name>'); process.exit(2) }
mkdirSync(outDir, { recursive: true })
const CHROME = process.env.CHROME || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => existsSync(p))
if (!CHROME) { console.error('Chrome not found: set CHROME=/path/to/chrome'); process.exit(2) }
const SIZES = [[390, 844], [1280, 800]]
const SCROLL = `(async()=>{for(let y=0;y<Math.min(document.documentElement.scrollHeight,20000);y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,120))}scrollTo(0,0);await new Promise(r=>setTimeout(r,400));return document.documentElement.scrollHeight})()`
const sleep = ms => new Promise(r => setTimeout(r, ms))
const profile = mkdtempSync(join(tmpdir(), 'mockup-capture-'))
const chrome = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run',
  '--no-default-browser-check', '--hide-scrollbars', '--disable-extensions', ...(process.env.SHOOT_CHROME_ARG ? [process.env.SHOOT_CHROME_ARG] : []), 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] })
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

const UA_MOBILE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
const done = []
try {
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId: s } = await send('Target.attachToTarget', { targetId, flatten: true })
  await send('Page.enable', {}, s)
  for (const [W, H] of SIZES) {
    const mobile = W < 600
    await send('Emulation.setDeviceMetricsOverride', { width: W, height: H, deviceScaleFactor: 1, mobile }, s)
    await send('Emulation.setTouchEmulationEnabled', { enabled: mobile }, s)
    await send('Network.setUserAgentOverride', { userAgent: mobile ? UA_MOBILE : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36' }, s)
    const loaded = once('Page.loadEventFired', s, 30000)
    await send('Page.navigate', { url }, s)
    await loaded
    await sleep(3000)
    const fold = await send('Page.captureScreenshot', { format: 'png' }, s)
    writeFileSync(join(outDir, `${name}-${W}-fold.png`), Buffer.from(fold.data, 'base64'))
    const sh = await send('Runtime.evaluate', { expression: SCROLL, awaitPromise: true, returnByValue: true }, s)
    const fullH = Math.min(16000, Math.max(H, Number(sh.result && sh.result.value) || H))
    const full = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: 0, y: 0, width: W, height: fullH, scale: 1 } }, s)
    writeFileSync(join(outDir, `${name}-${W}-full.png`), Buffer.from(full.data, 'base64'))
    done.push(`${name}-${W}`)
  }
} finally {
  try { ws.close() } catch {}
  chrome.kill()
  await sleep(300)
  try { rmSync(profile, { recursive: true, force: true }) } catch {}
}
console.log(JSON.stringify({ ok: done.length === 2, shots: done, outDir }))
process.exit(0)
