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
`~/Projects/brainspace/docs/knowledge-base.md`.

```text
READS   brainspace/data/{git-logs,backlogs,voice-samples}/   +  career/atomic/worklog/
WRITES  brainspace/artifacts/{project-summaries,contributions,linkedin,bio}/
REPO    holds no durable data — only voice-cache/ (cache) and .tmp/ (intermediates)
```

Paths resolve through `lib/config.ts` (`KB.*`). Don't reintroduce repo-local `data/` or output dirs.

## Skills are the primary interface

Skills live in the repo-root `.claude/skills/`. Invoke them by doing the task they describe — don't
look for the old generator scripts (deleted).

- **`project-summary`** — `data/` (git logs, backlogs) → a large per-project summary (follows
  `specs/project-summary-rules-reference.md`).
- **`experience-bank`** — summary → tagged claims in `claims.yaml`; maintain the bank; rebuild index.
- **`tailored-render`** — bank → LinkedIn / resume / JD / About (follows
  `specs/render-rules-reference.md`).
- **`voice-signature`** — blog posts → writing-voice signature (incl. optional style-evolution).

They chain `project-summary → experience-bank → tailored-render`, with `voice-signature` feeding renders.

## Hard rules

- **No API.** No API keys or AI-provider SDK. The former `local | openai | claude` mode system and the
  `lib/ai.ts` / `lib/claude.ts` / `lib/aiConfig.ts` layer were removed. Do not reintroduce them —
  generation is inline by the agent.
- **Confidentiality.** Never write client or product names into committed artifacts. Only "Atomic
  Object" may appear; describe clients by domain (e.g. "a statewide court system", "a national coffee
  chain"). The bank is already anonymized — keep it that way; re-check on every render.
- **No invented facts.** Claims, tech tags, and metrics must trace to source material. (This is the
  drift that motivated the bank — see `specs/skills-migration.md`.)
- **The bank is the source of truth.** Don't hand-edit `claims.yaml` for a one-off render — fix the
  bank (via the `experience-bank` skill) and re-render. Maintain it conversationally; curate at render
  time.

## Deterministic commands (no model)

```bash
bun install
bun run type-check        # tsc --noEmit
bun run extractGitData    # parse git logs → structured data
bun run processBacklog    # parse CSV backlogs → structured data
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
  .claude/skills/    # the primary interface
  voice-cache/       # cached voice signature (allowed repo-local cache)
  .tmp/              # re-derivable intermediates (raw posts, processed git data) — gitignored

KNOWLEDGE BASE (~/Projects/brainspace — durable state)
  data/{git-logs,backlogs,voice-samples}/   # inputs the tooling reads
  career/atomic/worklog/                  # human "why" + cross-agent handoff
  artifacts/{project-summaries,contributions,linkedin,bio}/   # outputs the tooling writes
```

## When you change this repo

- **Track work**: add/update a spec in `specs/`, the `specs/STATUS.md`
  index, and `CHANGELOG.md`. Don't just start editing.
- **Preserve prompt IP before deleting** a generator — capture its rules into a `specs/*-reference.md`
  (that's how the summary and render templates survived the migration).
- **Commits**: Conventional Commits, imperative mood; focus the body on *why*. No AI-attribution
  footers.
- **Markdown**: fix markdownlint errors (a post-edit hook enforces this).
- **Close one branch before starting the next**; deferred ideas become `deferred`-status specs.
