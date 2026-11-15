#!/usr/bin/env bash
# Rebuild the chooser from ranking.json and deploy mockups/ to the stable alias in board.config.json.
#   bash mockups/tools/publish.sh
# First time only: cd mockups && vercel project add <name> --scope <team> && vercel link --yes --project <name> --scope <team>
# then turn deployment protection off (see gotchas.md). Run from the MAIN session, not a subagent.
set -e
cd "$(dirname "$0")/.."
SCOPE=$(python -c "import json;print(json.load(open('board.config.json'))['vercel']['scope'])")
ALIAS=$(python -c "import json;print(json.load(open('board.config.json'))['vercel']['alias'])")
python tools/make_index.py
URL=$(vercel deploy --prod --yes --scope "$SCOPE" 2>/dev/null | tail -n 1)
vercel alias set "$URL" "$ALIAS" --scope "$SCOPE" >/dev/null
printf '%s /\n' "$(curl -s -o /dev/null -w '%{http_code}' "https://$ALIAS/")"
python - "$ALIAS" <<'PY'
import json, sys, urllib.request
alias = sys.argv[1]
cfg = json.load(open("board.config.json"))
bad = 0
for o in json.load(open("ranking.json", encoding="utf-8"))["options"]:
    for p in cfg["pages"]:
        u = f"https://{alias}/options/{o['slug']}/{p['file']}"
        try:
            code = urllib.request.urlopen(u, timeout=20).status
        except Exception as ex:
            code = getattr(ex, "code", "ERR")
        if code != 200:
            bad += 1
            print("BAD", code, u)
print("links ok" if not bad else f"{bad} broken links")
PY
echo "$URL"
