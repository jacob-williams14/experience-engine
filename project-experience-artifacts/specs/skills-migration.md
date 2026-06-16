# Spec: Migrate Generators to Claude Code Skills

- **Status:** next (queued for a future branch)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-16

## Summary

Convert the AI-generator tools from API-backed scripts into **Claude Code Skills** that Claude Code
executes directly. Keep the deterministic data-prep code as plain scripts the skills call. This lets
us delete the multi-provider AI-SDK layer rather than maintain it.

## Motivation

The repo's real value is its prompt engineering (confidentiality scrubbing, brevity rules, voice
override, role/company lenses in `createSynthesisPrompt`), not the SDK plumbing. When we work inside
Claude Code with no API budget, Claude Code *is* the model — so `lib/ai.ts`, `lib/claude.ts`,
`lib/aiConfig.ts`, and `.ai-config.json` (plus their stale model IDs and pricing tables) become
optional dead weight. Skills make each generator a one-step capability in any future session and
remove the maintenance burden the audit flagged.

## Design

Tool → Skill mapping:

| Tool today | Becomes | Notes |
| --- | --- | --- |
| `generateAtomicExperience` + `generateLinkedInExperience` | `experience-synthesizer` skill | Port `createSynthesisPrompt` rules verbatim into the SKILL.md |
| `generateBio` | `professional-bio` skill | |
| `analyzeProject` (+ `extractGitData`, `processBacklog`) | `project-summary` skill | Skill calls the parsers; parsing stays deterministic |
| `analyzeAuthorStyle` / `voiceHelper` / `voiceCache` | `voice-signature` skill | Reconcile with the global `de-ai-text` skill to avoid overlap |
| resume (deferred) | resume skill | See `resume-generator.md` |

Stays as plain scripts (deterministic, no model needed): `extractGitData`, `processBacklog`,
`getPosts`, `htmlToMarkdown`, voice-cache read/write.

Safe to delete once the skills land and are validated: `lib/ai.ts`, `lib/claude.ts`,
`lib/aiConfig.ts`, `.ai-config.json`, and the empty `validateOutput.ts` / `validateArtifacts.ts`
stubs.

## Open questions

- Project-level skills (`.claude/skills/` in this repo) vs. user-level skills (shareable across
  projects)? Probably project-level, given the source data lives here.
- Keep an optional API path at all for batch/headless runs, or go skills-only?
- How much of each prompt belongs in SKILL.md vs. a referenced template file?
