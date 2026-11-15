#!/usr/bin/env bash
# Capture one option for judging + run the hard gates.
#   bash mockups/tools/capture.sh <slug> [session]
# Needs the static server: (cd mockups && python -m http.server 4100 --bind 127.0.0.1)
# Writes mockups/shots/<slug>/{page}-{390|1280}-{fold|full}.png and gate.json; prints {"pass", "fails"}.
# Env overrides:
#   BASE    default http://127.0.0.1:4100/options
#   PAGES   default "home:index.html shop:shop.html"   (key:file pairs; the first page gets the CTA gate)
#   CTA_RE  default "shop|get \d|buy|add to|order|book|start|quote|contact"
#   BANNED  extra banned words, comma separated (added to the defaults below)
set -u
SLUG="$1"
# one fresh session per run: re-launching a name that was just closed can fail with "os error 183"
SES="${2:-cap-$SLUG}-$$"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/shots/$SLUG"
mkdir -p "$OUT"
B="agent-browser --session $SES --idle-timeout 30m"
BASE="${BASE:-http://127.0.0.1:4100/options}"
PAGES="${PAGES:-home:index.html shop:shop.html}"
CTA_RE="${CTA_RE:-shop|get \\\\d|buy|add to|order|book|start|quote|contact}"
BANNED_JS=$(python -c "import json,os;d=['seamless','elevate','unleash','game-changer','revolutionary','world-class','cutting-edge','best-in-class','lorem','placeholder','replace with','ai-generated','ai generated'];d+= [w.strip().lower() for w in os.environ.get('BANNED','').split(',') if w.strip()];print(json.dumps(d))")
FIRST_KEY="${PAGES%%:*}"

GATE="JSON.stringify((()=>{
  const vis = e => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
    return r.width > 0 && r.height > 0 && r.top < innerHeight && r.bottom > 0 && s.visibility !== 'hidden' && s.display !== 'none' && +s.opacity > 0.05; };
  const ctas = [...document.querySelectorAll('a,button')].filter(e => new RegExp('$CTA_RE','i').test(e.innerText||''));
  const text = document.body.innerText.toLowerCase();
  const banned = $BANNED_JS.filter(w => text.includes(w));
  const imgs = [...document.images];
  return { w: innerWidth, noHScroll: document.documentElement.scrollWidth <= innerWidth + 1,
    ctaAboveFold: ctas.some(vis), brokenImages: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.getAttribute('src')),
    banned, height: document.documentElement.scrollHeight, hasLogo: !!document.querySelector('[data-logo]') };
})())"

RAW="$OUT/gate.raw"  # not TMP: that would redirect the browser's own temp dir (os error 183)
: > "$RAW"
# warm up: after a big run a new browser can take minutes to start; wait for it instead of failing every step
for try in 1 2 3 4 5 6; do
  # never pipe the command that starts the session: the daemon inherits the pipe and the shell waits for it
  $B open about:blank > "$OUT/warmup.log" 2>&1
  grep -q "about:blank" "$OUT/warmup.log" && break
  sleep 10
done
for PF in $PAGES; do
  KEY="${PF%%:*}"; FILE="${PF#*:}"
  for W in 390 1280; do
    H=844; [ "$W" = 1280 ] && H=800
    $B open about:blank >/dev/null 2>&1
    $B set viewport "$W" "$H" >/dev/null 2>&1
    $B open "$BASE/$SLUG/$FILE" >/dev/null 2>&1
    $B wait --load networkidle >/dev/null 2>&1
    G=$($B eval "$GATE" 2>/dev/null | tail -n 1)
    $B screenshot "$OUT/$KEY-$W-fold.png" >/dev/null 2>&1
    # scroll through once so lazy content paints, then back to the top for the full shot
    $B eval "(async()=>{for(let y=0;y<document.documentElement.scrollHeight;y+=600){scrollTo(0,y);await new Promise(r=>setTimeout(r,60))}scrollTo(0,0);return 1})()" >/dev/null 2>&1
    $B screenshot --full "$OUT/$KEY-$W-full.png" >/dev/null 2>&1
    printf '%s-%s\t%s\n' "$KEY" "$W" "${G:-null}" >> "$RAW"
  done
done
$B close >/dev/null 2>&1

python - "$OUT" "$FIRST_KEY" <<'PY'
import json, sys
out, first = sys.argv[1], sys.argv[2]
d = {}
for line in open(f"{out}/gate.raw", encoding="utf-8"):
    k, _, v = line.rstrip("\n").partition("\t")
    try:
        v = json.loads(v)
        if isinstance(v, str):  # agent-browser prints eval results as a JSON string
            v = json.loads(v)
    except Exception:
        v = None
    d[k] = v
fails = []
for k, v in d.items():
    if not v:
        fails.append(f"{k}: page did not load"); continue
    if not v["noHScroll"]: fails.append(f"{k}: horizontal scroll")
    if v["brokenImages"]: fails.append(f"{k}: broken images {v['brokenImages'][:3]}")
    if v["banned"]: fails.append(f"{k}: banned words {v['banned']}")
    if k == f"{first}-390" and not v["ctaAboveFold"]: fails.append(f"{k}: no call-to-action button on the first phone screen")
    if not v["hasLogo"]: fails.append(f"{k}: logo is missing data-logo")
d["_pass"] = not fails
d["_fails"] = fails
open(f"{out}/gate.json", "w", encoding="utf-8").write(json.dumps(d, indent=1))
print(json.dumps({"pass": d["_pass"], "fails": fails}))
PY
