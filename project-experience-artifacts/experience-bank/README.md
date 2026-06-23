# Experience Bank

The source of truth for Jacob's project experience: a tagged set of **claims** in
[`claims.yaml`](./claims.yaml). Documents (LinkedIn, resume, a job-description-tailored set) are
cheap **renders** over this bank — not the other way around. See
[`../specs/experience-bank.md`](../specs/experience-bank.md) for the full design.

## Why a bank instead of a generator

The old pipeline ended in a synthesizer that compressed ~25 specific bullets into 4 generic ones —
worse than its own input. The specific per-project claims are the asset. Keep them; render on demand.

## How to use it (you don't hand-edit this file)

`claims.yaml` is a data store, not a document you maintain by hand. You work with it two ways:

1. **Maintain it conversationally.** Ask Claude Code to change it — "add a claim about X", "bump the
   CMS-migration claim to featured", "that payments one isn't a hook". Claude edits the YAML; you
   don't open it unless you want to.
2. **Render on demand — this is where your judgment matters.** Ask for a document and Claude pulls +
   phrases the matching claims:
   - LinkedIn Experience entry → featured/solid claims, themed, with tech tags.
   - Resume bullets → terse register, filtered by target role.
   - **JD-tailored set** → paste a job description, get the best-matching claims. (The high-value
     render the old tooling couldn't do.)
   - Render phrasing rules live in [`../specs/render-rules-reference.md`](../specs/render-rules-reference.md)
     (preserved from the retired synthesizer) and will become the `tailored-render` skill.

   At render time you steer — "lead with the courts work", "drop that one", "more plain-language".
   That steering is the quality gate; nothing gets published you haven't approved.

## About the subjective fields

`strength`, `hook`, and `plain_language` are seeded with proposed defaults. They only matter at
render time (as filters / phrasing), so there's no need to "fix" them up front — adjust them in
conversation when you're actually building a document and a default gets in the way.

## Confidentiality

Claims are stored already-anonymized: only "Atomic Object" is named; clients appear as domains
(e.g. "state judicial / government finance"). Never add client/product names to this file.

## Status

Seed populated 2026-06-23 from the 5 per-project `linkedin-experience/*-linkedin-experience.md`
files. Not yet a skill — that's the `experience-bank` + `tailored-render` migration in
[`../specs/skills-migration.md`](../specs/skills-migration.md).
