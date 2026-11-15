# Pairwise tournament (kept design options)

Absolute scores bunch at 80-82, and head-to-head matches separate them. On the first real run the highest absolute
score ranked 5th. Same method as the `html-design-options` skill (`references/judging.md`).

## Pairs
- Each kept option plays the 3 options nearest to it by score.
- The top 8 also play a round robin.
- That is about 3N + 28 matches.
- Alternate the A/B order by match index to cancel position bias.

## Each match
- The judge sees, per option, the same screenshots side by side:
  - home 390 fold + full
  - home 1280 fold
  - second page 390 fold + 1280 fold (plus each extra state, e.g. sold out, if the project has one)
- The question: "Which should the owner launch?" The judge returns the winner, a margin of 1-3 and one sentence
  why. Give it the project's tiebreakers explicitly, e.g. "Which second page makes the decision faster on a phone?"
- The judge does not see either builder's notes on quality.

## Rank
- Elo: start each option at 1500 + (score − 80) × 4.
- Run 30 passes over all matches with K = 32 / (1 + pass/5). Weight each result by (0.5 + margin/6).
- Rank by Elo. The weighted score breaks ties.
- Report wins/played. An option with few games (3/3) is less certain; say so.
- Fewer than 5 kept options: rank by wins, and break ties by score.

## Board "why" lines
The main session writes these from the match reasons, one plain sentence each, with no file paths. Example:
"Looks most like a real, warm brand, and the phone shop page fits everything to buy on one screen. Won all 3 of its
matchups." Append one ledger line per match (see `ledger.md`).
