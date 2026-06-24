# Specs Status — Active Tracker

The at-a-glance view of what's active, queued, and parked. Each row links to a spec in this
directory. Update the status/last-updated columns as work moves.

**Status legend:** `active` = being worked now · `next` = queued for the next branch · `deferred` =
designed but intentionally parked · `done` = shipped · `superseded` = replaced by a newer spec.

| Spec | Status | Target branch | Last updated |
| --- | --- | --- | --- |
| [experience-bank.md](./experience-bank.md) | active | `experience-bank` | 2026-06-23 |
| [skills-migration.md](./skills-migration.md) | done | `experience-bank` | 2026-06-23 |
| [artifact-validation.md](./artifact-validation.md) | deferred | future | 2026-06-23 |
| [resume-generator.md](./resume-generator.md) | deferred | future | 2026-06-23 |
| [repo-flatten.md](./repo-flatten.md) | done | `repo-flatten` | 2026-06-23 |
| [robustness-and-quality.md](./robustness-and-quality.md) | next | future | 2026-06-23 |
| [model-sdk-modernization.md](./model-sdk-modernization.md) | obsolete | — | 2026-06-23 |
| [linkedin-profile.md](./linkedin-profile.md) | superseded | `add-linkedin-project-generation` | 2026-06-23 |

Reference docs (preserved prompt IP, not roadmap items):
[render-rules-reference.md](./render-rules-reference.md),
[project-summary-rules-reference.md](./project-summary-rules-reference.md).

## Working order for the next branch

1. ~~**experience-bank**~~ — bank built and populated (active; curation is ongoing/conversational).
2. ~~**skills-migration**~~ — **done**: 3 skills built, AI-SDK layer + generators deleted, IP preserved.
3. ~~**model-sdk-modernization**~~ — **obsolete**: no API path left to modernize.
4. **robustness-and-quality** — remaining: tests, pin `@types/bun`, the `voiceCache` ESM fix, and the
   no-API reliability bugs from 2026-06-23. (Validate stubs + stale AI deps already removed.)
5. **resume-generator** — a render target, once you want it.

**Superseded:** `linkedin-profile.md` — the one-off artifact shipped, but profile-as-product is
replaced by the bank + render model. Kept for history.

## Cleanup log

The legacy `../future-ideas/` directory and the `../archive/` and `../resources/` directories were
removed 2026-06-23 (stale; superseded by current specs / the bank). Strengths were distilled into
working-style claims in the bank; Atomic company-values and old prompt/bio archives were dropped (git
retains history).
