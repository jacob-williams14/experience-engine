# Spec: LinkedIn Profile Generation

- **Status:** active (delivered on this branch)
- **Branch:** `add-linkedin-project-generation` (this one)
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-16

## Summary

Produce the two LinkedIn assets the repo never generated — a **Headline** and an **About**
section — plus a refreshed **Experience** entry, written directly by Claude Code (no API) from the
existing source artifacts. Output lives at
`linkedin-experience/jacob-williams-linkedin-profile.md`.

## Motivation

The pipeline already produces per-project LinkedIn bullets and a synthesized Atomic Object
Experience entry, but a complete LinkedIn profile also needs a headline and an About section. With
the job search starting, those are the highest-value missing pieces. The committed Experience entry
is good and is treated as the quality control — the refresh only ships if it's clearly as good or
better.

## Design

- **Inputs:** `professional-bios/jacob-williams-professional-bio.md`,
  `project-experience-summaries/*`, `linkedin-experience/*-linkedin-experience.md`,
  `voice-cache/jacob-williams-voice.json`, `resources/strengths/*`.
- **Playbook:** reuse the rules encoded in
  `scripts/generateAtomicExperience.ts:createSynthesisPrompt` — client confidentiality (only
  "Atomic Object" named, clients described by domain), brevity, voice override, role/company lenses.
- **Generation mode:** done inline by Claude Code. No API keys, no generator script run.
- **Quality gate:** new copy is drafted alongside the existing
  `jacob-williams-atomic-object-experience.md`; adopt only if clearly better. The new file never
  overwrites the existing entry.

## Open questions

- Confirm tenure ("nearly four years") and exact Atomic title history before publishing.
- How buttoned-up should the About be? Current draft leans into Jacob's blog voice.
- Do we want company-lens variants of the profile (startup vs. enterprise) later?
