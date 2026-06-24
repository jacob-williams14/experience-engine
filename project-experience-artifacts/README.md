# Project Experience Artifacts

Turns project data (git logs, CSV backlogs, blog posts) into career artifacts — LinkedIn entries,
resume bullets, job-description-tailored sets. Built around an **experience bank** (the source of
truth) with cheap **renders** on top. Generation is done by **Claude Code directly — no API**.

Runs on [Bun](https://bun.sh).

## How it works — three layers

```text
1. PARSE (deterministic scripts)     datasources/ → structured data
2. SUMMARIZE (project-summary skill) data → project-experience-summaries/
3. EXTRACT (experience-bank skill)   summaries → experience-bank/claims.yaml  (the bank)
4. RENDER (tailored-render skill)    bank → LinkedIn / resume / JD
   (voice-signature skill feeds writing voice into renders)
```

The work happens through **Claude Code skills** (in the repo-root `.claude/skills/`), not CLI
generators. Just ask Claude:

- *"generate a project summary for X"* → `project-summary`
- *"add a claim about X"* / *"pull the latest summaries into the bank"* → `experience-bank`
- *"render a LinkedIn experience entry"* / *"tailor my bullets to this job description"* →
  `tailored-render`
- *"refresh my writing voice"* → `voice-signature`

## The bank

`experience-bank/claims.yaml` holds tagged, confidentiality-safe claims (clients by domain; only
"Atomic Object" named). You don't hand-edit it — maintain it conversationally; curate at render time.
See [`experience-bank/README.md`](./experience-bank/README.md).

Browse it: `bun run buildBankIndex` regenerates [`experience-bank/index.md`](./experience-bank/index.md).

## Deterministic scripts (no AI)

```bash
bun install
bun run extractGitData    # parse git logs → structured data
bun run processBacklog    # parse CSV backlogs → structured data
bun run getPosts          # download blog posts → data/posts/
bun run htmlToMarkdown    # convert posts → data/posts-md/  (voice input)
bun run buildBankIndex    # regenerate the bank index
bun run type-check        # tsc --noEmit
```

## Layout

```text
experience-bank/             # the bank (claims.yaml), index renderer + index.md
project-experience-summaries/ # large generated per-project summaries (bank input)
datasources/                 # source git logs and CSV backlogs
data/posts-md/               # blog posts in markdown (voice input)
voice-cache/                 # cached voice signature
linkedin-experience/         # older per-project bullet artifacts (kept as data)
professional-bios/           # older bio artifact (kept as data)
specs/                       # roadmap + preserved prompt-IP reference docs (see specs/STATUS.md)
lib/ tools/                  # support libs + deterministic parsers
.claude/skills/              # the 3 skills (repo root)
```

## No API

This project uses no API keys or AI-provider SDK. The former `local | openai | claude` mode system
and the `lib/ai.ts` / `lib/claude.ts` / `lib/aiConfig.ts` layer were removed in the skills migration
(see `specs/skills-migration.md`). Generation is done inline by Claude Code through the skills.
