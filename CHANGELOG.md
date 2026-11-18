# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project does
not use formal version numbers yet; changes are grouped by branch/date under `Unreleased` until a
versioning scheme is adopted.

## [Unreleased]

### Fixed — parsers no longer credit teammates' work; index refuses a broken bank

- `extractGitData` matched authors by substring both ways, so "Jacob", "Will" or "Jacob
  Williamson" counted as Jacob, while `--email` was never compared to anything. Matching is now
  exact on a compact form (case, spaces, punctuation ignored) or on the commit email, shared with
  `processBacklog` through `lib/identity.ts`; the other authors are listed so a missed spelling can
  be added with `--alias`. Why: a summary built from a teammate's commits is an invented fact.
- `processBacklog` kept every row when it found no assignee column (on a real updates export, 80 of
  147 rows were other people's), matched a short `--username` inside longer names, and its `--save`
  did nothing. It now fails without an assignee column (`--column` names one), matches per person
  in a cell, skips id columns, and `--save` writes `.tmp/processed/`.
- `buildBankIndex` refuses (exit 1, index untouched) a duplicate id, a claim with no id or domain,
  or a file with no `claims:` list, instead of writing an `### undefined` section. Output for a
  valid bank is byte-identical (checked against the live bank and a fixture).
- `BRAINSPACE_ROOT=""` resolved to the current directory and a quoted `~` was not expanded; both
  now resolve correctly. Repo-local `.tmp/` paths are anchored to the repo, not the cwd.
- `htmlToMarkdown` exits non-zero when a post fails to convert.
- From `/code-review`: the backlog parser skips "Assigned By"-style and id columns, reads an
  `@handle` as a name, folds accents, strips an Excel BOM, matches `--column` in any case, and
  fails when no row matches (listing the assignees it saw). Both parsers share argument parsing,
  and a flag missing its value is an error. The index also refuses a non-list `tech`.
- From `/simplify`: both parsers go through one `partitionByDeveloper` (match keys built once), so
  both fail the same way when nothing matches, by listing who they saw. A backlog with two
  candidate assignee columns now fails and asks for `--column` instead of OR-ing them. Results are
  a plain success/error union; tests call the renderer and parsers in-process.

### Changed — skills close confidentiality and caveat gaps

- `tailored-render` reads `claims.yaml` as text so section-comment caveats bind the render, keeps
  internal fields and people's names out, and re-checks the final draft for anything identifying.
- `experience-bank`: `scope` lists all five values in use, `snapshot` is documented, domain strings
  are reused from the bank, no people's names, and "trace to source" covers worklog-sourced claims.
- `voice-signature` analyzes only Jacob's posts (the folder holds every author's).
- `render-rules-reference`: tech tags come only from the claim's `tech`.

### Added — CI

- `.github/workflows/checks.yml` runs `bun test` and the type check on every PR and on pushes to
  main. Bun comes from npm at a pinned version; the only action is GitHub's checkout, pinned to a
  commit, so no third-party action runs.

### Changed — project summaries may name clients

- Summaries are internal inputs, like the worklog. AGENTS.md and the `project-summary` skill said
  to anonymize them, but every existing summary names its client and teammates. The rule now
  matches practice: anonymizing happens when claims are extracted into the bank (decided by
  Jacob 2026-11-18).

### Added — `bun test` suite over fixtures

- `test/` covers the parsers' attribution, the index renderer (golden output, internal fields
  kept out, the sorter's line limit, refusals) and root resolution. The first version of the
  suite (22 tests) failed 16 against the old code.

### Removed — dead code

- Unused types, the `@inquirer` prompt wrappers and both `@inquirer` dependencies,
  `lib/voiceCache.ts` (no caller), an unused config key, and API-key placeholders in
  `.envrc.sample` (now a `BRAINSPACE_ROOT` sample).

### Added — `job-scout` skill

- Orchestrates a job-search sweep: Haiku scouts per company bucket (public ATS JSON APIs first),
  orchestrator triage, Sonnet `jd-analyzer` agents per top posting saved to `career/postings/`,
  and Pipeline rows recorded in `career/job-search.md`. The orchestrator never reads JD bodies or
  the bank. `jd-analyzer` now names the canonical save path.

### Added — claims are checked where they are used: render-time evidence, `verified`, `correction`

