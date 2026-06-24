# Specs Status — Active Tracker

The at-a-glance view of what's active, queued, and parked. Each row links to a spec in this
directory. Update the status/last-updated columns as work moves.

**Status legend:** `active` = being worked now · `next` = queued for the next branch · `deferred` =
designed but intentionally parked · `done` = shipped · `superseded` = replaced by a newer spec.

| Spec | Status | Target branch | Last updated |
| --- | --- | --- | --- |
| [kb-contract-rewire.md](./kb-contract-rewire.md) | done (P1–4, merged) | `feat/kb-contract-rewire` | 2026-06-24 |
| [log-work-capture.md](./log-work-capture.md) | active | user-level skill | 2026-06-24 |
| [cowork-runnable-skills.md](./cowork-runnable-skills.md) | deferred | — | 2026-06-24 |
| [experience-bank.md](./experience-bank.md) | active | `experience-bank` | 2026-06-23 |
| [skills-migration.md](./skills-migration.md) | done | `experience-bank` | 2026-06-23 |
| [artifact-validation.md](./artifact-validation.md) | deferred | future | 2026-06-23 |
| [resume-generator.md](./resume-generator.md) | deferred | future | 2026-06-23 |
| [repo-flatten.md](./repo-flatten.md) | done | `repo-flatten` | 2026-06-23 |
| [robustness-and-quality.md](./robustness-and-quality.md) | mostly done (tests deferred) | future | 2026-06-23 |
| [model-sdk-modernization.md](./model-sdk-modernization.md) | obsolete | — | 2026-06-23 |
| [linkedin-profile.md](./linkedin-profile.md) | superseded | `add-linkedin-project-generation` | 2026-06-23 |

Reference docs (preserved prompt IP, not roadmap items):
[render-rules-reference.md](./render-rules-reference.md),
[project-summary-rules-reference.md](./project-summary-rules-reference.md).

## Working order for the next branch

0. ~~**kb-contract-rewire**~~ — **done & merged**: Phases 1–4 (paths centralized in `lib/config.ts`;
   state migrated into `brainspace/{data,artifacts}/`; bank tagged `type: technical | non-technical`
   with a type-grouped index; worklog→bank enrichment with `source:`-keyed dedup + watermark;
   `artifacts/README.md` reframed). Enrichment tested end-to-end against the real worklog. brainspace
   is now its own git repo.
1. **log-work-capture** (active) — `/log-work` user-level skill written
   (`~/.claude/skills/log-work/`, tracked via dotfiles); writes session logs to the worklog. Bank side
   wired: enrich step now takes technical **or** non-technical from the worklog and carries
   `source` + `agent_assisted`. Not yet exercised with a real session log. See `log-work-capture.md`.
2. ~~**cowork-runnable-skills**~~ — **deferred (abandoned for now)**: the async worklog handoff loop
   already covers the workflow; the port's permanent sync cost isn't justified by speculative gain.
   Revisit only on real friction.
3. ~~**experience-bank**~~ — bank built and populated (active; curation is ongoing/conversational).
4. ~~**skills-migration**~~ — **done**: 3 skills built, AI-SDK layer + generators deleted, IP preserved.
5. ~~**model-sdk-modernization**~~ — **obsolete**: no API path left to modernize.
6. **robustness-and-quality** — remaining: tests, pin `@types/bun`, the `voiceCache` ESM fix, and the
   no-API reliability bugs from 2026-06-23. (Validate stubs + stale AI deps already removed.)
7. **resume-generator** — a render target, once you want it.

**Superseded:** `linkedin-profile.md` — the one-off artifact shipped, but profile-as-product is
replaced by the bank + render model. Kept for history.

**Parked decisions (2026-06-24):**

- **cowork-runnable skills** — deferred (see above / `cowork-runnable-skills.md`).
- **brainspace auto-commit** — declined. brainspace is a git repo, but commits stay **manual /
  skill-driven** (no always-on Stop/SessionStart hook). Revisit if state starts going uncommitted in
  practice.

## Cleanup log

The legacy `../future-ideas/` directory and the `../archive/` and `../resources/` directories were
removed 2026-06-23 (stale; superseded by current specs / the bank). Strengths were distilled into
working-style claims in the bank; Atomic company-values and old prompt/bio archives were dropped (git
retains history).
