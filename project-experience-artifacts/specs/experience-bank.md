# Spec: Experience Bank + Tailored Render

- **Status:** next (primary direction for the next branch)
- **Branch:** future
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

## Summary

Reorient the tooling around a **curated, tagged bank of experience claims** rather than around
generating finished documents. The bank is the durable product; LinkedIn profiles, resumes,
interview stories, and cover-letter lines become cheap, disposable **renders** over it. This replaces
the profile-centric framing in [linkedin-profile.md](./linkedin-profile.md) and reshapes
[skills-migration.md](./skills-migration.md) and [resume-generator.md](./resume-generator.md).

## Motivation

The existing pipeline ends in a **synthesizer** (`generateAtomicExperience`) that compresses ~25
specific per-project bullets into 4 generic themed bullets. That is lossy compression pointed the
wrong way: the per-project source bullets are more specific, more truthful, and more compelling than
the synthesized output. The tool's centerpiece produces something *worse than its own input*.

The job-search need isn't "a generated profile" — it's a reusable set of strong, accurate claims
about projects and expertise that can be pulled into many surfaces. A profile is just one rendering,
and not the highest-value one. So:

- **The asset is the per-project claim layer.** Keep it; make it the product.
- **Curation is where judgment lives** (which claims are strongest, true, featured) and should be
  durable, not re-derived each time a document is generated.
- **Rendering is cheap and target-specific** (LinkedIn entry, resume, a specific job description) and
  should be re-runnable, with role/company/JD lenses applied here — not baked into a one-time
  synthesis.

## Design

### Three layers

1. **Extract** (per project, do once): project data (git logs, CSVs, existing
   `project-experience-summaries/*` and `linkedin-experience/*-linkedin-experience.md`) → a set of
   structured claims. Largely already done; this step normalizes what exists into the bank schema.
2. **Curate** (human / Jacob — the quality gate): tag and rate each claim; mark featured/hooks; write
   the confidentiality-safe phrasing; keep both a keyword-rich and a plain-language register.
3. **Render** (on demand, cheap, disposable): given a target, select + lightly rephrase claims into a
   view. Many small renders, never the source of truth.

### Claim schema (per entry)

- `id`, `project` (internal name), `domain` (e.g. healthcare, courts, education, retail)
- `themes` (e.g. technical leadership, system design, cross-domain adaptability, reliability)
- `tech` (named frameworks/languages/services — the recruiter keywords)
- `scope` / leadership signal (IC, owned-feature, co-tech-lead, etc.)
- `strength` (Jacob's rating: featured / solid / filler)
- `hook` (bool — is this a "I need to talk to this person" problem?)
- `confidential_safe` (bool) + the client-anonymized phrasing
- two registers: `keyword_rich` and `plain_language`

### Storage

- **Source of truth = structured data** (YAML or JSON under e.g. `experience-bank/claims.yaml`) so
  render can filter on tags deterministically.
- **A deterministic script renders a human-browsable markdown index** (`experience-bank/index.md`)
  grouped by domain/theme so the bank is readable and reviewable, not just machine-queryable.
- Keep it confidentiality-safe at rest: the stored phrasing names only "Atomic Object"; client names
  live nowhere in the committed bank.

### Render targets (views, not stored artifacts)

- LinkedIn **Experience** entry (the old synthesizer becomes *one* renderer, demoted from centerpiece)
- LinkedIn **About** + **Headline**
- **Resume** bullets (terse, ATS register) — see [resume-generator.md](./resume-generator.md)
- **JD-tailored set**: paste a job description → render the N best-matching claims in the right
  register. This is the highest-value render and the one the current tooling can't do.
- Interview-story / STAR scaffolds from a `hook` claim

### Where the prompt IP goes

The valuable rules in `createSynthesisPrompt` (client confidentiality, brevity, voice override,
role/company lenses, no-invented-metrics, the reproducible tech-stack tag) **move to the render
layer** — they describe how to phrase a view, not how to store a claim. Extraction enforces
confidentiality at write time; render re-checks it.

### Skills mapping (supersedes the 1:1 port in skills-migration.md)

| New skill | Responsibility |
| --- | --- |
| `experience-bank` | Extract + normalize + tag claims into the structured bank; maintain the markdown index |
| `tailored-render` | Given a target (LinkedIn / resume / pasted JD) + lens, select + phrase claims; carries the `createSynthesisPrompt` rules |

Deterministic scripts stay scripts: git/CSV parsing, the bank→markdown index renderer, voice-cache I/O.

## Quality gate

- Curation is human-owned; nothing enters "featured" without Jacob's sign-off.
- A render is adopted for a given surface only if it's clearly as good or better than the current
  hand-written version for that surface (same standing rule as the rest of the repo).
- No invented tech or metrics — claims and tags must trace to source material.

## Open questions

- Storage format: YAML vs JSON for `claims.yaml` (readability vs tooling)?
- How much of **extract** is automatable from existing artifacts vs. a one-time manual normalization?
- Retire the old `generateAtomicExperience` synthesizer outright, or keep it as the LinkedIn-entry
  renderer under `tailored-render`?
- Strength-rating scale — 3 tiers (featured/solid/filler) enough, or finer?
- JD input: pasted text into the skill, or a file under `inputs/`?
- Does the bank also hold non-Atomic / pre-Atomic experience, or Atomic-only for now?
