# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TypeScript system that processes project artifacts (git logs, CSV backlogs) to generate professional project summaries, biographies, and LinkedIn experience content. Runs on **Bun** runtime.

## Commands

```bash
bun install                          # Install dependencies
bun run type-check                   # TypeScript type checking (tsc --noEmit)

# Main generators (all support interactive mode or CLI args)
bun run generateBio.ts               # Generate professional biography
bun run generateLinkedInExperience.ts # Generate LinkedIn experience section
bun run generateProjectSummary.ts    # Generate project summary

# Project analysis
bun run scripts/analyzeProject.ts <git-log> <developer> <project> [flags]
bun run tools/processBacklog.ts <csv-file> <developer> <project> [flags]

# AI provider configuration
bun run scripts/configureAI.ts status    # Check current provider
bun run scripts/configureAI.ts set <provider>  # Set to openai|claude|local

# Voice analysis pipeline (run in order)
bun run getPosts.ts                  # Download blog posts
bun run htmlToMarkdown.ts            # Convert to markdown
```

## Architecture

**Three AI modes** controlled by `.ai-config.json` and `lib/aiConfig.ts`:
- **local**: Generates prompts to `locally-generated-prompts/` for manual copy/paste into AI tools
- **openai**: Uses Vercel AI SDK (`ai` package) with GPT models
- **claude**: Uses `@anthropic-ai/sdk` directly via `lib/claude.ts`

`lib/ai.ts` is the unified abstraction — `generateAIText(prompt, task)` routes to the configured provider. Returns `null` in local mode.

**Task-based model selection**: Each provider has four model tiers (`default`, `detailed`, `creative`, `concise`) with different temperature/token configs in `lib/ai.ts`.

**Pipeline flow**: Data sources (git logs, CSVs) → parsing (`tools/`) → AI analysis (`scripts/`) → output files (`project-experience-summaries/`, `professional-bios/`, `linkedin-experience/`).

**Top-level `.ts` files** (`generateBio.ts`, `generateLinkedInExperience.ts`, `generateProjectSummary.ts`) are interactive CLI wrappers using `@inquirer/prompts`. They delegate to corresponding scripts in `scripts/`.

**Path aliases** in `tsconfig.json`: `@/*` → `lib/`, `@tools/*` → `tools/`, `@scripts/*` → `scripts/`.

## Key Data Directories

- `datasources/` — Input git logs and CSV backlogs
- `resources/strengths/` — StrengthsFinder theme files (auto-discovered)
- `voice-cache/` — Cached voice analysis results
- `project-experience-summaries/` — Generated project summaries (output)
- `professional-bios/` — Generated biographies (output)
- `linkedin-experience/` — Generated LinkedIn content (output)

## Environment Variables

- `OPENAI_API_KEY` — Required for openai mode
- `ANTHROPIC_API_KEY` — Required for claude mode