- `tailored-render` now shows, in chat under each render, the evidence for every unverified
  claim it used: source file, scope, agent-assisted or not, each number with its caveat, and
  anything the wording stretches. Accepting the render stamps those claims `verified`.
- Why: enrichment PRs can now merge without Jacob, and he does not review the bank claim by
  claim. A render uses a dozen claims, so that is where an overstated one is cheap to catch.
- A `correction` note on a claim records a fix he made and binds later enrichment, so a source
  log that overstates cannot reintroduce it. Changing a verified claim's wording clears
  `verified`.

### Changed — bank claims gain `refs`, themes become a closed list, enrichment cross-references tickets

- `/log-work` session logs now carry `tickets:` and `tech:` frontmatter and a `Results / numbers`
  section (replacing free-form `tags`, `Unblocked / mentored` and `Open threads`). Enrichment
  uses `tickets` to find the claim a log's work already produced and extends it instead of
  duplicating; a log with no tickets stands alone as a source.
- Claims gain an internal `refs` field (ticket / PR ids) as the join key, and
  `meta.worklog_folded` records logs folded into an existing claim so they aren't re-read.
- `themes` is now a closed, documented list of 14: `system design` is narrowed to architecture
  and `feature delivery`, `security`, `AI-assisted delivery`, `mentoring`, `client partnership`
  and `product judgment` are added. The old list of eight left non-technical claims squeezed into
  engineering themes and put `system design` on half the bank.
- Enrichment sign-off is per batch, with only the judgment calls surfaced, not per claim.

### Changed — `jd-analyzer` reads the target profile for direction fit

- Direction fit now comes from `brainspace/career/target-profile.md` (role shape, dealbreakers,
  company-shape bars) instead of the hedged Career direction paragraph in about-jacob. A posting
  the profile says to skip is skip regardless of score. The profile was written 2026-10-21 from a
  long interview-style session.

### Changed — tracking rule, no LinkedIn snapshots, short-copy voice rule

- `CHANGELOG.md` is now the tracker for all changes; specs are reserved for real development
  work. The two new skills had shipped with only a changelog entry, which turned out to be the
  right amount.
- `linkedin-review` no longer saves profile snapshots (`data/linkedin/` removed from brainspace).
  The approved paste list in `artifacts/linkedin/` is the record and the next review's baseline;
  the live profile is always re-readable.
- `tailored-render` applies the blog voice to long-form only; short copy starts from resume
  wording. Every draft, long or short, gets a `/no-ai-slop` detect pass. The first LinkedIn
  review showed the blog tics read as AI slop in a 300-character About.
- `linkedin-review` drops the Save-to-PDF fallback inherited from the original skill; the live
  profile through a browser is the only input.
- `AGENTS.md` pointed at `brainspace/docs/knowledge-base.md`; the file lives at
  `docs/reference/knowledge-base.md`.

### Added — `jd-analyzer` and `linkedin-review` skills

- Adapted from `job-description-analyzer` and `linkedin-profile-optimizer` in
  [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills) (MIT), rewired so the
  experience bank is the only evidence: match scores cite claim ids, and the LinkedIn review reads
  the live profile through whichever browser the session has (read-only — Jacob pastes fixes) and audits it
  against the bank and resume. Generic content (cover
  letters, application timelines, posting cadence) was dropped.
- `linkedin-review` exercised end-to-end on 2026-10-14 (built-in browser, live profile): first
  snapshot and an approved paste list landed in brainspace. `jd-analyzer` first run the same day on
  a LinkedIn posting; it surfaced two gaps now fixed: a browser-reading step (LinkedIn's description
  needs a page-script read) and a scoring rule for postings with no nice-to-haves.

### Changed — brainspace restructure: worklog path

- **`KB.WORKLOG` repointed** from `WorkLife/atomic/worklog/` to `career/atomic/worklog/`. The
  brainspace repo dissolved its `WorkLife/` wrapper into top-level `foundation/`, `career/`, and
  `personal/` domains (2026-06-27). Updated `lib/config.ts` plus the contract references in
  `AGENTS.md`, `README.md`, the specs, and the `experience-bank` skill. Reads/writes are otherwise
  unchanged (`data/**` + the worklog → `artifacts/**`).

### Changed — bank scope: professional + personal (`context`)

