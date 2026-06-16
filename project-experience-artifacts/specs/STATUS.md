# Specs Status — Active Tracker

The at-a-glance view of what's active, queued, and parked. Each row links to a spec in this
directory. Update the status/last-updated columns as work moves.

**Status legend:** `active` = being worked now · `next` = queued for the next branch · `deferred` =
designed but intentionally parked · `done` = shipped.

| Spec | Status | Target branch | Last updated |
| --- | --- | --- | --- |
| [linkedin-profile.md](./linkedin-profile.md) | done | `add-linkedin-project-generation` | 2026-06-16 |
| [skills-migration.md](./skills-migration.md) | next | future | 2026-06-16 |
| [model-sdk-modernization.md](./model-sdk-modernization.md) | next | future | 2026-06-16 |
| [robustness-and-quality.md](./robustness-and-quality.md) | next | future | 2026-06-16 |
| [resume-generator.md](./resume-generator.md) | deferred | future | 2026-06-16 |

## Working order for the next branch

1. **skills-migration** — decide skills-vs-API first; it changes the scope of everything below.
2. **model-sdk-modernization** — only if an API path survives the skills decision.
3. **robustness-and-quality** — fix what survives; delete what the skills replace.
4. **resume-generator** — build once the skills pattern is established.

## Legacy to fold in

The existing `../future-ideas/` directory (`multi-agent-architecture.md`,
`voice-analysis-integration-plan.md`) predates this `specs/` layout. Migrate or retire those into
`specs/` in a future pass so there's a single home for plans.
