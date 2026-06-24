# Spec: `/log-work` capture skill (forward session logging)

**Status:** active · **Skill location:** user-level (`~/.claude/skills/log-work/`, NOT this repo) ·
**Last updated:** 2026-06-24

## Why

Retrospective git/backlog mining captures *what shipped* but loses the *why/how/tradeoffs*.
`/log-work` is the **forward, in-the-moment** capture: at the end of a meaningful session it records
the reasoning while it's fresh. It's also the **lightweight path for side and client projects** that
may never get the heavy git-log→summary treatment — their work can still reach the bank.

## Why user-level (not in this repo)

You log sessions from *whatever project you're working in*, not just `experience-engine`. A user-level
skill (`~/.claude/skills/log-work/`) loads in every Claude Code session. It writes into the one shared
worklog at `~/Projects/brainspace/WorkLife/atomic/worklog/`; the bank and all processing stay in the
`experience-engine` tool.

## Three orthogonal dimensions (settled)

| Dimension | Where | Values | Answers |
| --- | --- | --- | --- |
| `type` | bank claim | technical / non-technical | *what the claim is about* |
| `source` | bank claim | the worklog filename it came from | *which input it came from* (provenance) |
| `agent_assisted` | log entry + claim | true / false | *was an AI agent involved* (honest framing) |

`type` (bank) and the worklog entry's `kind` are deliberately different namespaces: `kind` =
*what kind of worklog entry* (`session-log` / `summary` / `handoff`); `type` = *what type of claim*.

## Session-log entry format

Written as `YYYY-MM-DD-HHMM-<slug>.md` in the worklog:

```text
---
date: YYYY-MM-DD
kind: session-log
project: <slug>
branch: <branch>
agent_assisted: true
tags: [<area>]
---

## What I did
## Why / key decisions
## Unblocked / mentored
## Open threads
```

## Rule change: technical claims may now come from the worklog

Phase 3 sourced technical claims only from git summaries. `/log-work` **relaxes** that: a session log
can yield **technical OR non-technical** claims, distinguished by `source`. (`project-summary` still
does NOT read the worklog — summaries stay git/backlog. The two-sources discipline holds via `source`.)
This is what lets side/client projects produce claims without a full summary pass.

## Bank schema additions

- **`agent_assisted: true | false`** on claims derived from agent sessions.
- **`source`** generalized: the worklog filename for **any** worklog-sourced claim (was
  non-technical-only).

## Confidentiality

The log lives in `WorkLife/` (NDA-noted) and may contain client specifics — written **honestly**.
Anonymization (clients → domain) happens only when a claim reaches the bank, at the enrich step. The
log itself is not sanitized.

## Companion change: the `experience-bank` enrich step (in this repo)

The enrich-from-worklog mode is updated to:

- recognize `kind: session-log` entries alongside weekly summaries; still skip `kind: handoff`;
- extract **technical or non-technical** claims (not just non-technical);
- set `source` and carry `agent_assisted` from the log;
- frame agent-assisted claims at **Jacob's** altitude (what he directed / decided / reviewed), not
  the artifact's.

## Commits

`/log-work` commits the new entry to the brainspace git repo itself (skill-driven — we declined the
always-on auto-commit hook).

## Out of scope

- Auto-running enrichment from `/log-work` — capture and curation stay separate (curation has a
  human approval gate).
- Versioning the skill here — it lives in `~/.claude/` (track it via dotfiles if desired).
