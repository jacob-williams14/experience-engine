# Experience Engine

Turns project data (git logs, CSV backlogs, blog posts) into career artifacts — LinkedIn entries,
resume bullets, job-description-tailored sets. Built around an **experience bank** (the source of
truth) with cheap **renders** on top. Generation is done by **Claude Code directly — no API**.

Runs on [Bun](https://bun.sh).

> **AI agents:** operating guidance is in [`AGENTS.md`](./AGENTS.md) (the source of truth, shared by
> Claude Code, Warp, etc.). `CLAUDE.md` imports it; `WARP.md` points to it.

## How it works — four layers

```text
1. PARSE (deterministic scripts)     data/git-logs|backlogs → structured data
2. SUMMARIZE (project-summary skill) data → artifacts/project-summaries/
3. EXTRACT (experience-bank skill)   summaries → artifacts/contributions/claims.yaml  (the bank)
4. RENDER (tailored-render skill)    bank → artifacts/linkedin | bio
   (voice-signature skill feeds writing voice into renders)
```

State lives in the knowledge base at `~/Projects/brainspace/` (the repo is pure processing and owns
no durable data — see [`AGENTS.md`](./AGENTS.md) and the contract in
`~/Projects/brainspace/docs/knowledge-base.md`). Override the root with
`$BRAINSPACE_ROOT`.

The work happens through **Claude Code skills** (in the repo-root `.claude/skills/`), not CLI
generators. Just ask Claude:

- *"generate a project summary for X"* → `project-summary`
- *"add a claim about X"* / *"pull the latest summaries into the bank"* → `experience-bank`
- *"render a LinkedIn experience entry"* / *"tailor my bullets to this job description"* →
  `tailored-render`
- *"refresh my writing voice"* → `voice-signature`

## The bank

The bank (`~/Projects/brainspace/artifacts/contributions/claims.yaml`) holds tagged,
confidentiality-safe claims (clients by domain; only "Atomic Object" named). You don't hand-edit it —
maintain it conversationally; curate at render time. See
[`experience-bank/README.md`](./experience-bank/README.md).

Browse it: `bun run buildBankIndex` regenerates `index.md` alongside the bank in
`artifacts/contributions/`.

## Deterministic scripts (no AI)

```bash
bun install
bun run extractGitData    # parse git logs → structured data
bun run processBacklog    # parse CSV backlogs → structured data
bun run getPosts          # download blog posts → .tmp/posts/ (intermediate)
bun run htmlToMarkdown    # convert posts → brainspace/data/voice-samples/  (voice input)
bun run buildBankIndex    # regenerate the bank index
bun run type-check        # tsc --noEmit
```

## Layout

```text
REPO (mechanism only)
  experience-bank/   # bank index renderer (buildIndex.ts) + README — NOT the bank data
  lib/ tools/        # support libs + deterministic parsers (paths via lib/config.ts → KB.*)
  getPosts.ts htmlToMarkdown.ts   # blog download + markdown conversion
  specs/             # roadmap + preserved prompt-IP reference docs (see specs/STATUS.md)
  .claude/skills/    # the skills (the primary interface)
  voice-cache/       # cached voice signature   ·   .tmp/  # gitignored intermediates

KNOWLEDGE BASE (~/Projects/brainspace — durable state)
  data/{git-logs,backlogs,voice-samples}/                     # inputs
  artifacts/{project-summaries,contributions,linkedin,bio}/   # outputs (incl. the bank)
```

## No API

This project uses no API keys or AI-provider SDK. The former `local | openai | claude` mode system
and the `lib/ai.ts` / `lib/claude.ts` / `lib/aiConfig.ts` layer were removed in the skills migration
(see `specs/skills-migration.md`). Generation is done inline by Claude Code through the skills.
