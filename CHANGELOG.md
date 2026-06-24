# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project does
not use formal version numbers yet; changes are grouped by branch/date under `Unreleased` until a
versioning scheme is adopted.

## [Unreleased]

### Added — KB contract rewire (Phase 3): worklog → bank enrichment

- **Worklog→bank enrichment mode on the `experience-bank` skill** — reads
  `brainspace/WorkLife/atomic/worklog/`, proposes `kind: non-technical` claims (decisions, mentoring,
  process — the "why") for Jacob's approval, then writes the approved ones. Agent-driven, no API.
- **Idempotency by `source:`** — each non-technical claim records the worklog filename it came from;
  entries already cited are skipped (survives backfill). `meta.worklog_enriched_through` added as an
  advisory cursor. Documented both fields in `claims.yaml`'s header; skips `kind: handoff` entries.
- **Decision:** `project-summary` does **not** read the worklog — the "why" enters the bank only via
  the worklog→non-technical path, preserving the Phase 2 two-kinds/two-sources split. See
  `specs/kb-contract-rewire.md` (Phase 3).

### Added — KB contract rewire (Phase 2): technical / non-technical bank

- **Tagged every bank claim with `kind: technical | non-technical`** (53 technical pulled from the
  project summaries; the 3 `style-*` working-style claims are the non-technical seeds). Non-technical
  claims are the "why" (decisions, mentoring, process) and are captured forward from the worklog;
  documented the field in `claims.yaml`'s header and the `experience-bank` skill schema.
- **Bank index now groups by `kind`** (top-level `## Technical` / `## Non-technical`, with domains
  nested beneath); `buildIndex.ts` surfaces both and reports the kind split. See
  `specs/kb-contract-rewire.md` (Phase 2).

### Changed (structure) — KB contract rewire (Phase 1)

- **Migrated all durable state out of the repo into the brainspace knowledge base.** The repo is now
  pure processing per the contract in `brainspace/WorkLife/self/notes/knowledge-base.md`. Moved:
  `datasources/*` → `brainspace/data/{git-logs,backlogs}/`; `data/posts-md/*` (4703) →
  `brainspace/data/voice-samples/`; `project-experience-summaries/*` (5) →
  `brainspace/artifacts/project-summaries/`; `experience-bank/{claims.yaml,index.md}` →
  `brainspace/artifacts/contributions/`. Raw downloaded posts (`data/posts/`) became the repo-local
  intermediate `.tmp/posts/`. `voice-cache/` stays in the repo. Removed the emptied `datasources/`,
  `project-experience-summaries/`, and `data/` dirs. See `specs/kb-contract-rewire.md`.
- **Centralized paths in `lib/config.ts`**: added the resolved `KB` zone-path object and
  `BRAINSPACE_ROOT` env var (default `~/Projects/brainspace`); repointed `PROCESSED_DATA_DIR` to the
  non-durable `.tmp/processed`.
- **Repointed all I/O** to the KB: `getPosts.ts` (`.tmp/posts/`), `htmlToMarkdown.ts` (reads
  `.tmp/posts/`, writes `KB.VOICE_SAMPLES`), `experience-bank/buildIndex.ts` (reads/writes
  `KB.CONTRIBUTIONS`, replacing the `import.meta.url` resolution), and the help-text examples in
  `tools/extractGitData.ts` + `tools/processBacklog.ts`.
- **Repointed all four skills** (`project-summary`, `experience-bank`, `tailored-render`,
  `voice-signature`) to the brainspace zones; refreshed `AGENTS.md`, `README.md`, and
  `experience-bank/README.md` (now documents the renderer; the bank data lives in the KB). Added
  `.tmp/` to `.gitignore` and dropped the stale `data` ignore.

### Changed (structure)

- **Flattened the repo.** Moved everything from `project-experience-artifacts/` to the repo root and
  removed the directory — this is a single-project repo, not a monorepo. Merged the project README
  into the root README and stripped the `project-experience-artifacts/` path prefix from the skills,
  `AGENTS.md`, and README. See `specs/repo-flatten.md`. (Paths in this changelog's older entries
  reference the pre-flatten layout.)

### Added

- **Experience bank** (`experience-bank/`): `claims.yaml` with **53 tagged, confidentiality-safe
  claims** pulled from `project-experience-summaries/*` (the generated upstream layer), plus
  `README.md`. The bank is the source of truth; documents are renders over it.
- **Bank index renderer**: `experience-bank/buildIndex.ts` (`bun run buildBankIndex`) generates
  `experience-bank/index.md`, a browsable grouped view. Adds the `yaml` dependency.
- **Claude Code skills** (one per operation, directly invokable): `.claude/skills/project-summary/`
  (datasources → summary), `.claude/skills/experience-bank/` (summary → claims; maintain the bank),
  `.claude/skills/tailored-render/` (render LinkedIn/resume/JD), `.claude/skills/voice-signature/`
  (writing voice). The `skills-migration` work landing.
- `specs/render-rules-reference.md` — preserved the `createSynthesisPrompt` phrasing rules (now used
  by the `tailored-render` skill) before deleting the synthesizer.
- LinkedIn profile artifact: `project-experience-artifacts/linkedin-experience/jacob-williams-linkedin-profile.md`
  (Headline variants, About section, refreshed Atomic Object Experience entry) — generated directly
  by Claude Code with no API usage.
