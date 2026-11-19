# AGENTS.md

Single source of truth for AI coding agents (Claude Code, Warp, Codex, etc.) working in this repo.
`CLAUDE.md` and `WARP.md` point here — edit this file, not those.

## What this repo is

`experience-engine` turns project data (git logs, CSV backlogs, blog posts) into career artifacts —
LinkedIn entries, resume bullets, job-description-tailored sets. It's built around an **experience
bank** (the source of truth) with cheap **renders** on top. **Generation is done by the agent
directly — no API, no provider SDK.**

## Architecture — four layers

```text
1. PARSE (deterministic scripts)     data/git-logs|backlogs → structured data
2. SUMMARIZE (project-summary skill) data → artifacts/project-summaries/
3. EXTRACT (experience-bank skill)   summaries → artifacts/contributions/claims.yaml  (the bank)
4. RENDER (tailored-render skill)    bank → artifacts/linkedin | bio
   (voice-signature skill feeds writing voice into renders)
```

## Knowledge-base contract — state lives in brainspace, not the repo

This repo is **pure processing**. All durable state lives in the knowledge base at
`~/Projects/brainspace/` (override with `$BRAINSPACE_ROOT`); the repo owns only mechanism plus
re-derivable intermediates. The full contract is at
`~/Projects/brainspace/docs/reference/knowledge-base.md`.

```text
READS   data/{git-logs,backlogs,voice-samples}/  +  career/atomic/worklog/   (the pipeline)
        artifacts/contributions/claims.yaml        jd-analyzer, linkedin-review, renders
        career/target-profile.md                   jd-analyzer, job-scout
        career/job-search.md                       jd-analyzer, job-scout
        career/postings/                           job-scout (skips roles already analyzed)
        career/conferences/*/companies.md          job-scout (seed companies, if present)
        foundation/about-jacob.md                  jd-analyzer, linkedin-review
        artifacts/resume/  (hand-edited by Jacob; never written by the tooling)   linkedin-review
WRITES  artifacts/{project-summaries,contributions,linkedin,bio}/
        career/postings/                           jd-analyzer (when asked), job-scout
        career/job-search.md Pipeline table        job-scout
        data/voice-samples/                        htmlToMarkdown (re-derivable; gitignored there)
REPO    holds no durable data — only voice-cache/ (cache) and .tmp/ (intermediates)
```

Paths are relative to the brainspace root. Scripts resolve them through `lib/config.ts` (`KB.*`);
skills resolve the rest from `$BRAINSPACE_ROOT` (default `~/Projects/brainspace`), never a
hardcoded path. Don't reintroduce repo-local `data/` or output dirs.

## Skills are the primary interface

Skills live in the repo-root `.claude/skills/`. Invoke them by doing the task they describe — don't
look for the old generator scripts (deleted).

- **`project-summary`** — `data/` (git logs, backlogs) → a large per-project summary (follows
  `specs/project-summary-rules-reference.md`).
- **`experience-bank`** — summary → tagged claims in `claims.yaml`; maintain the bank; rebuild index.
- **`tailored-render`** — bank → LinkedIn / resume / JD / About (follows
  `specs/render-rules-reference.md`).
- **`voice-signature`** — blog posts → writing-voice signature (incl. optional style-evolution).
- **`jd-analyzer`** — job description → match score backed by claim ids, honest gaps, and the
  claim set to hand to `tailored-render`.
- **`job-scout`** — orchestrates a job sweep: Haiku scouts find roles, the top N are triaged, Sonnet
  agents run `jd-analyzer` on each (saved to `career/postings/`), and the Pipeline table is updated.
- **`linkedin-review`** — reads the live LinkedIn profile (built-in browser or Claude in Chrome, read-only), audits it
  against the bank and resume, and proposes numbered paste-ready fixes; the approved paste list is
  saved to `artifacts/linkedin/`.

