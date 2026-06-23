# Spec: Migrate Generators to Claude Code Skills

- **Status:** done (on the `experience-bank` branch)
- **Branch:** `experience-bank`
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

> **Done (2026-06-23):** three skills built — `.claude/skills/experience-bank/` (generate summaries +
> extract/maintain claims), `.claude/skills/tailored-render/` (render documents),
> `.claude/skills/voice-signature/` (writing voice, incl. optional style-evolution). The entire
> AI-SDK/provider layer and all AI generator scripts were deleted (16 files): `lib/ai.ts`,
> `lib/claude.ts`, `lib/aiConfig.ts`, `.ai-config.json`, `configureAI`, `voiceHelper`,
> `analyzeAuthorStyle`, `analyzeStyleOverTime`, `generateProjectSummary` + `analyzeProject`,
> `generateBio` (x2), `generateLinkedInExperience` (x2), and the empty validate stubs. Prompt IP
> preserved in `specs/project-summary-rules-reference.md` and `specs/render-rules-reference.md`.
> Unused deps removed (`@anthropic-ai/sdk`, `@ai-sdk/openai`, `ai`, `zod`). `model-sdk-modernization`
> is now obsolete.

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

**Evidence (2026-06-23): drift is real, not hypothetical.** With no API, the no-API workflow is
"read `createSynthesisPrompt` and follow it freehand." When we actually compared that freehand output
against the *canonical* prompt the tool emits in local mode, the freehand version had **fabricated a
metric** ("hundreds of thousands of cases") that the canonical prompt explicitly forbids (its "do not
invent metrics" rule). Same author, same intent, divergent output — because the rules lived in a file
that wasn't being executed, only paraphrased. A skill collapses the two prompts into one executed
artifact, so the model (me, you, or the API) always runs the identical, rule-enforced prompt. This is
the core argument for the migration: the prompt *is* the IP, and a skill is how it actually governs
every run instead of being approximated from memory.

## Design

> **2026-06-23 — reframed by [experience-bank.md](./experience-bank.md).** The migration is NOT a
> 1:1 port of today's generators. The new product is a tagged claim **bank** with cheap **renders**
> on top, so the skills are organized around bank vs. render, and the old per-document generators
> collapse into the `tailored-render` skill (each becomes a render target, not its own skill).

Tool → Skill mapping (bank + render model):

| Tool(s) today | Becomes | Notes |
| --- | --- | --- |
| `analyzeProject` (+ `extractGitData`, `processBacklog`) feeding into per-project bullets | `experience-bank` skill | Extract + normalize + tag claims into the structured bank; parsing stays deterministic scripts the skill calls |
| `generateAtomicExperience` + `generateLinkedInExperience` + `generateBio` (+ resume) | `tailored-render` skill | One render skill, many targets (LinkedIn entry/About/Headline, resume, JD-tailored set). Carries the `createSynthesisPrompt` rules — confidentiality, brevity, voice, lenses, no-invented-metrics, the reproducible tech-stack tag |
| `analyzeAuthorStyle` / `voiceHelper` / `voiceCache` | `voice-signature` skill | Feeds tone into `tailored-render`; reconcile with the global `de-ai-text` skill to avoid overlap |

Stays as plain scripts (deterministic, no model needed): `extractGitData`, `processBacklog`,
`getPosts`, `htmlToMarkdown`, voice-cache read/write, and the **bank → markdown index renderer**.

Safe to delete once the skills land and are validated: `lib/ai.ts`, `lib/claude.ts`,
`lib/aiConfig.ts`, `.ai-config.json`, and the empty `validateOutput.ts` / `validateArtifacts.ts`
stubs.

## Open questions

- Project-level skills (`.claude/skills/` in this repo) vs. user-level skills (shareable across
  projects)? Probably project-level, given the source data lives here.
- Keep an optional API path at all for batch/headless runs, or go skills-only?
- How much of each prompt belongs in SKILL.md vs. a referenced template file?