- **Dropped the "Atomic-only" rule.** The bank now holds professional (Atomic/client) **and**
  personal/side-project experience, tagged `context: professional | personal` (default professional)
  so renders keep paid client work distinct from side projects. Backfilled `context: professional`
  on all 59 existing claims; the index shows a `· personal` marker. Updated the `experience-bank`
  skill + `claims.yaml` schema.
- **First worklog-sourced enrichment run, end to end:** captured this build session via `/log-work`,
  ran the enrich-and-approve gate (which surfaced the scope question above), and banked one `personal`
  technical claim (`tooling-experience-engine`). Bank: 59 → 60 claims; watermark → `2026-06-24`.

### Added — `/log-work` session capture + bank provenance

- **`/log-work` skill (user-level, `~/.claude/skills/log-work/`, tracked via dotfiles)** — forward,
  in-the-moment capture: at the end of a session in **any** project, writes a `type: session-log`
  entry into the brainspace worklog (what was built, decisions/why, who was unblocked, open threads),
  `agent_assisted: true`, and commits it. Capture only — the `experience-bank` enrich step picks it up
  later under the human approval gate. See `specs/log-work-capture.md`.
- **Bank schema: `agent_assisted` added; `source` generalized** to any worklog-sourced claim. The
  enrich step now extracts **technical or non-technical** claims from the worklog (relaxing the
  Phase-3 "technical only from git summaries" rule) — the lightweight path for side/client projects —
  and frames agent-assisted work at Jacob's altitude (`project-summary` still does not read the worklog).

### Changed — rename bank claim dimension `kind` → `type`

- Renamed the technical/non-technical dimension from `kind` to `type` across the renderer, the
  `experience-bank` skill, `claims.yaml` (all 59 claims), and the specs. Worklog entry frontmatter
  also uses `type` (`session-log` / `summary` / `handoff`) — same field name on a different object
  (entry vs. claim), no `kind` left anywhere.

### Changed — KB contract rewire (Phase 4): reconcile source-of-truth docs

- **Reframed `brainspace/artifacts/README.md` to the bank model.** `contributions/` is now described
  as the experience bank (`claims.yaml` + `index.md`, tagged technical/non-technical) — the curated
  source of truth, distinct from the regenerable renders. Dropped the heavy "polished, aggregated
  contributions record" wording and the blanket "everything regenerable" claim. (The
  `knowledge-base.md` half was done in Phase 0.) Completes Phases 1–4 of `specs/kb-contract-rewire.md`.
- Added `specs/cowork-runnable-skills.md` (status: next) — plan to make the skills drivable from
  cowork (the intended driver), with this repo staying the canonical tool.

### Added — KB contract rewire (Phase 3): worklog → bank enrichment

- **Worklog→bank enrichment mode on the `experience-bank` skill** — reads
  `brainspace/WorkLife/atomic/worklog/`, proposes `type: non-technical` claims (decisions, mentoring,
  process — the "why") for Jacob's approval, then writes the approved ones. Agent-driven, no API.
- **Idempotency by `source:`** — each non-technical claim records the worklog filename it came from;
  entries already cited are skipped (survives backfill). `meta.worklog_enriched_through` added as an
  advisory cursor. Documented both fields in `claims.yaml`'s header; skips `type: handoff` entries.
- **Decision:** `project-summary` does **not** read the worklog — the "why" enters the bank only via
  the worklog→non-technical path, preserving the Phase 2 two-types/two-sources split. See
  `specs/kb-contract-rewire.md` (Phase 3).

### Added — KB contract rewire (Phase 2): technical / non-technical bank

- **Tagged every bank claim with `type: technical | non-technical`** (53 technical pulled from the
  project summaries; the 3 `style-*` working-style claims are the non-technical seeds). Non-technical
  claims are the "why" (decisions, mentoring, process) and are captured forward from the worklog;
  documented the field in `claims.yaml`'s header and the `experience-bank` skill schema.
- **Bank index now groups by `type`** (top-level `## Technical` / `## Non-technical`, with domains
  nested beneath); `buildIndex.ts` surfaces both and reports the type split. See
  `specs/kb-contract-rewire.md` (Phase 2).

### Changed (structure) — KB contract rewire (Phase 1)

