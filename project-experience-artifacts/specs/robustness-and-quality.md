# Spec: Robustness & Code Quality Cleanup

- **Status:** next (queued for a future branch)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-16

## Summary

The broader engineering cleanup surfaced by the audit: finish or remove dead scaffolding, add tests,
implement the retry/timeout logic that's already half-wired, refresh dependencies, and fix a handful
of fragile patterns. Scope here depends on `skills-migration.md` — if generators become skills, some
of these files get deleted instead of fixed.

## Motivation

The codebase is readable and typed, but the audit flagged gaps that matter once these tools are
relied on for real job-search artifacts:

- **Empty scaffolding:** `tools/validateArtifacts.ts` and `scripts/validateOutput.ts` are TODO-only
  stubs that exit with "not implemented."
- **No tests:** zero coverage for git parsing, CSV processing, AI-response parsing, or cache
  lifecycle.
- **Unused reliability config:** `CONFIG.MAX_RETRIES` is defined but never used; no retry/backoff;
  no timeouts on AI calls.
- **Stale deps:** `@anthropic-ai/sdk` (~0.63), Vercel `ai` (^4, v5 may break), floating
  `@types/bun: latest`.
- **Fragile patterns:** `lib/voiceCache.ts` mixes `require("fs")` into ESM; `generateBio.ts` uses a
  biased `Math.random()` shuffle; `analyzeAuthorStyle.ts` does manual, lossy JSON escaping and
  fragile markdown-fence stripping; `RATE_LIMIT_DELAY` is inconsistent (100 vs 1000).

## Design

Sequence after the skills decision, because it changes the target set:

1. Decide per file: delete (superseded by a skill) vs. fix.
2. For surviving code: finish or delete the validation stubs; add a test runner (Bun's built-in test
   or Vitest) covering parsers and cache; implement retry/backoff + timeouts in the AI path (if an
   API path survives).
3. Dependency pass: `bun outdated`, bump and smoke-test; pin `@types/bun`.
4. Pattern fixes: ESM-only imports, Fisher–Yates shuffle, `JSON.stringify` for escaping, single
   source of truth for rate-limit/constants.

## Open questions

- Which files survive the skills migration and are therefore worth fixing at all?
- Test framework: Bun test vs. Vitest?
- Is cost tracking in `analyzeAuthorStyle.ts` worth keeping, or remove it?
