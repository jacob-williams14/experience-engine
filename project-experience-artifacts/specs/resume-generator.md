# Spec: Resume / CV Generator

- **Status:** deferred (design captured; build later)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-16

## Summary

A generator that synthesizes an ATS-friendly resume from the existing project summaries, strengths,
and voice signature, plus a new facts file. Deferred for now — this spec exists so it can be picked
up later without re-deriving the design. Build it as a Skill (see `skills-migration.md`), not an API
tool.

## Motivation

The repo has no resume/CV generator, and it's the other core job-search document alongside the
LinkedIn profile. Holding it as a written spec keeps the current branch lean while making the future
build a fill-in-the-blanks job.

## Design

- **Inputs:**
  - `project-experience-summaries/*` — experience bullets per engagement (already exist).
  - `resources/strengths/*` — for the summary/profile section.
  - `voice-cache/jacob-williams-voice.json` — tone.
  - **New** `inputs/resume-facts.md` — the hard facts the repo doesn't store: contact line,
    location / remote preference, exact Atomic Object title history with start/end dates, education,
    certifications, and the target role(s) to tailor toward.
- **Output:** `resumes/jacob-williams-resume.md` — ATS-friendly sections (summary, skills,
  experience synthesized per-project with the same client-confidential phrasing the Atomic prompt
  uses, education), tailored to a stated target role.
- **Shape:** mirror `generateAtomicExperience` / `generateBio` — options interface → loader →
  prompt builder → generate → output. As a Skill, the "generate" step is Claude Code itself.

## Open questions

- Multiple resume variants per target role, or one master + tailoring notes?
- One-page vs. two-page constraint, and how strictly to enforce it.
- How to keep `resume-facts.md` in sync with the LinkedIn profile so they never contradict.
- Markdown-only, or also export to PDF/DOCX for actual submission?
