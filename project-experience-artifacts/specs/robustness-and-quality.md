# Spec: Robustness & Code Quality Cleanup

- **Status:** next (queued for a future branch)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

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

### Found during the 2026-06-23 canonical-path run (local mode)

Running `generateAtomicExperience.ts` in `local` mode to emit the canonical prompt surfaced three
concrete failures, all of which made the no-API path unusable until worked around by hand:

- **Stale voice cache can't fall back in local mode.** When `voice-cache/<author>-voice.json` is
  older than the 3-month TTL (`lib/voiceCache.ts` / `lib/voiceHelper.ts`), `getVoiceAnalysis` tries
  to *refresh* it, which calls `analyzeAuthorStyle` → `generateAIText`, which returns null/errors in
  local mode ("AI provider is set to 'local' mode"). The existing catch only falls back to cache when
  `cacheStatus.exists` is true, but the throw from `analyzeAuthorStyle` ("No posts could be
  successfully analyzed") propagates past it and aborts the whole run. **Fix:** in local mode, treat a
  present-but-stale cached signature as a valid input (use it, warn, don't refresh); never let voice
  refresh failure abort prompt generation. Workaround used this time: temporarily bumped the cache
  `lastUpdated` to "now" (reverted after).
- **Output/input location collision.** The finished artifact
  `linkedin-experience/jacob-williams-linkedin-profile.md` lives in the same directory
  `discoverLinkedInFiles()` scans for per-project *sources*, so `--all` ingested it as a project and
  fed truncated garbage bullets into the synthesis prompt. **Fix:** separate inputs from outputs
  (distinct dirs, or a filename convention / front-matter marker that `discoverLinkedInFiles`
  filters on, e.g. only `*-linkedin-experience.md`).
- **rtk hook strips quoted CLI args.** Through the shell proxy, `--developer "Jacob Williams"` arrives
  as `Jacob` (+ stray `Williams`), which silently breaks the cache slug and downstream name handling.
  **Fix (operational):** run these generators from a wrapper script file (quotes preserved) rather
  than inline shell, or via `rtk proxy`. Worth a note in the repo CLAUDE.md / skill instructions.

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
