# Spec: Rewire the tooling to the brainspace knowledge-base contract

**Status:** active · **Target branch:** `feat/kb-contract-rewire` · **Last updated:** 2026-06-24

## Why

A separate effort locked a knowledge-base architecture: `~/Projects/brainspace/` **is** the durable
source of truth and holds all state; this repo (`experience-engine`) is **pure processing** that reads
`brainspace/data/**` + `brainspace/WorkLife/atomic/worklog/**` and writes `brainspace/artifacts/**`,
owning no durable data beyond minor intermediates (a voice cache, processed `.tmp/`). The contract is
documented at `~/Projects/brainspace/WorkLife/self/notes/knowledge-base.md` (ratified; cowork mounts
the brainspace root and reads the bank).

Today this repo violates that: it holds inputs (`datasources/`, `data/posts*`), outputs
(`project-experience-summaries/`), and the bank itself (`experience-bank/claims.yaml` + `index.md`)
as durable, repo-local data, with hardcoded repo-relative paths throughout.

This branch (Phase 1) honors the read/write contract: centralize paths, migrate state out into
brainspace, and repoint all code + skills at the KB zones. Phases 2–4 (the `kind` dimension,
worklog→bank enrichment, the source-of-truth note) are tracked separately.

## Path scheme

KB root resolved once in `lib/config.ts`: `BRAINSPACE_ROOT` env var, default `~/Projects/brainspace`.

| Zone | Path | Direction |
| --- | --- | --- |
| git logs | `data/git-logs/` | read |
| backlogs | `data/backlogs/` | read |
| voice samples (markdown) | `data/voice-samples/` | read |
| worklog | `WorkLife/atomic/worklog/` | read (Phase 3) |
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

- Added `kind: technical | non-technical` to every claim (53 technical from the project summaries; the
  3 `style-*` working-style claims = non-technical seeds). Documented the field in `claims.yaml`'s
  header.
- `buildIndex.ts` now groups by `kind` first (top-level `## Technical` / `## Non-technical`), domains
  nested as `###` beneath; summary line carries the kind counts.
- `experience-bank` skill schema documents `kind` and the forward-capture rule for non-technical.

## Out of scope (later phases)

- **Phase 3:** worklog → bank enrichment (watermarked, forward-only).
- **Phase 4:** reconcile `artifacts/README.md` wording (the `knowledge-base.md` half was done in
  Phase 0).

## Verification

1. `rg -n 'datasources|project-experience-summaries|data/posts-md'` in the repo returns nothing live
   (only specs/changelog history).
2. Repo holds no `data/` or output dirs (only `voice-cache/` + `.tmp/`).
3. `bun run type-check` passes.
4. `bun run buildBankIndex` reads/writes under `brainspace/artifacts/contributions/`.
5. The 5 datasources, 5 summaries, and the bank now live in the correct brainspace zones; nothing lost.
