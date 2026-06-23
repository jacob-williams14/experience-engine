# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project does
not use formal version numbers yet; changes are grouped by branch/date under `Unreleased` until a
versioning scheme is adopted.

## [Unreleased]

### Added

- **Experience bank** (`experience-bank/`): `claims.yaml` with **53 tagged, confidentiality-safe
  claims** pulled from `project-experience-summaries/*` (the generated upstream layer), plus
  `README.md`. The bank is the source of truth; documents are renders over it.
- **Bank index renderer**: `experience-bank/buildIndex.ts` (`bun run buildBankIndex`) generates
  `experience-bank/index.md`, a browsable grouped view. Adds the `yaml` dependency.
- **Claude Code skills**: `.claude/skills/experience-bank/` (extract + maintain the bank) and
  `.claude/skills/tailored-render/` (render LinkedIn/resume/JD documents from the bank) — the
  `skills-migration` work landing.
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

### Changed

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
