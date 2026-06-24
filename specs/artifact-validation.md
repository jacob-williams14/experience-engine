# Spec: Artifact Validation + Generate/Verify Loop

- **Status:** deferred (future idea — pick up in the audit/robustness phase)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

## Summary

Validation for generated artifacts (summaries, claims, renders), so batch generation can run in a
**generate → verify loop** that catches problems automatically instead of relying on a human reading
every output. Two halves, deliberately split by what each needs.

## Motivation

The drift we hit earlier — a freehand render fabricating "hundreds of thousands of cases" that the
source never supported — is the exact failure validation should catch. Today the quality gate is a
human at render time. That's fine at current volume (5 projects, reviewed). It stops scaling the
moment Jacob wants to run new projects through `project-summary → experience-bank` in a loop. This is
why the old `validateOutput.ts` / `validateArtifacts.ts` stubs existed (they were never implemented,
and were deleted in the skills migration).

## Design — two halves

### 1. Deterministic validators (scripts/tests, NOT a skill)

Mechanical, fast, no model needed — belongs with the test suite in
[robustness-and-quality.md](./robustness-and-quality.md):

- `claims.yaml` schema validity (required fields, enum values for `scope`/`strength`, `themes`
  contains only themes not scopes).
- Confidentiality scan: no client/product names in claim/summary prose (only "Atomic Object").
- Summary structure check: matches the required headings/order in
  [project-summary-rules-reference.md](./project-summary-rules-reference.md).
- Render checks: tech-stack tag present per bullet; one-sentence brevity.

### 2. Model-based `verify-claim` skill (the loop-enabler)

Judgment that needs a model — the adversarial-verify pattern:

- Input: a claim (or rendered bullet) + its source (summary / datasource).
- Checks: is it actually supported by the source? any invented metric/tech? confidentiality-safe?
- Output: a verdict (supported / unsupported / needs-edit) with the offending span.
- Default to skeptical — flag when uncertain.

### The loop

`project-summary` → `experience-bank` (extract claims) → `verify-claim` (validate each against
source) → keep / flag for review. This is an **orchestration** concern (a workflow), not a single
skill — the verify skill is one stage; the loop is the harness. Deterministic validators run as a
cheap first pass before the model-based stage.

## Relationship to other specs

- The deterministic half (1) is part of `robustness-and-quality.md` (test suite).
- This spec owns the model-based `verify-claim` skill (2) and the generate/verify loop.

## Open questions

- Verdict granularity — per claim, per bullet, per artifact?
- Auto-discard vs. always-flag-for-human on a failed verdict?
- How many independent verifier passes per claim (1 vs. a small majority vote)?
- Run the loop as a built-in Workflow, or a documented manual sequence?
