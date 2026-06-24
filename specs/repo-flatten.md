# Spec: Flatten the Single-Project Repo

- **Status:** done (on the `repo-flatten` branch)
- **Branch:** `repo-flatten`
- **Owner:** Jacob Williams
- **Last updated:** 2026-06-23

> **Done 2026-06-23:** moved everything from `project-experience-artifacts/` to the repo root and
> removed the directory; merged the project README into the root README; stripped the
> `project-experience-artifacts/` prefix from the 4 skills, AGENTS.md, and README; verified
> `bun install` / `type-check` / `buildBankIndex` at root. `.gitignore` unchanged (unanchored patterns
> still match).

## Summary

Collapse the monorepo layout into a single-project repo: move everything in
`project-experience-artifacts/` up to the repo root and remove the now-empty directory. The repo
*is* the career-artifacts project.

## Motivation

`prompts-and-tools` was intended as a monorepo of multiple tools, but only one project ever landed,
and there's no new tooling on the roadmap. The current shape is half-and-half — monorepo nesting +
a "collection of projects" root README, yet the four skills (all career-artifact-specific) live at
the repo root rather than inside the project. That inconsistency is the only thing worth fixing, and
flattening resolves it with the least indirection. (If a real second project ever appears, re-nesting
is cheap.)

## Design

Move up to the repo root, then `rmdir project-experience-artifacts`:

- dirs: `experience-bank/`, `specs/`, `lib/`, `tools/`, `datasources/`, `data/`,
  `voice-cache/`, `project-experience-summaries/`, `node_modules/`
- files: `getPosts.ts`, `htmlToMarkdown.ts`, `package.json`, `tsconfig.json`, `bun.lock`

**README collision:** root `README.md` (repo-overview) and the project `README.md` both exist. After
flattening the repo *is* the project, so keep the project README as the single root README and graft
in the "agent docs → AGENTS.md" pointer; drop the old "collection of projects" framing.

**Path rewrites (the risk area):** drop the `project-experience-artifacts/` prefix everywhere it
appears —

- the 4 skill `SKILL.md` files (e.g. `project-experience-artifacts/experience-bank/claims.yaml` →
  `experience-bank/claims.yaml`)
- `AGENTS.md` (paths + remove the `cd project-experience-artifacts` step from command blocks)
- the new root README

**`.gitignore`:** stays at root; its patterns are unanchored (`data`, `voice-cache/`, `node_modules`)
so they still match after the move. Verify after.

## Verification

1. `bun install`, `bun run type-check` (clean), `bun run buildBankIndex` (rebuilds index).
2. `grep -rn "project-experience-artifacts" .` returns nothing outside git history.
3. Skills still resolve their paths (spot-check one render path).

## Open questions

- Move `node_modules/` with everything, or delete it and `bun install` fresh at root? (Either works;
  a fresh install is cleaner.)
