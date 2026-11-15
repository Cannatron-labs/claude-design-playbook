"""Build the chooser page mockups/index.html from mockups/ranking.json + mockups/board.config.json.

ranking.json: {"built": n, "options": [{"slug", "name", "pitch", "reference", "score", "elo", "rank",
               "status": "kept"|"almost", "why", "fonts", "palette": ["#hex", ...]}]}
board.config.json: {"brand", "accent", "title", "intro", "pages": [{"key","file","label"}, ...],
                    "earlier": [{"label","url"}], "vercel": {"scope","alias"}}
Kept options show in rank order (top 3 large, with the second page's phone shot); "almost" below; then earlier links.
Thumbnails come from mockups/shots/<slug>/<page>-<390|1280>-fold.png (capture.sh).
"""
import html
import json
import re
from pathlib import Path

from PIL import Image

M = Path(__file__).resolve().parents[1]
THUMBS = M / "thumbs"
CFG = json.loads((M / "board.config.json").read_text(encoding="utf-8"))
ACCENT = CFG.get("accent", "#003DCB")
P1, P2 = CFG["pages"][0], (CFG["pages"][1] if len(CFG["pages"]) > 1 else None)


def thumb(slug, page, w, out_w):
    src = M / "shots" / slug / f"{page}-{w}-fold.png"
    if not src.exists():
        return None
    THUMBS.mkdir(exist_ok=True)
    dest = THUMBS / f"{slug}-{page}-{w}.webp"
    im = Image.open(src).convert("RGB")
    im = im.resize((out_w, round(im.height * out_w / im.width)), Image.LANCZOS)
    im.save(dest, "WEBP", quality=80, method=5)
    return f"thumbs/{dest.name}"


def e(s):
    return html.escape(str(s or ""))


# builder / judge text leaks file paths, gate notes and scoring talk; keep only plain sentences
NOISE = re.compile(r"[A-Za-z]:/|/mockups/|Files|\.html|NOTES\.md|shots|gate|session|builder|my own|[Ss]core|"
                   r"[Ww]eighted|research_grounding|\.png|_pass|REVISE|calibration|content\.json|revise|[0-9]{2}-[a-z]")


def sentences(s, n):
    parts = re.split(r"(?<=[.!?])\s+", str(s or "").strip())
    return " ".join([x for x in parts if not NOISE.search(x)][:n])


def short_ref(s):
    """'AG1 (drinkag1.com). Patterns taken: ...' -> 'AG1'."""
    return re.split(r"\s*\(|[.:;,]\s|\s[—-]\s", str(s or ""), maxsplit=1)[0].strip()[:60]


def card(o, big):
    s = o["slug"]
    phone = thumb(s, P1["key"], 390, 300)
    desk = thumb(s, P1["key"], 1280, 900 if big else 640)
    second = thumb(s, P2["key"], 390, 300) if P2 else None
    dots = "".join(f'<span class="h-3 w-3 rounded-full ring-1 ring-black/10" style="background:{e(c)}"></span>' for c in (o.get("palette") or [])[:6])
    medal = {1: f"bg-[{ACCENT}] text-white", 2: "bg-ink text-white", 3: "bg-ink text-white"}.get(o["rank"], "bg-white text-ink ring-1 ring-black/15")
    p2 = (f'<a href="options/{s}/{P2["file"]}" class="hidden w-[22%] shrink-0 overflow-hidden rounded-[14px] border-[3px] border-ink bg-ink shadow-md '
          f'transition hover:-translate-y-0.5 sm:block"><img src="{second}" alt="{e(o["name"])} {e(P2["label"])} on a phone" loading="eager" '
          f'class="block w-full rounded-[10px]"></a>') if big and second else ""
    btn2 = (f'<a href="options/{s}/{P2["file"]}" class="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[14px] font-bold '
            f'ring-2 ring-ink [touch-action:manipulation]">{e(P2["label"])}</a>') if P2 else ""
    why = f'<p class="mt-2 text-[13px] leading-snug text-black/55"><span class="font-semibold text-black/70">Why it ranks:</span> {e(sentences(o.get("why"), 2))}</p>' if o.get("why") else ""
    ref = f'<p class="mt-2 text-[12px] text-black/45">Inspired by {e(short_ref(o.get("reference")))}</p>' if o.get("reference") else ""
    score = f'Score {e(o.get("score"))}' if o.get("score") is not None else ""
    return f"""
    <article id="{s}" class="min-w-0 scroll-mt-6 {'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:p-6' if big else 'rounded-xl bg-white p-4 ring-1 ring-black/5'}">
      <div class="relative flex items-center gap-3 {'sm:gap-4' if big else ''}">
        <a href="options/{s}/{P1['file']}" class="block min-w-0 flex-1 overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10 transition hover:-translate-y-0.5 hover:shadow-md">
          <div class="flex h-5 items-center gap-1 bg-[#EDEBE6] px-2"><span class="h-1.5 w-1.5 rounded-full bg-black/20"></span><span class="h-1.5 w-1.5 rounded-full bg-black/20"></span><span class="h-1.5 w-1.5 rounded-full bg-black/20"></span></div>
          <img src="{desk}" alt="{e(o['name'])} {e(P1['label'])} on desktop" loading="eager" class="block w-full">
        </a>
        <a href="options/{s}/{P1['file']}" class="block w-[28%] shrink-0 overflow-hidden rounded-[14px] border-[3px] border-ink bg-ink shadow-md transition hover:-translate-y-0.5">
          <img src="{phone}" alt="{e(o['name'])} {e(P1['label'])} on a phone" loading="eager" class="block w-full rounded-[10px]">
        </a>
        {p2}
      </div>
      <div class="mt-4 flex items-start gap-3">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[15px] font-extrabold {medal}">{o['rank']}</span>
        <div class="min-w-0 flex-1">
          <div class="flex flex-wrap items-baseline justify-between gap-x-3">
            <h3 class="{'text-[22px]' if big else 'text-[18px]'} font-extrabold tracking-tight">{e(o['name'])}</h3>
            <span class="text-[13px] font-semibold tabular-nums text-black/60">{score}</span>
          </div>
          <p class="mt-1 text-[15px] leading-snug text-black/75">{e(sentences(o.get('pitch'), 2))}</p>
          {why}
          <div class="mt-3 flex flex-wrap items-center gap-2">
            <a href="options/{s}/{P1['file']}" class="inline-flex min-h-11 items-center rounded-full bg-[{ACCENT}] px-5 text-[14px] font-bold text-white [touch-action:manipulation]">{e(P1['label'])}</a>
            {btn2}
            <span class="ml-auto flex items-center gap-1">{dots}</span>
          </div>
          {ref}
        </div>
      </div>
    </article>"""


