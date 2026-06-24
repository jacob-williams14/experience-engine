---
name: experience-bank
description: >-
  Maintain Jacob's experience bank — the tagged claim store at
  artifacts/contributions/claims.yaml in the knowledge base. Use when adding, updating, tagging, or
  curating experience claims, or when pulling new claims from the generated project summaries into the
  bank. Triggers on "add a claim", "update the bank", "pull from the summaries", "re-tag", "rebuild
  the bank index".
---

# Experience Bank

The bank (`~/Projects/brainspace/artifacts/contributions/claims.yaml`) is the source of truth for
Jacob's project experience. Documents (LinkedIn, resume, JD-tailored sets) are RENDERS over it — see
the `tailored-render` skill. This skill is for keeping the bank populated and accurate.

> **Paths.** The bank and its inputs live in the knowledge base, rooted at `~/Projects/brainspace/`
> (override with `$BRAINSPACE_ROOT`): summaries in `artifacts/project-summaries/`, the bank in
> `artifacts/contributions/`. Bare `claims.yaml` references below mean that file.

## The pipeline (don't skip a layer)

```text
data/ (git logs in git-logs/, CSVs in backlogs/)
  → project-summary skill                    →  artifacts/project-summaries/*   (generated)
      → EXTRACT (this skill)                 →  artifacts/contributions/claims.yaml   (the bank)
          → RENDER (tailored-render skill)   →  LinkedIn / resume / JD
```

Claims are pulled FROM `~/Projects/brainspace/artifacts/project-summaries/*`, the generated upstream
layer — not invented and not mined from raw logs directly. If a summary is missing or stale,
regenerate it first with the project-summary skill, then extract.

## No API

Generation is done by Claude Code directly (you are the model). Do not call the AI-SDK layer or any
API. Extraction = you reading a summary and writing claims.

## Claim schema

Each claim in `claims.yaml`:

```yaml
- id: <domain-prefix>-<short-slug>     # stable, unique
  kind: technical | non-technical       # technical = mined from project data; non-technical = the "why"
  project: <internal-codename>          # NOT for output
  domain: <public-safe domain string>   # USE THIS in renders, never the client name
  themes: [technical leadership | system design | cross-domain adaptability | reliability | growth | devops/CI | i18n | testing]
  tech: [named technologies from the source only]   # usually [] for non-technical claims
  scope: IC | owned-feature | co-tech-lead
  strength: featured | solid | filler   # proposed default; Jacob adjusts at render time
  hook: true | false                    # a "I need to talk to this person" problem
  keyword_rich: >-                       # recruiter-facing, anonymized
    ...
  plain_language: >-                     # plain-English; "" if not yet written (fill for featured/hook)
    ...
```

**`kind`** is a first-class split, surfaced as top-level groups in the index:

- **`technical`** — extracted from the project summaries (which trace to git logs / backlogs). Carries
  the full `domain` / `tech` / `themes` / `strength` detail.
- **`non-technical`** — decisions, mentoring, process, leadership — the "why" that git can't show.
  These are **captured forward from the worklog** (`~/Projects/brainspace/WorkLife/atomic/worklog/`),
  not mined retrospectively; `tech` is usually empty and they lean on the decision / context / who-was-
  unblocked detail. (The worklog→bank enrichment flow is a later phase — see
  `specs/kb-contract-rewire.md`.)

## Rules (non-negotiable)

- **Confidentiality:** never write a client or product name into the bank. Only "Atomic Object" may
  appear. Describe clients by DOMAIN (e.g. "a statewide court system", "a national coffee chain").
  Existing domain strings: `retail / consumer mobile`, `state judicial / government finance`,
  `global leadership-development / education`, `healthcare / clinical`.
- **Trace to source:** every `tech` tag and any number/metric must come from the summary. Never
  invent (this is the drift the old synthesizer caused — see specs/render-rules-reference.md).
- **No duplicates:** before adding, scan existing claim ids/topics for the project so you extend
  rather than repeat.
- **`themes` holds themes only** — never put a `scope` value (IC/owned-feature/co-tech-lead) in it.

## Need a summary first?

If `~/Projects/brainspace/artifacts/project-summaries/<project>-project-summary.md` doesn't exist
yet, generate it with the **`project-summary`** skill (data → summary), then extract claims from it
below.

## Adding claims from a summary

1. Read the relevant
   `~/Projects/brainspace/artifacts/project-summaries/<project>-project-summary.md` fully.
2. List the project's existing claims in `claims.yaml` so you don't duplicate.
3. Extract genuinely distinct accomplishments as claim blocks (schema above), anonymized. Claims
   pulled from a project summary are `kind: technical`.
4. Append them under the right domain section of `claims.yaml`.
5. Rebuild the index: `bun run buildBankIndex`.

## Curating

Jacob curates conversationally, not by editing YAML. When he says "bump X to featured", "that's not a
hook", "add a claim about Y", make the edit in `claims.yaml` and rebuild the index. Strength/hook are
only filters for renders, so they don't need to be perfect up front.

## Atomic-only

The bank holds Atomic Object experience only — Jacob has no pre-Atomic professional experience to add.
