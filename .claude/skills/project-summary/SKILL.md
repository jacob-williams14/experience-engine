---
name: project-summary
description: >-
  Generate a large, detailed per-project experience summary from raw project data (git logs, CSV
  backlogs) into project-experience-summaries/. Use when asked to summarize a project, generate a
  project summary, or process a new project's git log / backlog. Triggers on "generate a project
  summary", "summarize <project>", "process this git log / backlog".
---

# Project Summary

Produces the large, structured per-project summaries in
`project-experience-summaries/`. These are the upstream layer the
`experience-bank` skill pulls claims from. No API — Claude Code is the model.

## Input

Raw project data in `datasources/`:

- a git log (`.txt`), or
- a CSV backlog (`.csv`).

For large or messy logs, structure them first with the deterministic parsers (optional — for normal
files you can read the raw datasource directly):

```bash
bun run extractGitData datasources/<file>.txt "Jacob Williams" "<Project>"   # git log
bun run processBacklog datasources/<file>.csv "Jacob Williams" "<Project>"   # CSV backlog
```

## Generate

1. Read the datasource (raw or parsed), focusing only on the named developer's work.
2. Write the summary following **`specs/project-summary-rules-reference.md`**
   — the preserved template/framework (analysis framework A–D, writing guidelines, and the EXACT
   required document structure). The existing `project-experience-summaries/*-project-summary.md`
   files are the matching exemplars; new summaries must match their structure exactly.
3. Confidentiality: describe the client by domain, not name; only "Atomic Object" appears. Extract the
   real technology stack and details from the evidence — never invent metrics or tech.
4. Write to `project-experience-summaries/<project>-project-summary.md`.

## Next step

A new or updated summary should flow into the bank — hand off to the `experience-bank` skill to
extract claims from it (`experience-bank/claims.yaml`), then rebuild the index.