def main():
    data = json.loads((M / "ranking.json").read_text(encoding="utf-8"))
    kept = sorted([o for o in data["options"] if o.get("status") == "kept"], key=lambda o: o["rank"])
    top, rest = kept[:3], kept[3:]
    almost = sorted([o for o in data["options"] if o.get("status") == "almost"], key=lambda o: -(o.get("score") or 0))
    for o in almost:
        o["rank"] = "–"
    built = data.get("built", len(data["options"]))
    h2 = 'class="mt-14 text-[13px] font-extrabold uppercase tracking-[0.14em] text-black/50"'
    earlier = "".join(f'<a href="{e(x["url"])}" class="inline-flex min-h-11 items-center rounded-full bg-white px-5 text-[14px] font-bold ring-1 ring-black/15">{e(x["label"])}</a>' for x in CFG.get("earlier", []))
    page = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>{e(CFG['brand'])} design options</title><meta name="robots" content="noindex">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
<style type="text/tailwindcss">@theme {{ --font-sans: Inter, system-ui, sans-serif; --color-ink: #0A0A0A; }}</style>
</head>
<body class="min-h-svh overflow-x-clip break-words bg-[#F4F2EE] font-sans text-ink antialiased">
<header class="mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-12">
  <div class="flex items-center gap-1.5"><span class="text-[26px] font-black tracking-tight">{e(CFG['brand'])}</span><span class="mt-2 h-3 w-3 bg-[{ACCENT}]"></span></div>
  <h1 class="mt-6 max-w-3xl text-[34px] font-extrabold leading-[1.05] tracking-tight sm:text-[52px]">{e(CFG['title'])}</h1>
  <p class="mt-4 max-w-2xl text-[16px] leading-relaxed text-black/70 sm:text-[18px]">{e(CFG['intro'])} <span class="font-semibold text-ink">{len(kept)} kept of {built} built.</span></p>
  <p class="mt-3 text-[14px] text-black/55">Tap any preview to open it. Works best on your phone.</p>
</header>
<main class="mx-auto max-w-6xl px-4 pb-20 sm:px-6">
  <h2 {h2.replace('mt-14', 'mt-10')}>Top picks</h2>
  <div class="mt-4 grid grid-cols-1 gap-5">{''.join(card(o, True) for o in top)}</div>
  {f'<h2 {h2}>Also in the running</h2><div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">{"".join(card(o, False) for o in rest)}</div>' if rest else ''}
  {f'<h2 {h2}>Almost: just under the bar</h2><p class="mt-1 text-[14px] text-black/55">Scored 70-79. Worth a look, not yet at the level of the ones above.</p><div class="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">{"".join(card(o, False) for o in almost)}</div>' if almost else ''}
  {f'<section class="mt-16 border-t border-black/10 pt-8"><h2 class="text-[13px] font-extrabold uppercase tracking-[0.14em] text-black/50">Earlier directions</h2><div class="mt-4 flex flex-wrap gap-2">{earlier}</div></section>' if earlier else ''}
</main>
</body></html>
"""
    (M / "index.html").write_text(page, encoding="utf-8")
    print(f"index.html: {len(kept)} kept, {len(almost)} almost, of {built} built")


if __name__ == "__main__":
    main()
