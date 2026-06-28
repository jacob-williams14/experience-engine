# Spec: Rewire the tooling to the brainspace knowledge-base contract

**Status:** active · **Target branch:** `feat/kb-contract-rewire` · **Last updated:** 2026-06-24

## Why

A separate effort locked a knowledge-base architecture: `~/Projects/brainspace/` **is** the durable
source of truth and holds all state; this repo (`experience-engine`) is **pure processing** that reads
`brainspace/data/**` + `brainspace/career/atomic/worklog/**` and writes `brainspace/artifacts/**`,
owning no durable data beyond minor intermediates (a voice cache, processed `.tmp/`). The contract is
documented at `~/Projects/brainspace/docs/knowledge-base.md` (ratified; cowork mounts
the brainspace root and reads the bank).

Today this repo violates that: it holds inputs (`datasources/`, `data/posts*`), outputs
(`project-experience-summaries/`), and the bank itself (`experience-bank/claims.yaml` + `index.md`)
as durable, repo-local data, with hardcoded repo-relative paths throughout.

This branch (Phase 1) honors the read/write contract: centralize paths, migrate state out into
brainspace, and repoint all code + skills at the KB zones. Phases 2–4 (the `type` dimension,
worklog→bank enrichment, the source-of-truth note) are tracked separately.

## Path scheme

KB root resolved once in `lib/config.ts`: `BRAINSPACE_ROOT` env var, default `~/Projects/brainspace`.

| Zone | Path | Direction |
| --- | --- | --- |
| git logs | `data/git-logs/` | read |
| backlogs | `data/backlogs/` | read |
| voice samples (markdown) | `data/voice-samples/` | read |
| worklog | `career/atomic/worklog/` | read (Phase 3) |
| project summaries | `artifacts/project-summaries/` | write |
| bank | `artifacts/contributions/` | read/write (`claims.yaml` + `index.md`) |
| LinkedIn / bio renders | `artifacts/linkedin/`, `artifacts/bio/` | write |

Repo keeps **only mechanism + intermediates**: `lib/ tools/ getPosts.ts htmlToMarkdown.ts`,
`experience-bank/buildIndex.ts` (+ its `README.md`), `.claude/skills/`, `specs/`, plus repo-local
`voice-cache/` (allowed cache) and `.tmp/` (re-derivable intermediates: raw downloaded posts, the
processed git-data `--save` output). No `data/` or output dirs in the repo.

## Migration (plain `mv`; brainspace is not a git repo, so `git add -A` stages the repo-side deletions)

| Repo (now) | Brainspace (target) |
| --- | --- |
| `datasources/*git_log.txt` (2) | `data/git-logs/` |
| `datasources/*backlog.csv` (3) | `data/backlogs/` |
| `data/posts-md/*` (4703) | `data/voice-samples/` |
| `project-experience-summaries/*` (5) | `artifacts/project-summaries/` |
| `experience-bank/claims.yaml` + `index.md` | `artifacts/contributions/` |
| `data/posts/*` (4703 raw json) | repo `.tmp/posts/` (re-fetchable intermediate) |
| `voice-cache/` | **stays in repo** |

## Code repointing

- `lib/config.ts` — add the resolved `KB` zone-path object; repoint `PROCESSED_DATA_DIR` to repo
  `.tmp/processed` (non-durable).
- `getPosts.ts` — `OUTPUT_DIR` → `.tmp/posts/`.
- `htmlToMarkdown.ts` — read from `.tmp/posts/`, write markdown to `KB.VOICE_SAMPLES`.
- `experience-bank/buildIndex.ts` — read/write `KB.CONTRIBUTIONS/{claims.yaml,index.md}` (replace the
  `import.meta.url` resolution); ensure the dir exists.
- `tools/extractGitData.ts`, `tools/processBacklog.ts` — input path is a CLI arg (skills pass the
  brainspace path); only help-text examples need updating.
- All four `.claude/skills/*/SKILL.md` — repoint every read/write to the brainspace zones
  (default `~/Projects/brainspace/...`).

## Phase 2 — bank organized by technical / non-technical (done)

- Added `type: technical | non-technical` to every claim (53 technical from the project summaries; the
  3 `style-*` working-style claims = non-technical seeds). Documented the field in `claims.yaml`'s
  header.
- `buildIndex.ts` now groups by `type` first (top-level `## Technical` / `## Non-technical`), domains
  nested as `###` beneath; summary line carries the type counts.
- `experience-bank` skill schema documents `type` and the forward-capture rule for non-technical.

## Phase 3 — worklog → bank enrichment (forward-only)

A mode on the `experience-bank` skill that reads the worklog and proposes `type: non-technical`
claims (the "why": decisions, mentoring, process, leadership) for Jacob's approval, then writes the
approved ones into the bank. Agent-driven (no code/API), per the contract.

- **Scope of input:** genuine work reflections only — weekly summaries (`*-summary.md`) and session
  logs (`YYYY-MM-DD-HHMM-<slug>.md`). SKIP agent handoff entries (frontmatter `type: handoff`) and
  `README.md`.
- **Idempotency (the real guard):** each non-technical claim records `source: <worklog-filename>`;
  skip any worklog entry already cited in an existing claim's `source:`. This survives backfill (an
  out-of-order entry still isn't in any `source:`, so it's reconsidered).
- **Watermark:** `meta.worklog_enriched_through: <YYYY-MM-DD>` records how far enrichment has run — a
  fast "where did I leave off" marker and a visible cursor, not the dedup mechanism.
- **Confidentiality:** anonymize per the same rules (clients by domain; honor the worklog's NDA note).
- **Curation gate:** propose claims in chat; only write the ones Jacob approves; then advance the
  watermark and rebuild the index.
- **Decision (2026-06-24):** `project-summary` does **NOT** read the worklog. The "why" enters the
  bank only through the worklog→non-technical path; summaries stay "what was built" (git/backlogs).
  This preserves the two-types/two-sources split from Phase 2 and avoids double-counting.

## Phase 4 — reconcile the source-of-truth docs (done)

`artifacts/README.md` reframed to the bank model: `contributions/` is **the experience bank**
(`claims.yaml` + `index.md`, tagged technical/non-technical), the curated source of truth — distinct
from the regenerable renders (summaries, LinkedIn, bio). Dropped the heavy "polished, aggregated
contributions record" wording and the blanket "everything here is regenerable" claim. (The
`knowledge-base.md` half was done in Phase 0.)

## Follow-on

- **cowork-runnable skills** — make the skills usable from cowork (the driver), keeping the repo as
  the canonical tool. Tracked in `specs/cowork-runnable-skills.md` (status: next). Do after Phases 1–4
  land and the enrichment path is tested.

## Verification

1. `rg -n 'datasources|project-experience-summaries|data/posts-md'` in the repo returns nothing live
   (only specs/changelog history).
2. Repo holds no `data/` or output dirs (only `voice-cache/` + `.tmp/`).
3. `bun run type-check` passes.
4. `bun run buildBankIndex` reads/writes under `brainspace/artifacts/contributions/`.
5. The 5 datasources, 5 summaries, and the bank now live in the correct brainspace zones; nothing lost.