- `specs/experience-bank.md` — new primary direction: a tagged **claim bank** as the source of truth
  with cheap, target-specific **renders** (LinkedIn/resume/JD) on top, replacing the profile-centric
  framing. Reconciled across `linkedin-profile.md` (superseded), `skills-migration.md` (reframed to
  `experience-bank` + `tailored-render` skills), and `resume-generator.md` (now a render target).
- `project-experience-artifacts/specs/` — individual, trackable spec files: `linkedin-profile.md`,
  `skills-migration.md`, `resume-generator.md`, `model-sdk-modernization.md`,
  `robustness-and-quality.md`.
- `project-experience-artifacts/specs/STATUS.md` — active-status tracker indexing all specs.
- `CHANGELOG.md` (this file).

- **`voice-signature` skill** (`.claude/skills/voice-signature/`) — produces/refreshes the writing
  voice from blog posts, including optional year-by-year style-evolution analysis (the preserved
  `analyzeStyleOverTime` capability).
- `specs/project-summary-rules-reference.md` — preserved the `analyzeProject` summary template/
  framework so the `experience-bank` skill generates new summaries at the same depth and structure.

### Removed

- Retired the synthesizer `generateAtomicExperience.ts` (both copies) and its output artifacts
  (`jacob-williams-linkedin-profile.md`, `jacob-williams-atomic-object-experience.md`). Its premise —
  compress all claims into 4 generic bullets — was wrong; its rules are preserved in
  `specs/render-rules-reference.md`. The per-project `*-linkedin-experience.md` files are kept as
  bank input.
- **Completed the skills migration — deleted the entire AI-SDK/provider layer and all AI generator
  scripts (16 files):** `lib/ai.ts`, `lib/claude.ts`, `lib/aiConfig.ts`, `.ai-config.json`,
  `scripts/configureAI.ts`, `lib/voiceHelper.ts`, `scripts/analyzeAuthorStyle.ts`,
  `scripts/analyzeStyleOverTime.ts`, `generateProjectSummary.ts` + `scripts/analyzeProject.ts`,
  `generateBio.ts` (+`scripts/`), `generateLinkedInExperience.ts` (+`scripts/`), and the empty
  `scripts/validateOutput.ts` / `tools/validateArtifacts.ts` stubs. Project-summary and
  style-evolution generation capability is preserved via skills + reference docs; per-project-bullet
  and bio generation were intentionally dropped (their existing artifacts remain as data).
- Removed now-unused dependencies: `@anthropic-ai/sdk`, `@ai-sdk/openai`, `ai`, `zod`.
- Deleted `linkedin-experience/` (5 per-project bullet files — redundant with the bank, carried stale
  tool headers, and leaked un-anonymized client names) and `professional-bios/` (superseded by the
  bank + voice; its one distinct nuance was folded into a working-style claim first). Removed the now
  orphaned `BIO_OUTPUT_DIR` config constant.
- **Stale-resource cleanup:** deleted `resources/atomic-values/` (company boilerplate),
  `resources/strengths/` (distilled into the bank first — see below), `archive/` (old prompts/bios/
  examples), and `future-ideas/` (superseded by `specs/`). Also removed local junk:
  `enriched-style-summaries-*.json`, `locally-generated-prompts/`, stray `.DS_Store`.

### Changed

- Folded CliftonStrengths into the bank as three `working style / approach` claims (replacing the raw
  `resources/strengths/*.txt`); `tailored-render` uses them for About/summary renders. Bank now 56
  claims across 5 domains.
- Rewrote `project-experience-artifacts/README.md` to document the bank+skills architecture (the old
  one described the removed AI-generator system).
- **Consolidated agent docs into a single `AGENTS.md`** (repo root) as the source of truth; `CLAUDE.md`
  imports it (`@AGENTS.md`) and `WARP.md` points to it, so all agents share one set of instructions.
  Refreshed the root `README.md` and removed the stale per-project `CLAUDE.md` (now covered by root).
- LinkedIn profile Experience section regenerated from the **canonical synthesizer prompt** (run in
  `local` mode, no API) instead of a freehand draft. Removed a fabricated metric ("hundreds of
  thousands of cases") that the prompt's own rules forbid.
- `scripts/generateAtomicExperience.ts` `createSynthesisPrompt`: added a **required, reproducible
  keyword rule** — every bullet ends with a parenthetical tech-stack tag drawn only from that
  bullet's source material (e.g. "(React Native, Expo, Stripe)"). Reconciles the standing tension
  where the prompt asked to keep recruiter keywords but the brevity rules evicted them, so reruns now
  consistently surface the stack. Tags applied to the profile's Experience bullets.

### Notes

- Audit of the repo identified the AI-SDK layer (`lib/ai.ts`, `lib/claude.ts`, `lib/aiConfig.ts`)
  as a generation behind and a candidate for removal once generators become Claude Code skills. See
  `specs/skills-migration.md` and `specs/model-sdk-modernization.md`.
- The committed career artifacts are treated as the quality baseline; regenerated artifacts are
  adopted only when clearly better.
- A 2026-06-23 canonical-path test run (local mode) confirmed real prompt drift and three no-API
  reliability bugs (stale voice-cache can't fall back, output/input directory collision, rtk arg-quote
  stripping). Logged in `specs/robustness-and-quality.md` and `specs/skills-migration.md`.