- **Migrated all durable state out of the repo into the brainspace knowledge base.** The repo is now
  pure processing per the contract in `brainspace/WorkLife/self/notes/knowledge-base.md`. Moved:
  `datasources/*` → `brainspace/data/{git-logs,backlogs}/`; `data/posts-md/*` (4703) →
  `brainspace/data/voice-samples/`; `project-experience-summaries/*` (5) →
  `brainspace/artifacts/project-summaries/`; `experience-bank/{claims.yaml,index.md}` →
  `brainspace/artifacts/contributions/`. Raw downloaded posts (`data/posts/`) became the repo-local
  intermediate `.tmp/posts/`. `voice-cache/` stays in the repo. Removed the emptied `datasources/`,
  `project-experience-summaries/`, and `data/` dirs. See `specs/kb-contract-rewire.md`.
- **Centralized paths in `lib/config.ts`**: added the resolved `KB` zone-path object and
  `BRAINSPACE_ROOT` env var (default `~/Projects/brainspace`); repointed `PROCESSED_DATA_DIR` to the
  non-durable `.tmp/processed`.
- **Repointed all I/O** to the KB: `getPosts.ts` (`.tmp/posts/`), `htmlToMarkdown.ts` (reads
  `.tmp/posts/`, writes `KB.VOICE_SAMPLES`), `experience-bank/buildIndex.ts` (reads/writes
  `KB.CONTRIBUTIONS`, replacing the `import.meta.url` resolution), and the help-text examples in
  `tools/extractGitData.ts` + `tools/processBacklog.ts`.
- **Repointed all four skills** (`project-summary`, `experience-bank`, `tailored-render`,
  `voice-signature`) to the brainspace zones; refreshed `AGENTS.md`, `README.md`, and
  `experience-bank/README.md` (now documents the renderer; the bank data lives in the KB). Added
  `.tmp/` to `.gitignore` and dropped the stale `data` ignore.

### Changed (structure)

- **Flattened the repo.** Moved everything from `project-experience-artifacts/` to the repo root and
  removed the directory — this is a single-project repo, not a monorepo. Merged the project README
  into the root README and stripped the `project-experience-artifacts/` path prefix from the skills,
  `AGENTS.md`, and README. See `specs/repo-flatten.md`. (Paths in this changelog's older entries
  reference the pre-flatten layout.)

### Added

- **Experience bank** (`experience-bank/`): `claims.yaml` with **53 tagged, confidentiality-safe
  claims** pulled from `project-experience-summaries/*` (the generated upstream layer), plus
  `README.md`. The bank is the source of truth; documents are renders over it.
- **Bank index renderer**: `experience-bank/buildIndex.ts` (`bun run buildBankIndex`) generates
  `experience-bank/index.md`, a browsable grouped view. Adds the `yaml` dependency.
- **Claude Code skills** (one per operation, directly invokable): `.claude/skills/project-summary/`
  (datasources → summary), `.claude/skills/experience-bank/` (summary → claims; maintain the bank),
  `.claude/skills/tailored-render/` (render LinkedIn/resume/JD), `.claude/skills/voice-signature/`
  (writing voice). The `skills-migration` work landing.
- `specs/render-rules-reference.md` — preserved the `createSynthesisPrompt` phrasing rules (now used
  by the `tailored-render` skill) before deleting the synthesizer.
- LinkedIn profile artifact: `project-experience-artifacts/linkedin-experience/jacob-williams-linkedin-profile.md`
  (Headline variants, About section, refreshed Atomic Object Experience entry) — generated directly
  by Claude Code with no API usage.
- `specs/experience-bank.md` — new primary direction: a tagged **claim bank** as the source of truth
  with cheap, target-specific **renders** (LinkedIn/resume/JD) on top, replacing the profile-centric
  framing. Reconciled across `linkedin-profile.md` (superseded), `skills-migration.md` (reframed to
  `experience-bank` + `tailored-render` skills), and `resume-generator.md` (now a render target).
- `project-experience-artifacts/specs/` — individual, trackable spec files: `linkedin-profile.md`,
  `skills-migration.md`, `resume-generator.md`, `model-sdk-modernization.md`,
  `robustness-and-quality.md`.
- `project-experience-artifacts/specs/STATUS.md` — active-status tracker indexing all specs.
- `CHANGELOG.md` (this file).

- **`voice-signature` skill** (`.claude/skills/voice-signature/`) — produces/refreshes the writing
  voice from blog posts, including optional year-by-year style-evolution analysis (the preserved
  `analyzeStyleOverTime` capability).
