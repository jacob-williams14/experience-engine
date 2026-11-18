# Spec: Robustness & Code Quality Cleanup

- **Status:** done — test suite added 2026-11-18 (`bun test`, `test/`)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-11-18

> **2026-06-23:** the actionable items are done (dead config removed, `@types/bun` pinned, voiceCache
> ESM fixed, rtk gotcha documented) or made obsolete by the skills migration (retry/timeouts,
> stale-cache abort, validation stubs, fragile generators). The only thing left is a **test suite**
> for the deterministic survivors (`extractGitData`, `processBacklog`, `voiceCache`, `buildIndex`),
> intentionally deferred until the tool is shared or grows.

## Summary

The broader engineering cleanup surfaced by the audit: finish or remove dead scaffolding, add tests,
implement the retry/timeout logic that's already half-wired, refresh dependencies, and fix a handful
of fragile patterns. Scope here depends on `skills-migration.md` — if generators become skills, some
of these files get deleted instead of fixed.

## Motivation

The codebase is readable and typed, but the audit flagged gaps that matter once these tools are
relied on for real job-search artifacts:

- ~~**Empty scaffolding:** `tools/validateArtifacts.ts` and `scripts/validateOutput.ts` are TODO-only
  stubs.~~ **Done 2026-06-23:** both deleted in the skills migration. The *deterministic* validators
  that should replace them (schema, confidentiality, structure checks) are scoped in
  [artifact-validation.md](./artifact-validation.md) along with the model-based verify loop.
- **No tests:** zero coverage for git parsing, CSV processing, AI-response parsing, or cache
  lifecycle.
- ~~**Unused reliability config:** `CONFIG.MAX_RETRIES` is defined but never used.~~ **Done
  2026-06-23:** removed the dead `MAX_RETRIES` / `RATE_LIMIT_DELAY` / `PROJECT_SUMMARIES_DIR`
  constants from `lib/config.ts`. (Retry/backoff/timeouts on AI calls are moot — there are no AI
  calls; no API path.)
- **Stale deps:** ~~`@anthropic-ai/sdk` (~0.63), Vercel `ai` (^4)~~ removed 2026-06-23 (the AI-SDK
  layer is gone), along with `@ai-sdk/openai` and `zod`. **`@types/bun` pinned to `^1.2.21`
  (2026-06-23.)** Remaining runtime deps (`cheerio` / `csv-parser` / `yaml` / `@inquirer/*`) are
  current and in use.
- ~~**Fragile patterns (in surviving code):** `lib/voiceCache.ts` mixes `require("fs")` into ESM.~~
  **Fixed 2026-06-23:** replaced both `require("fs").statSync` calls with a top-level
  `import { statSync } from "fs"`; verified at runtime. (The `generateBio` shuffle and
  `analyzeAuthorStyle` JSON-escaping issues were deleted with their files.)

### Found during the 2026-06-23 canonical-path run (local mode)

Running `generateAtomicExperience.ts` in `local` mode to emit the canonical prompt surfaced three
concrete failures, all of which made the no-API path unusable until worked around by hand:

- ~~**Stale voice cache can't fall back in local mode**~~ — **Resolved 2026-06-23:** the
  refresh-and-abort logic lived in `lib/voiceHelper.ts`, which was deleted in the skills migration.
  The `voice-signature` skill now handles staleness by design (use the cached signature, warn, refresh
  only on request), so a stale cache no longer aborts anything. (`lib/voiceCache.ts`'s own ESM bug was
  also fixed — see above.)
- ~~**Output/input location collision** in the old `discoverLinkedInFiles()` synthesizer flow.~~
  **Resolved 2026-06-23:** the synthesizer and the entire `linkedin-experience/` directory were
  deleted; the bank reads only from `project-experience-summaries/`, so there's no shared input/output
  dir to collide.
- ~~**rtk hook strips quoted CLI args.**~~ **Documented 2026-06-23:** added a "Quoting gotcha" note
  to `AGENTS.md` — run scripts that take quoted args from a wrapper file (quotes preserved) rather
  than inline shell.

## Tests (added 2026-11-18)

`bun test` runs `test/*.test.ts` against small fixtures in `test/fixtures/` (never the live bank).
`lib/voiceCache.ts` was deleted as unused instead of tested. The original plan: add a test runner (Bun's built-in `bun test`) covering the deterministic survivors:
`tools/extractGitData.ts`, `tools/processBacklog.ts`, `lib/voiceCache.ts`, and
`experience-bank/buildIndex.ts`. Skill behavior isn't unit-testable (the model-judgment validation
lives in `artifact-validation.md`).

Everything else originally in this spec is done or obsolete (see the status note above) — the design
steps about validation stubs, retry/timeouts, and fragile generators no longer apply because those
files were deleted in the skills migration.

## Open questions

- Is a test suite worth it at all for a solo tool, or defer indefinitely until it's shared?
