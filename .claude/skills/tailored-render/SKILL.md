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
     (read it) as an override so it sounds like him. It's a blog voice: apply it to long-form (a
     full About, a bio); for short copy (headlines, Experience lines, bullets) start from his resume
     wording instead. Either way, run `/no-ai-slop` in detect mode on every draft before showing
     it — the voice's tics ("Here's the thing", binary contrasts, punchy fragments) are exactly
     what it flags.
4. **Show the evidence** under the render, in chat only. Jacob does not review the bank claim by
   claim, and enrichment PRs can merge without him, so this is where a claim gets checked: when
   it is about to be used. For every claim the render draws on that has no `verified` date,
   give one line:
   - the bullet it backs and the claim `id`,
   - where it came from: the worklog file in `source`, or the project summary for its `project`,
   - `scope`, and whether it is `agent_assisted` (so "built" is read as "directed and reviewed"),
   - each number in the bullet with where the source states it and any caveat it carries,
   - anything in the source that the claim's wording stretches: a teammate's part, a co-build,
     a result that was partial. Read the source to check; say "source agrees" when it does.

   List already-verified claims in a single line of ids. If a claim's source can't be found or
   doesn't support the wording, say so plainly rather than rendering around it.

   This block names internal things (worklog filenames, project codenames, ticket ids). It is
   for Jacob's eyes in chat and **never** goes into the document or a saved render.
5. **Steer with Jacob.** He curates at this step — "lead with the courts work", "drop that one",
   "more plain-language". His sign-off here is the quality gate. Adopt a render for a real surface
   only if it's clearly as good or better than what he already has.
6. **Record what he checked.** When Jacob accepts the render, set `verified: <today's date>` on
   each unverified claim it used that he did not question, and rebuild the index
   (`bun run buildBankIndex`). When he corrects one ("I co-built that", "that number was one
   run"), fix the **claim** through the `experience-bank` skill, add its `correction` note, then
   re-render; a corrected claim is verified as of the fix. Never patch only the render.

## Lenses

Pick role/company lenses from `render-rules-reference.md` based on the target (e.g. `tech-lead` +
`general`). For a JD-tailored render, infer the lens from the job description.

## Output

Present the render in chat for review. Only write it to a file if Jacob asks — and when he does, save
under the KB's `artifacts/linkedin/` or `artifacts/bio/`. Never overwrite an existing artifact blind.
