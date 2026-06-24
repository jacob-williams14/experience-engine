# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A system for turning project data (git logs, CSV backlogs, blog posts) into career artifacts. The
architecture is **bank + skills**: a tagged claim bank is the source of truth, and documents are
cheap renders over it. Generation is done by **Claude Code directly (no API)** via skills — there is
no longer an AI-SDK/provider layer. Runs on **Bun**.

## Architecture — three layers

```text
1. PARSE (deterministic scripts)     datasources/ → structured data
2. SUMMARIZE (project-summary skill) data → project-experience-summaries/
3. EXTRACT (experience-bank skill)   summaries → experience-bank/claims.yaml  (the bank)
4. RENDER (tailored-render skill)    bank → LinkedIn / resume / JD
   (voice-signature skill feeds writing voice into renders)
```

- The **bank** (`experience-bank/claims.yaml`) holds tagged, confidentiality-safe claims. It's the
  source of truth; never hand-edit for a one-off — fix the bank, then re-render.
- **Skills** live in the repo-root `.claude/skills/`: `project-summary` (datasources → summary),
  `experience-bank` (summary → claims; maintain the bank), `tailored-render` (bank → documents),
  `voice-signature` (writing voice).
- **Preserved prompt IP** is in `specs/`: `project-summary-rules-reference.md` (summary template),
  `render-rules-reference.md` (render phrasing rules). The skills follow these.

## Commands

```bash
bun install                  # Install dependencies
bun run type-check           # TypeScript type checking (tsc --noEmit)

# Deterministic data prep (no AI)
bun run extractGitData       # Parse git logs → structured data
bun run processBacklog       # Parse CSV backlogs → structured data
bun run getPosts             # Download blog posts → data/posts/
bun run htmlToMarkdown       # Convert posts → data/posts-md/

# Bank
bun run buildBankIndex       # Regenerate experience-bank/index.md from claims.yaml
```

Generation (summaries, claims, renders, voice) is NOT a script — invoke the relevant **skill**
(`experience-bank`, `tailored-render`, `voice-signature`). Claude Code is the model.

## Key directories

- `datasources/` — input git logs and CSV backlogs
- `data/posts-md/` — blog posts in markdown (voice input)
- `project-experience-summaries/` — large generated per-project summaries
- `experience-bank/` — the claim bank (`claims.yaml`), index renderer, generated `index.md`
- `voice-cache/` — cached voice signature
- `specs/` — roadmap specs + preserved prompt-IP reference docs (see `specs/STATUS.md`)

## No API

This project does not use API keys or any AI provider SDK. The former `local | openai | claude` mode
system and the `lib/ai.ts` / `lib/claude.ts` / `lib/aiConfig.ts` layer were removed in the skills
migration. Do not reintroduce them — generation is done inline by Claude Code through the skills.
