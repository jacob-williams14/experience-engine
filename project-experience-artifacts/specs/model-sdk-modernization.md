# Spec: Model & AI-SDK Modernization

- **Status:** next (queued for a future branch)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-16

## Summary

If the API path is kept, bring it current: refresh model IDs to the latest Claude generation, fix a
stale default, and update cost-tracking data. **May be obsoleted** by `skills-migration.md` — decide
which path to commit to before building, since skills remove the need for this layer entirely.

## Motivation

The audit found the API path is a generation behind and carries dead configuration:

- `.ai-config.json` defaults to `claude-sonnet-4-5-20250929` (Sept 2025).
- `lib/claude.ts` `CLAUDE_MODELS` tops out at 4.5/4.1 and its `generateTextWithClaude` default
  parameter is a *stale* `SONNET_3_5_LATEST` — anything relying on the default silently runs an old
  model.
- `scripts/analyzeAuthorStyle.ts` has hardcoded model IDs and a 2024 pricing table used for cost
  estimates.

## Design

Only pursue if we keep an API path after `skills-migration.md` is decided. Then:

- `.ai-config.json`: update the `claude` block to current IDs (e.g. Opus 4.8 for
  `creative`/`detailed`, Sonnet 4.6 for `default`/`concise`).
- `lib/claude.ts`: add the current models to `CLAUDE_MODELS`; **fix the stale default param** on
  `generateTextWithClaude`; update `recommendClaudeModel` tiers; prune dead `*_LATEST` 3.5/3.7
  entries.
- `scripts/analyzeAuthorStyle.ts`: refresh model IDs and the pricing table, or drop cost tracking
  if it's not used.
- **Quality gate:** any regenerated artifact must beat its committed control before adoption (the
  model bump is justified only by better output).

## Open questions

- Do we keep the API path at all, or go skills-only (which deletes this whole layer)?
- If kept: is the multi-provider (OpenAI + Claude) abstraction still worth maintaining, or
  Claude-only?
- Pin model IDs, or pull from a single config constant to avoid scatter?