They chain `project-summary → experience-bank → tailored-render`, with `voice-signature` feeding renders.
`job-scout` fans out `jd-analyzer` across many postings.

## Hard rules

- **No API.** No API keys or AI-provider SDK. The former `local | openai | claude` mode system and the
  `lib/ai.ts` / `lib/claude.ts` / `lib/aiConfig.ts` layer were removed. Do not reintroduce them —
  generation is inline by the agent.
- **Confidentiality — the one rule, by direction.** Inputs may name clients and people: the
  worklog and project summaries (internal, the tool's raw material). Everything else the tooling
  writes may not: the bank, renders, paste lists, postings, the Pipeline table, and any new output.
  There only "Atomic Object" is named; clients are described by domain (e.g. "a statewide court
  system", "a national coffee chain"). Anonymizing happens when text crosses from an input into an
  output — re-check on every extraction and render.
- **No invented facts.** Claims, tech tags, and metrics must trace to source material. (This is the
  drift that motivated the bank — see `specs/skills-migration.md`.)
- **The bank is the source of truth.** Don't hand-edit `claims.yaml` for a one-off render — fix the
  bank (via the `experience-bank` skill) and re-render. Maintain it conversationally; curate at render
  time.

## Deterministic commands (no model)

```bash
bun install
bun run type-check        # tsc --noEmit
bun test                  # tests over small fixtures in test/fixtures/ — never the live bank
bun run extractGitData    # parse git logs → .tmp/processed/ with --save (exact author match)
bun run processBacklog    # parse CSV backlogs → .tmp/processed/ with --save (fails without an assignee column)
bun run getPosts          # download blog posts → .tmp/posts/ (intermediate)
bun run htmlToMarkdown    # convert posts → brainspace/data/voice-samples/  (voice input)
bun run buildBankIndex    # regenerate the bank index.md from claims.yaml (in artifacts/contributions/)
```

> **Quoting gotcha:** `extractGitData` / `processBacklog` take quoted args
> (`… "Jacob Williams" "<Project>"`). A shell proxy (e.g. rtk) can strip the quotes, splitting
> `"Jacob Williams"` into two args and breaking name handling. If a script misbehaves on a
> multi-word arg, run it from a small wrapper script file (quotes preserved) rather than inline.

## Layout

```text
REPO (mechanism only)
  experience-bank/   # bank index renderer (buildIndex.ts) + README — NOT the bank data
  lib/ tools/        # support libs + deterministic parsers (paths via lib/config.ts → KB.*)
  getPosts.ts htmlToMarkdown.ts   # blog download + markdown conversion
  specs/             # roadmap (STATUS.md) + preserved prompt-IP reference docs
  test/              # bun test suite + fixtures (made-up data only)
  .claude/skills/    # the primary interface
  voice-cache/       # cached voice signature (allowed repo-local cache)
  .tmp/              # re-derivable intermediates (raw posts, processed git data) — gitignored

KNOWLEDGE BASE (~/Projects/brainspace — durable state)
  data/{git-logs,backlogs,voice-samples}/   # inputs the tooling reads
  career/atomic/worklog/                  # human "why" + cross-agent handoff
  artifacts/{project-summaries,contributions,linkedin,bio}/   # outputs the tooling writes
```

## When you change this repo

- **Track work in `CHANGELOG.md`**: every change gets an entry under `Unreleased`. Specs in
  `specs/` (+ the `specs/STATUS.md` index) are for real development work — multi-step builds,
  migrations, anything worth planning before editing — not for skill tweaks or doc fixes.
- **Preserve prompt IP before deleting** a generator — capture its rules into a `specs/*-reference.md`
  (that's how the summary and render templates survived the migration).
- **Commits**: Conventional Commits, imperative mood; focus the body on *why*. No AI-attribution
  footers.
- **Markdown**: fix markdownlint errors (a post-edit hook enforces this).
- **Close one branch before starting the next**; deferred ideas become `deferred`-status specs.
