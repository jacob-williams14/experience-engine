# Changelog

All notable changes to this repository are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). This project does
not use formal version numbers yet; changes are grouped by branch/date under `Unreleased` until a
versioning scheme is adopted.

## [Unreleased]

### Added

- LinkedIn profile artifact: `project-experience-artifacts/linkedin-experience/jacob-williams-linkedin-profile.md`
  (Headline variants, About section, refreshed Atomic Object Experience entry) — generated directly
  by Claude Code with no API usage.
- `project-experience-artifacts/specs/` — individual, trackable spec files: `linkedin-profile.md`,
  `skills-migration.md`, `resume-generator.md`, `model-sdk-modernization.md`,
  `robustness-and-quality.md`.
- `project-experience-artifacts/specs/STATUS.md` — active-status tracker indexing all specs.
- `CHANGELOG.md` (this file).

### Notes

- Audit of the repo identified the AI-SDK layer (`lib/ai.ts`, `lib/claude.ts`, `lib/aiConfig.ts`)
  as a generation behind and a candidate for removal once generators become Claude Code skills. See
  `specs/skills-migration.md` and `specs/model-sdk-modernization.md`.
- The committed career artifacts are treated as the quality baseline; regenerated artifacts are
  adopted only when clearly better.
