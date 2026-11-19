---
name: job-scout
description: >-
  Orchestrate a job-search sweep: cheap scout agents find open roles in company buckets, the best
  are triaged, each is scored against the bank with jd-analyzer, and the results are recorded in
  the Pipeline table. Use when Jacob asks to find jobs or look for roles. Triggers on "find me
  jobs", "run a job sweep", "scout job postings", "look for roles", "what's out there".
---

# Job Scout

Finds roles worth Jacob's time and scores them. You are the **orchestrator**: stay thin. You never
read JD bodies or `claims.yaml` yourself — you delegate through the Agent tool with explicit `model`
overrides and read only the subagents' short summaries. KB paths root at `~/Projects/brainspace/`
(override: `$BRAINSPACE_ROOT`).

## No API

No job-board API keys, no provider SDK. Scouts fetch public pages and public ATS JSON endpoints
through their normal web tools; analysis is done by agents directly.

## Why this shape

- **Cost.** Breadth is cheap Haiku; Sonnet runs only where judgment matters (scoring against the
  bank); the orchestrator's context stays small because it only sees summaries.
- **The bank is the main per-analysis cost** (`claims.yaml` is ~83KB). So only the top N postings
  get analyzed, and scouts never load it.
- **Files, not chat, carry the JDs.** Full JD text lives in `.tmp/` and the KB, not in your context.

## Phases

### 0. Scope

Read `career/target-profile.md` (and `career/conferences/*/companies.md` if present) only enough to
propose search buckets — e.g. agentic dev tools, design-led product companies, AI labs / big
tech, sports / athlete tech. Then confirm with Jacob:

- **Buckets and seed companies.** His lists go stale — ask what's outdated.
- **Sweep size:**

  | Size | Scouts | Analyzed |
  | --- | --- | --- |
  | pilot | 3–4 | top 5 |
  | medium | ~8 | top ~10 |
  | big | 15+ | top ~20 |

- **Hard filters** (location, comp floor, level, anything else).

Skip roles already in the Pipeline table of `career/job-search.md` or in `career/postings/`.

### 1. Scout (model: `haiku`)

One background agent per bucket, all launched in parallel. Brief each with an **inline summary** of
Jacob's profile, wants, and avoids taken from `target-profile.md`, so scouts never load the bank.
Tell them the seed companies, hard filters, and the already-seen list.

Source preference, in order:

1. Public ATS JSON APIs — full JD plus post date:
   - Greenhouse: `https://boards-api.greenhouse.io/v1/boards/<org>/jobs?content=true`
   - Ashby: `https://api.ashbyhq.com/posting-api/job-board/<org>?includeCompensation=true`
   - Lever: `https://api.lever.co/v0/postings/<org>?mode=json`
2. The company's careers page.
3. WebSearch plus aggregators (Built In, Working Nomads, Remote Rocketship) as a fallback.

Budget ~25 tool calls per scout. Each scout writes **one file per candidate** to
`.tmp/job-scout/<YYYY-MM-DD>/<bucket>-<company>-<role-slug>.md` in the experience-engine repo
(a re-derivable intermediate; `.tmp/` is gitignored), with a header — company, title, url,
location, comp, posted date / freshness, source (`ATS` | `careers page` | `snippets`) — then the
verbatim JD. It returns at most 250 words: a table of High / Med / Low pre-screen, reason, and path
per candidate, plus the companies checked that had nothing.

### 2. Triage (you)

Dedupe across scouts, drop stale or closed postings and dealbreakers, rank, and pick the top N.
Prefer full-JD sources. Snippet-only JDs are allowed but are labeled **provisional**.

### 3. Analyze (model: `sonnet`)

One background agent per chosen posting, in parallel. Each follows
`.claude/skills/jd-analyzer/SKILL.md` exactly, resolving the KB via `$BRAINSPACE_ROOT` (default
`~/Projects/brainspace`), and saves the analysis to
`career/postings/<YYYY-MM-DD>-<company>-<role-slug>.md` in the KB. The file opens with a front
block: company, title, url, location, comp, date analyzed, and status — `verified` or
`provisional — snippet JD`. Subagents do not commit.

Each returns at most 120 words: match %, band, direction fit, recommendation, top 2 gaps, top 2
claim ids, path.

> A score built from fewer than 3 scorable requirements is unreliable. Say so in the posting and
> the report instead of trusting a 100%.

### 4. Record (model: `haiku`)

Add or update rows in the Pipeline table in `career/job-search.md`, linking `postings/<file>`.
Stage is "Found — verify live posting" unless the posting was verified live. Put match %, band,
location, and comp caveats in Notes.

### 5. Report and commit (you)

Give Jacob:

- A ranked table (role, company, match, band, direction fit, recommendation, status).
- **Recurring bank gaps** across the analyses, with suggested `experience-bank` fixes — suggest,
  don't make them.
- Notes on source quality (which ATS / aggregators gave full JDs, which were stale).

Then commit the KB changes in brainspace with a Conventional Commit, per its conventions.

## Pitfalls

- **Network-restricted environments.** Cloud sessions may block ATS hosts. Fall back to snippets and
  label results provisional, or tell Jacob to run the sweep locally.
- **Stale aggregator copies.** Mirrors outlive the posting; prefer the ATS date and verify live.
- **Conflicting comp / level across mirrors.** Record the range and say sources vary; don't pick one.
- **Don't let scouts read the bank.** They pre-screen from the inline profile summary only.
- **Confidentiality.** Postings and the Pipeline table are outputs: no client names, only "Atomic
  Object"; describe clients by domain (AGENTS.md, Confidentiality).
- **No invented facts.** Postings are quoted verbatim; analyses cite claim ids.
