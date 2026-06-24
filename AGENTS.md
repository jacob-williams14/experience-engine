# AGENTS.md

Single source of truth for AI coding agents (Claude Code, Warp, Codex, etc.) working in this repo.
`CLAUDE.md` and `WARP.md` point here — edit this file, not those.

## What this repo is

`prompts-and-tools` turns project data (git logs, CSV backlogs, blog posts) into career artifacts —
LinkedIn entries, resume bullets, job-description-tailored sets. It's built around an **experience
bank** (the source of truth) with cheap **renders** on top. **Generation is done by the agent
directly — no API, no provider SDK.**

## Architecture — four layers

```text
1. PARSE (deterministic scripts)     datasources/ → structured data
2. SUMMARIZE (project-summary skill) data → project-experience-summaries/
3. EXTRACT (experience-bank skill)   summaries → experience-bank/claims.yaml  (the bank)
4. RENDER (tailored-render skill)    bank → LinkedIn / resume / JD
   (voice-signature skill feeds writing voice into renders)
```

## Skills are the primary interface

Skills live in the repo-root `.claude/skills/`. Invoke them by doing the task they describe — don't
look for the old generator scripts (deleted).

- **`project-summary`** — datasources → a large per-project summary (follows
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
bun run getPosts          # download blog posts → data/posts/
bun run htmlToMarkdown    # convert posts → data/posts-md/  (voice input)
bun run buildBankIndex    # regenerate experience-bank/index.md from claims.yaml
```

## Layout

```text
experience-bank/              # the bank (claims.yaml), index renderer + index.md
project-experience-summaries/ # large generated per-project summaries (bank input)
datasources/                  # source git logs and CSV backlogs
data/posts-md/                # blog posts in markdown (voice input)
voice-cache/                  # cached voice signature
specs/                        # roadmap (STATUS.md) + preserved prompt-IP reference docs
lib/ tools/                   # support libs + deterministic parsers
```

Skills are at the repo root: `.claude/skills/`.

## When you change this repo

- **Track work**: add/update a spec in `specs/`, the `specs/STATUS.md`
  index, and `CHANGELOG.md`. Don't just start editing.
- **Preserve prompt IP before deleting** a generator — capture its rules into a `specs/*-reference.md`
  (that's how the summary and render templates survived the migration).
- **Commits**: Conventional Commits, imperative mood; focus the body on *why*. No AI-attribution
  footers.
- **Markdown**: fix markdownlint errors (a post-edit hook enforces this).
- **Close one branch before starting the next**; deferred ideas become `deferred`-status specs.
