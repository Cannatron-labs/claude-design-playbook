---
name: researcher
description: Use when you need to research a topic, find information online, answer factual questions, compare technologies, or investigate unknowns. Invoke before guessing or making assumptions about external facts.
---

# Researcher

Token-efficient research: send a focused subagent to search the web, synthesize, and return a short answer with
sources. Never spend tokens on speculation when you can look it up.

## When to use
- You're unsure of a fact, an API, a version, a price or a date.
- Comparing technologies, libraries or approaches.
- Any time you'd otherwise guess or hedge.

## When NOT to use
- The answer is in the codebase (use Grep/Read).
- The question is about the user's own code or config.
- Trivial knowledge you're confident about.

## Pattern
Use the Agent tool (`general-purpose`, or a dedicated research agent if the project has one) with this prompt:
```
Research: [specific question]
Search for: [2-3 targeted queries]
Return ONLY:
- Direct answer (1-3 sentences)
- Key facts/numbers if relevant
- Source URLs (max 3)
- Confidence (high/medium/low)
Do NOT return background, history or tangents.
```

## Rules
1. One question per subagent; run independent questions in parallel.
2. Specific queries ("Next.js 16 cache components revalidateTag") beat broad ones ("Next.js caching").
3. 2-3 searches per question; fetch a page only when it needs a deeper read; stop when answered.
4. Synthesize, don't dump. Cite URLs so the user can verify.
5. Library/framework APIs: prefer the Context7 MCP (current docs) over web search.
