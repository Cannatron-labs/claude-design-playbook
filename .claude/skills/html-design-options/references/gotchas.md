# Gotchas (each one cost real time on a real run)

## agent-browser
- Always pass `--session <name> --idle-timeout 60m`. The default session spawns a new browser per command (~7 s each).
  Give every parallel agent its own session name (`proj-b-<slug>`, `proj-cap-<slug>`); a shared name made one
  builder see another builder's page.
- Phone screenshots: `open about:blank` -> `set viewport 390 844` -> `open <url>` -> `wait --load networkidle`.
  Setting the viewport after the page loads gives desktop layouts.
- Lazy images are blank in `screenshot --full`. Use `loading="eager"` in mockups, and scroll through once before the
  full shot (capture.sh does both).
- Never kill Chrome globally; `agent-browser close --all` or delete stale `~/.agent-browser/<session>.*` files.
- A blank screenshot usually means the session sat on about:blank; reopen the URL.
- Never name a shell variable `TMP`/`TEMP` in a script that runs agent-browser: it is the exported temp dir, so
  Chrome tries to make its profile inside your file and every open fails with "os error 183".
- Never pipe the command that starts a session (`open ... | grep`): the daemon keeps the pipe open and the script
  hangs until the idle timeout. Redirect to a file, then grep the file.
- The board port may already be serving another project's board; check what a 404 is actually serving before debugging.

## Workflow tool scripts
- Plain JS only (no TypeScript). No `Date.now()` / `Math.random()`. No file access: pass state in `args` or have an
  agent read the file.
- Windows: a script written by Python in text mode gets CRLF and is rejected ("control characters"); write with
  `newline='\n'`. Single backslashes inside template literals become escapes (`\r` in `C:\results`): use forward
  slashes in every path.
- `parallel()` and `pipeline()` never reject; failed agents return null. Filter.
- Don't put a deploy/publish step inside the workflow. A haiku publish agent got a security flag ("Create Public
  Surface") and then stalled for 10+ minutes. Return the ranking and publish from the main session.
- Keep the run's `journal.jsonl` (label -> result). If you stop a run, you can rebuild every score from it
  (`started` lines map key -> label; `result` lines carry the agent output).
- The Workflow output file is JSON with `result` holding the return value: `json.load(f)["result"]`.

## Python helpers on Windows
- Writing regex through a bash heredoc into a .py file turned `\b` into a literal backspace character. Edit regexes
  with the Edit tool or check `s.count('\x08')` after writing.
- Python on Windows prints non-ASCII brand names as `�`; read/write files with `encoding="utf-8"`.

## Tailwind v4 browser build
- `<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>` + `<style type="text/tailwindcss">
  @theme { --font-display: ...; --color-ink: ...; }</style>`. Fine for mockups, not for production.
- A grid item holding a wide image will push the page sideways on phones: use `grid-cols-1` (= `minmax(0,1fr)`) and
  `min-w-0` on flex/grid children. Long unbroken strings (paths, URLs) do the same: `break-words` on body.

## Board / Vercel
- Use a separate static Vercel project for the board so the real app's build guards don't apply. Turn deployment
  protection off (API: PATCH `/v9/projects/<id>` `{"ssoProtection": null}`) or the team hits a login wall.
- Before re-aliasing a URL the team already uses, alias the old deployment to a new name so old links still work.
- `vercel.json` rewrites map `/options` (and `/options/`) to `/index.html` if the team has the old path.
- Strip builder chatter from `pitch`/`reference` fields (paths, "Files are in...", gate notes) before rendering;
  ask builders for a clean 2-sentence pitch and a short reference name.

## Images
- AI images of the product with text come out wrong. Generate empty scenes and place the real product render.
- Re-check generated scenes for "product in hand" and identical poses if the client banned them; judges don't
  always catch it.

## After a big run: agent-browser can wedge
Hundreds of named sessions leave ~450 pointer files in `~/.agent-browser/` and orphaned Chrome processes (100+ after one
run). Symptoms: "Failed to create temp profile dir ... already exists (os error 183)", or every command hangs
even though Chrome starts. Clean up in this order, never touching the user's own Chrome:
1. `agent-browser close --all`.
2. Stop only agent-browser's Chrome, filtered by command line (PowerShell):
   `Get-CimInstance Win32_Process -Filter "Name='chrome.exe'" | ? { $_.CommandLine -match 'agent-browser' } | % { Stop-Process -Id $_.ProcessId -Force }`
3. Use a brand-new session name. If it still hangs, a reboot clears it (not confirmed; the run had already
   finished). Plan for it: do the final board checks with curl, which doesn't need the browser.
Prevention: reuse a small pool of session names per role (cap-1..cap-8) instead of one per option, and run
`agent-browser close --all` at the end of every run.
