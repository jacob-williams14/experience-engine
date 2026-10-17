---
name: tailored-render
description: >-
  Render a job-search document from Jacob's experience bank
  (artifacts/contributions/claims.yaml in the knowledge base). Use when asked to produce a LinkedIn
  Experience entry / About / Headline, resume bullets, or a set of bullets tailored to a specific job
  description. Triggers on "render my LinkedIn experience", "make resume bullets", "tailor my
  experience to this job", "draft an About section".
---

# Tailored Render

Turn bank claims into a target document. The bank
(`~/Projects/brainspace/artifacts/contributions/claims.yaml`) is the source of truth; a render is a
cheap, disposable VIEW. Never edit the bank to make a render look better — fix the bank via the
`experience-bank` skill, then re-render.

> **Paths.** The bank lives in the knowledge base, rooted at `~/Projects/brainspace/` (override with
> `$BRAINSPACE_ROOT`). Saved renders go to `artifacts/linkedin/` or `artifacts/bio/`. The voice cache
> stays repo-local (`voice-cache/`).

## No API

You (Claude Code) are the model. Do not call the AI-SDK layer or any API. Read the bank and write the
render directly.

## Steps

1. **Read** `~/Projects/brainspace/artifacts/contributions/claims.yaml`. (The browsable
   `index.md` alongside it is a quick overview, but render from the YAML — it has the full text and
   tags.)
2. **Select** claims for the target:
   - LinkedIn Experience entry → ~4 themed claims, lead with `featured` and at least one `hook`.
   - LinkedIn About / Headline → identity + breadth; pull across domains, and lean on the
     `working style / approach` claims (distilled from CliftonStrengths) for the "what drives me" angle.
   - Resume bullets → filter by the target role; terse register.
   - **JD-tailored set** → match the pasted job description against `tech`, `themes`, and `domain`;
     surface the closest claims. Tell the user which claims you picked and why.
3. **Phrase** using the rules in `specs/render-rules-reference.md` —
   read that file and apply it. Key points:
   - Brevity: one concise sentence per bullet.
   - Required tech-stack tag: end each bullet with a parenthetical of that claim's `tech`, e.g.
     "(React Native, Expo, Stripe)" — drawn ONLY from the claim, never invented.
   - Confidentiality: only "Atomic Object" named; clients by domain (the bank is already anonymized —
     keep it that way).
   - No invented metrics or tech. Use a claim's `plain_language` register when the target wants plain
     English; `keyword_rich` when it wants recruiter keywords.
   - Apply Jacob's voice from `voice-cache/jacob-williams-voice.json`
     (read it) as an override so it sounds like him — **long-form only** (a full About, a bio).
     It's a blog voice; its tics ("Here's the thing", binary contrasts, punchy fragments) read as
     AI slop in short copy. For headlines, Experience lines, and bullets, start from his resume
     wording and run `/no-ai-slop` in detect mode on the draft before showing it.
4. **Steer with Jacob.** He curates at this step — "lead with the courts work", "drop that one",
   "more plain-language". His sign-off here is the quality gate. Adopt a render for a real surface
   only if it's clearly as good or better than what he already has.

## Lenses

Pick role/company lenses from `render-rules-reference.md` based on the target (e.g. `tech-lead` +
`general`). For a JD-tailored render, infer the lens from the job description.

## Output

Present the render in chat for review. Only write it to a file if Jacob asks — and when he does, save
under the KB's `artifacts/linkedin/` or `artifacts/bio/`. Never overwrite an existing artifact blind.
