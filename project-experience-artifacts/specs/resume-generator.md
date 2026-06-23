# Spec: Resume / CV Render

- **Status:** deferred (design captured; build later, as a render target)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

> **2026-06-23 — reframed by [experience-bank.md](./experience-bank.md).** The resume is a **render
> target** of the `tailored-render` skill over the experience bank, not a separate generator. The
> bank supplies the claims (already confidentiality-safe, tagged, dual-register); this spec now only
> covers the resume-specific concerns: the hard-facts file, ATS formatting, page constraints, and
> export. The "mirror `generateAtomicExperience`" shape below is obsolete — it's a render, not a new
> pipeline.

## Summary

The ATS-friendly resume render: select claims from the experience bank, phrase them in the terse
resume register, and combine with hard facts (contact, titles/dates, education) the bank doesn't
hold. Deferred until the bank + `tailored-render` exist; this spec captures the resume-only design so
it's a fill-in-the-blanks job later.

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
- **Shape:** a render target of `tailored-render`, not a new pipeline — select bank claims → resume
  register → merge with `resume-facts.md` → output. The "generate" step is Claude Code itself.

## Open questions

- Multiple resume variants per target role, or one master + tailoring notes?
- One-page vs. two-page constraint, and how strictly to enforce it.
- How to keep `resume-facts.md` in sync with the LinkedIn profile so they never contradict.
- Markdown-only, or also export to PDF/DOCX for actual submission?
