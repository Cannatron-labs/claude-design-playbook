# Claude Design Playbook

A ready-to-use set of Claude Code **agents, skills, rubrics and templates** for building websites with Claude.
It covers research, a design-options pipeline that produces 10-30 ranked directions, independent judging, sourced
facts, copy and the real build. It came out of real client projects.

**Claude: read [`PLAYBOOK.md`](PLAYBOOK.md) first.** It explains how every piece fits together and the order to
use them in.

## What you get
- **8 agents:** `judge`, `swipe-analyst`, `design-reviewer`, `copywriter`, `fact-curator`, `strategist`,
  `web-builder`, `docs-keeper`
- **4 skills:**
  - `html-design-options`: build many static design options, then gate, 3-judge, tournament-rank and publish a
    chooser board. Scripts and workflow included.
  - `qa-scorecard`: the judging protocol
  - `fact-research`: every fact carries a source
  - `researcher`: quick sourced web answers
- **4 rubrics** in `qa/rubrics/`: design option, built page, fact record, research brief
- **Templates:** a `CLAUDE.md` starter with iOS-safe mobile rules, plus STATUS / decisions / open-items docs and a
  quality-bar template

## Install

Copy it into one project:
```bash
git clone https://github.com/Cannatron-labs/claude-design-playbook.git /tmp/playbook
cp -r /tmp/playbook/.claude /tmp/playbook/qa /tmp/playbook/PLAYBOOK.md  your-project/
cp /tmp/playbook/templates/CLAUDE.md.template your-project/CLAUDE.md   # then fill in the {{...}}
```
Or install it for every project on your machine: copy `.claude/agents/*` to `~/.claude/agents/` and
`.claude/skills/*` to `~/.claude/skills/`.

Then tell Claude: *"Read PLAYBOOK.md and set up this project with it."*

## Requirements
- Claude Code. The design pipeline uses the Workflow tool if you have it; otherwise run its steps with parallel
  subagents.
- Node 22+ and Google Chrome for the screenshot/gate scripts (`capture.mjs`, `shoot.mjs`). Python 3 for the board
  generator.
- Optional:
  - [`agent-browser`](https://github.com/vercel-labs/agent-browser) for browser automation
  - the Claude in Chrome extension for the `design-reviewer`
  - the Vercel CLI to publish the board
  - an Ahrefs / Search Console MCP for the `strategist`

## Folder map
```
PLAYBOOK.md                     how it all works (start here)
.claude/agents/                 the 8 agents
.claude/skills/
  html-design-options/          SKILL.md, references/, templates/, scripts/, workflows/
  qa-scorecard/                 SKILL.md, references/ (page rubric, tournament, ledger)
  fact-research/                SKILL.md
  researcher/                   SKILL.md
qa/rubrics/                     html-option, page, fact-record, research-brief
qa/ledger.jsonl                 append-only score history (main session writes it)
templates/CLAUDE.md.template    project rules starter
templates/project-docs/         STATUS, decisions, open-items, QUALITY-BAR template
```

## License
MIT. Use it, change it, share it.
