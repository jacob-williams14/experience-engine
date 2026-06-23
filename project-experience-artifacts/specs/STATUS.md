# Specs Status — Active Tracker

The at-a-glance view of what's active, queued, and parked. Each row links to a spec in this
directory. Update the status/last-updated columns as work moves.

**Status legend:** `active` = being worked now · `next` = queued for the next branch · `deferred` =
designed but intentionally parked · `done` = shipped · `superseded` = replaced by a newer spec.

| Spec | Status | Target branch | Last updated |
| --- | --- | --- | --- |
| [experience-bank.md](./experience-bank.md) | next | future | 2026-06-23 |
| [skills-migration.md](./skills-migration.md) | next | future | 2026-06-23 |
| [resume-generator.md](./resume-generator.md) | deferred | future | 2026-06-23 |
| [robustness-and-quality.md](./robustness-and-quality.md) | next | future | 2026-06-23 |
| [model-sdk-modernization.md](./model-sdk-modernization.md) | next | future | 2026-06-16 |
| [linkedin-profile.md](./linkedin-profile.md) | superseded | `add-linkedin-project-generation` | 2026-06-23 |

## Working order for the next branch

1. **experience-bank** — the new centerpiece: define the claim schema, normalize existing per-project
   bullets into the bank, tag/curate. Everything else renders over this.
2. **skills-migration** — build the `experience-bank` + `tailored-render` skills (decide skills-vs-API
   here); reframed around the bank, not a 1:1 port.
3. **robustness-and-quality** — fix what survives; delete what the skills replace (includes the
   2026-06-23 no-API reliability bugs).
4. **resume-generator** — a render target, once the bank + `tailored-render` exist.
5. **model-sdk-modernization** — only if an API path survives the skills decision (likely obsoleted).

**Superseded:** `linkedin-profile.md` — the one-off artifact shipped, but profile-as-product is
replaced by the bank + render model. Kept for history.

## Legacy to fold in

The existing `../future-ideas/` directory (`multi-agent-architecture.md`,
`voice-analysis-integration-plan.md`) predates this `specs/` layout. Migrate or retire those into
`specs/` in a future pass so there's a single home for plans.