- `specs/project-summary-rules-reference.md` — preserved the `analyzeProject` summary template/
  framework so the `experience-bank` skill generates new summaries at the same depth and structure.

### Removed

- Retired the synthesizer `generateAtomicExperience.ts` (both copies) and its output artifacts
  (`jacob-williams-linkedin-profile.md`, `jacob-williams-atomic-object-experience.md`). Its premise —
  compress all claims into 4 generic bullets — was wrong; its rules are preserved in
  `specs/render-rules-reference.md`. The per-project `*-linkedin-experience.md` files are kept as
  bank input.
- **Completed the skills migration — deleted the entire AI-SDK/provider layer and all AI generator
  scripts (16 files):** `lib/ai.ts`, `lib/claude.ts`, `lib/aiConfig.ts`, `.ai-config.json`,
  `scripts/configureAI.ts`, `lib/voiceHelper.ts`, `scripts/analyzeAuthorStyle.ts`,
  `scripts/analyzeStyleOverTime.ts`, `generateProjectSummary.ts` + `scripts/analyzeProject.ts`,
  `generateBio.ts` (+`scripts/`), `generateLinkedInExperience.ts` (+`scripts/`), and the empty
  `scripts/validateOutput.ts` / `tools/validateArtifacts.ts` stubs. Project-summary and
  style-evolution generation capability is preserved via skills + reference docs; per-project-bullet
  and bio generation were intentionally dropped (their existing artifacts remain as data).
- Removed now-unused dependencies: `@anthropic-ai/sdk`, `@ai-sdk/openai`, `ai`, `zod`.
- Deleted `linkedin-experience/` (5 per-project bullet files — redundant with the bank, carried stale
  tool headers, and leaked un-anonymized client names) and `professional-bios/` (superseded by the
  bank + voice; its one distinct nuance was folded into a working-style claim first). Removed the now
  orphaned `BIO_OUTPUT_DIR` config constant.
- **Stale-resource cleanup:** deleted `resources/atomic-values/` (company boilerplate),
  `resources/strengths/` (distilled into the bank first — see below), `archive/` (old prompts/bios/
  examples), and `future-ideas/` (superseded by `specs/`). Also removed local junk:
  `enriched-style-summaries-*.json`, `locally-generated-prompts/`, stray `.DS_Store`.

### Changed

- Folded CliftonStrengths into the bank as three `working style / approach` claims (replacing the raw
  `resources/strengths/*.txt`); `tailored-render` uses them for About/summary renders. Bank now 56
  claims across 5 domains.
- Rewrote `project-experience-artifacts/README.md` to document the bank+skills architecture (the old
  one described the removed AI-generator system).
- **Consolidated agent docs into a single `AGENTS.md`** (repo root) as the source of truth; `CLAUDE.md`
  imports it (`@AGENTS.md`) and `WARP.md` points to it, so all agents share one set of instructions.
  Refreshed the root `README.md` and removed the stale per-project `CLAUDE.md` (now covered by root).
- LinkedIn profile Experience section regenerated from the **canonical synthesizer prompt** (run in
  `local` mode, no API) instead of a freehand draft. Removed a fabricated metric ("hundreds of
  thousands of cases") that the prompt's own rules forbid.
- `scripts/generateAtomicExperience.ts` `createSynthesisPrompt`: added a **required, reproducible
  keyword rule** — every bullet ends with a parenthetical tech-stack tag drawn only from that
  bullet's source material (e.g. "(React Native, Expo, Stripe)"). Reconciles the standing tension
  where the prompt asked to keep recruiter keywords but the brevity rules evicted them, so reruns now
  consistently surface the stack. Tags applied to the profile's Experience bullets.

### Notes

- Audit of the repo identified the AI-SDK layer (`lib/ai.ts`, `lib/claude.ts`, `lib/aiConfig.ts`)
  as a generation behind and a candidate for removal once generators become Claude Code skills. See
  `specs/skills-migration.md` and `specs/model-sdk-modernization.md`.
- The committed career artifacts are treated as the quality baseline; regenerated artifacts are
  adopted only when clearly better.
- A 2026-06-23 canonical-path test run (local mode) confirmed real prompt
  drift and three no-API reliability bugs (stale voice-cache can't fall back,
  output/input directory collision, rtk arg-quote stripping). Logged in
  `specs/robustness-and-quality.md` and `specs/skills-migration.md`.
