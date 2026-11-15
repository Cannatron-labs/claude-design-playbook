# QA ledger: `qa/ledger.jsonl`

The ledger is the project's memory of every score. It lets a new session answer "what passed, what's stuck, why".

- **Only the main (orchestrating) session writes it.** Judges and subagents return JSON to the main session.
  Concurrent appends from parallel agents corrupt lines.
- **Append-only, one JSON object per line, one line per score.** Never rewrite or delete a line. A re-score gets a
  new line with `round + 1`.
- UTF-8, `\n` line endings. On Windows, write with `newline='\n'` from Python, or append with the Bash tool.

## Line format
```json
{"ts":"2026-10-07T15:30:00-04:00","run":"pricing-r1","phase":"build|options|records|research|launch",
 "artifact":"app/pricing/page.tsx @ pricing","rubric":"page","round":1,
 "scores":{"first_screen":8,"mobile":9},"weighted":82.0,
 "page_rubric":{"avg":8.1,"min":7,"banned_patterns":[]},
 "hard_gates":{"no_invented_facts":true},
 "claims":"PASS|BLOCK","verdict":"KEEP|REVISE|DROP|ESCALATE","fixes":["..."],
 "judge":"judge","evidence_dir":"qa/evidence/pricing-r1/"}
```

| Field | Rule |
|---|---|
| `ts` | ISO 8601 with offset |
| `run` | short id shared by every line of one loop or batch |
| `artifact` | path or URL plus slug, enough to find the exact thing scored |
| `rubric` | file name without `.yaml` |
| `scores` | every criterion in the rubric, no omissions |
| `page_rubric` | page builds only; omit otherwise |
| `claims` | result of the banned-claims / banned-words check |
| `verdict` | `ESCALATE` when the loop stopped (3 rounds, or gain below the threshold) without passing |
| `fixes` | the judge's list (≤ 8), verbatim |

## Reading it
- Latest verdict per artifact = the last line with that `artifact`.
- A batch is done when every artifact's latest line is `KEEP` or `ESCALATE`.
- Tournament results get one line per match: `{"ts","run","phase":"tournament","a","b","winner","margin","reason"}`.
