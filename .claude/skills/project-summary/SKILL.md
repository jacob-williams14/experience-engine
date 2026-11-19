---
name: project-summary
description: >-
  Generate a large, detailed per-project experience summary from raw project data (git logs, CSV
  backlogs) into the knowledge base (artifacts/project-summaries/). Use when asked to summarize a
  project, generate a project summary, or process a new project's git log / backlog. Triggers on
  "generate a project summary", "summarize <project>", "process this git log / backlog".
---

# Project Summary

Produces the large, structured per-project summaries in the knowledge base at
`~/Projects/brainspace/artifacts/project-summaries/`. These are the upstream layer the
`experience-bank` skill pulls claims from. No API — Claude Code is the model.

> **Paths.** All inputs and outputs live in the knowledge base, rooted at `~/Projects/brainspace/`
> (override with `$BRAINSPACE_ROOT`). The repo itself holds no project data.

## Input

Raw project data in `~/Projects/brainspace/data/`:

- a git log (`.txt`) in `data/git-logs/`, or
- a CSV backlog (`.csv`) in `data/backlogs/`.

For large or messy logs, structure them first with the deterministic parsers (optional — for normal
files you can read the raw datasource directly). `--save` writes the developer's commits or rows to
`.tmp/processed/`; read that file:

```bash
bun run extractGitData ~/Projects/brainspace/data/git-logs/<file>.txt "Jacob Williams" "<Project>" --save   # git log
bun run processBacklog ~/Projects/brainspace/data/backlogs/<file>.csv "Jacob Williams" "<Project>" --save   # CSV backlog
```

Matching is exact (case, spaces and punctuation ignored), so a teammate whose name contains
Jacob's is never credited. The git parser lists the other authors: if one is Jacob under another
spelling, re-run with `--alias "<spelling>"`. A backlog with no assignee-like column fails rather
than crediting every row; name the column with `--column "<header>"`. Reading the raw file
instead, apply the same care: only work the source attributes to Jacob.

## Generate

1. Read the datasource (raw or parsed), focusing only on the named developer's work.
2. Write the summary following **`specs/project-summary-rules-reference.md`**
   — the preserved template/framework (analysis framework A–D, writing guidelines, and the EXACT
   required document structure). The existing
   `~/Projects/brainspace/artifacts/project-summaries/*-project-summary.md` files are the matching
   exemplars; new summaries must match their structure exactly.
3. Summaries are inputs: they may name the client and teammates, and should say who built what
   (AGENTS.md, Confidentiality). Extract the real technology stack and details from the evidence —
   never invent metrics or tech.
4. Write to `~/Projects/brainspace/artifacts/project-summaries/<project>-project-summary.md`.

## Next step

A new or updated summary should flow into the bank — hand off to the `experience-bank` skill to
extract claims from it (`~/Projects/brainspace/artifacts/contributions/claims.yaml`), then rebuild
the index.
