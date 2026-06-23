---
name: voice-signature
description: >-
  Produce or refresh Jacob's writing-voice signature from his blog posts, for use by the
  tailored-render skill. Use when asked to analyze/refresh his voice, regenerate the voice signature,
  or when a render needs an up-to-date voice and the cache is stale. Triggers on "refresh my voice",
  "analyze my writing style", "update the voice signature".
---

# Voice Signature

Produces the voice signature `tailored-render` applies so documents sound like Jacob. The signature
is cached at `project-experience-artifacts/voice-cache/jacob-williams-voice.json`.

## No API

You (Claude Code) are the model. Read the posts and write the signature directly — do not call any
API or the (removed) AI-SDK layer.

## Inputs

Jacob's Atomic Spin blog posts, in markdown, under `project-experience-artifacts/data/posts-md/`.
If that directory is empty or missing, regenerate it first:

```bash
cd project-experience-artifacts
bun run getPosts        # download posts
bun run htmlToMarkdown  # convert to markdown
```

## Process

1. Read a representative sample of the posts in `data/posts-md/` (aim for 10+; more is better).
2. Analyze the voice: structural patterns, sentence rhythm, characteristic phrases, tone, humor,
   how ideas connect, audience relationship. Capture what makes it recognizably *his*, not generic.
3. Write the signature as markdown following the structure of the existing
   `voice-cache/jacob-williams-voice.json` (that file is the format exemplar — sections like Core
   Identity, Structural DNA, Sentence-Level Rhythms, Distinctive Word Choices, Tonal Signature, and a
   final "Writing Guidance Summary" of actionable bullets).
4. Write the JSON to `voice-cache/jacob-williams-voice.json` with fields:
   `authorName`, `voiceSignature` (the markdown), `lastUpdated` (ISO date), `sourcesAnalyzed`.
   `lib/voiceCache.ts` holds the read/write helpers if you prefer to go through code.

## Optional: style-evolution analysis (richer signature)

For a deeper signature, analyze the posts **by year** before writing the summary — this is the
preserved capability from the retired `analyzeStyleOverTime` tool. Group `data/posts-md/` posts by
year and, per year, capture: `structurePattern`, `toneDescription`, `commonThemes[]`, `perspective`,
`style`, `devices[]`, `depth`, `audience`. Write the per-year array to
`enriched-style-summaries-<author>-<timestamp>.json` (the existing files are the format exemplar),
then fold the evolution (what's consistent across years, what matured) into the voice signature's
"Evolution Markers" section. Use this when Jacob wants the fuller treatment; the standard per-post
analysis above is fine otherwise.

## Freshness

The cache is considered current for ~3 months. Refresh when it's older than that, or when Jacob asks.
Don't refresh on every render — `tailored-render` reads the cached signature.

## Relationship to `de-ai-text`

This skill captures Jacob's *positive* voice for generating new copy. The global `de-ai-text` skill
strips AI tone from existing text. Use this one to write in his voice; use `de-ai-text` to clean up
text that already exists. Don't duplicate the de-AI rules here.
