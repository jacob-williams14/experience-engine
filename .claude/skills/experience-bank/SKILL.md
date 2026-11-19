---
name: experience-bank
description: >-
  Maintain Jacob's experience bank — the tagged claim store at
  artifacts/contributions/claims.yaml in the knowledge base. Use when adding, updating, tagging, or
  curating experience claims, when pulling new claims from the generated project summaries, or when
  enriching the non-technical side from the worklog. Triggers on "add a claim", "update the bank",
  "pull from the summaries", "enrich the bank from the worklog", "re-tag", "rebuild the bank index".
---

# Experience Bank

The bank (`~/Projects/brainspace/artifacts/contributions/claims.yaml`) is the source of truth for
Jacob's project experience. Documents (LinkedIn, resume, JD-tailored sets) are RENDERS over it — see
the `tailored-render` skill. This skill is for keeping the bank populated and accurate.

> **Paths.** The bank and its inputs live in the knowledge base, rooted at `~/Projects/brainspace/`
> (override with `$BRAINSPACE_ROOT`): summaries in `artifacts/project-summaries/`, the bank in
> `artifacts/contributions/`. Bare `claims.yaml` references below mean that file.

## The pipeline (don't skip a layer)

```text
data/ (git logs in git-logs/, CSVs in backlogs/)
  → project-summary skill                    →  artifacts/project-summaries/*   (generated)
      → EXTRACT (this skill)                 →  artifacts/contributions/claims.yaml   (the bank)
          → RENDER (tailored-render skill)   →  LinkedIn / resume / JD
```

Claims are pulled FROM `~/Projects/brainspace/artifacts/project-summaries/*`, the generated upstream
layer — not invented and not mined from raw logs directly. If a summary is missing or stale,
regenerate it first with the project-summary skill, then extract.

## No API

Generation is done by Claude Code directly (you are the model). Do not call the AI-SDK layer or any
API. Extraction = you reading a summary and writing claims.

## Claim schema

Each claim in `claims.yaml`:

```yaml
- id: <domain-prefix>-<short-slug>     # stable, unique
  type: technical | non-technical       # technical = mined from project data; non-technical = the "why"
  context: professional | personal      # professional = Atomic/client work; personal = side projects
  project: <internal-codename>          # NOT for output
  refs: [<ticket / PR ids>]             # internal join key to backlog work and session logs — NOT for output
  domain: <public-safe domain string>   # USE THIS in renders, never the client name
  themes: [<one to three from the theme list below>]
  tech: [named technologies from the source only]   # usually [] for non-technical claims
  scope: IC | owned-feature | co-tech-lead | tech-lead | cross-cutting   # cross-cutting = working style
  strength: featured | solid | filler   # proposed default; Jacob adjusts at render time
  hook: true | false                    # a "I need to talk to this person" problem
  keyword_rich: >-                       # recruiter-facing, anonymized
    ...
  plain_language: >-                     # plain-English; "" if not yet written (fill for featured/hook)
    ...
  source: <worklog-filename>            # any worklog-sourced claim — the entry it came from (dedup key)
  agent_assisted: true | false          # set true if it came from an AI-assisted session log
  verified: <YYYY-MM-DD>                # Jacob checked this wording against its source at a render — absent = unchecked
  correction: <one line>                # what Jacob corrected, e.g. "co-built with a teammate, not sole" — binding
  snapshot: <YYYY-MM-DD>                # claim describes an engagement still under way, as of this date
```

> The schema comment at the top of `claims.yaml` lists only the first three `scope` values and
> no `snapshot`. Leave that header alone in an enrichment run: the PR sorter rejects any change to
> the unindented header, so it is fixed only in a PR Jacob merges.

**`snapshot`** marks claims about an engagement that is still running. The section comment above
them says when to refresh them (when the summary is regenerated near the engagement's end).
Renders and `jd-analyzer` say the work is ongoing; don't add `snapshot` to finished work.

**Section comments are part of the bank.** The `# ── …` comment that opens a group of claims
carries caveats a YAML parser drops ("co-built", "never 'tech lead'", "client-reported"). Read
them before you extend a claim under them; they bind like a `correction`. Never write a client
name into one: the sorter lets comments through, so nothing downstream would catch it.

### Themes

`themes` is a closed list — one to three per claim, the narrowest that fit. Renders filter on it,
so a theme carried by half the bank selects nothing.

| Theme | Use it for |
| --- | --- |
| `technical leadership` | leading a team or a technical direction: setting the approach, owning calls, running reviews |
| `system design` | architecture, data modeling, integration contracts, cross-cutting patterns — **not** an ordinary feature build |
| `feature delivery` | building and shipping a user-facing feature end to end |
| `reliability` | correctness, stability, hard defects, upgrades and migrations kept safe |
| `testing` | test infrastructure, test strategy, QA process |
| `devops/CI` | builds, pipelines, releases, environments |
| `security` | auth and access design, supply-chain hardening, sandboxing, secrets, backups |
| `AI-assisted delivery` | designing, running or measuring agent-assisted development: specs, review, sandboxes, pipelines |
| `mentoring` | growing another person: onboarding, pairing, coaching, feedback |
| `client partnership` | working with client stakeholders: bridging, shaping the account, giving them the evidence to decide |
| `product judgment` | defining or correcting what gets built: scoping, premise checks, feature definition |
| `cross-domain adaptability` | ramping on an unfamiliar domain, platform or discipline |
| `growth` | Jacob's own growth in scope or skill |
| `i18n` | internationalization and localization |

Add a theme only with Jacob's ok, and add it to this table and to the header comment of
`claims.yaml` in the same change.

**`refs`** holds the ticket keys (`PRO-3008`) and PRs (`<repo>#<number>`) a claim's work was
tracked under. It is the join key between a claim, the backlog rows it came from, and the session
logs that carry the same ids in their `tickets:` frontmatter. Fill it whenever the source names
them; leave it off when the work was untracked. Like `project`, it never appears in a render.

**`verified` and `correction`** are how an overstated claim gets caught and stays fixed.
`verified` is set only by the `tailored-render` skill, when Jacob accepts a render that used the
claim after seeing its evidence. Nothing else sets it: not extraction, not enrichment, not the
enrich-bank routine. If you change a verified claim's wording, scope or numbers, remove its
`verified` date — the new wording has not been checked. `correction` records a fix Jacob made;
it outranks the source. When a log or summary says more than a correction allows, the correction
wins, and no later run may widen the claim back.

**`type`** is a first-class split, surfaced as top-level groups in the index. It's orthogonal to
`source` (where the claim came from) and `agent_assisted` (whether an AI agent was involved):

- **`technical`** — *what was built*. Usually extracted from the project summaries (git logs /
  backlogs), with full `domain` / `tech` / `themes` detail. Can **also** come from a `/log-work`
  session log (the lightweight path for side/client projects that never get a summary) — tagged with
  its `source` so the two paths stay distinguishable.
- **`non-technical`** — decisions, mentoring, process, leadership — the "why" git can't show. Captured
  forward from the worklog (weekly summaries + `/log-work` session logs); `tech` is usually empty.

## Rules (non-negotiable)

- **Confidentiality:** never write a client or product name into the bank. Only "Atomic Object" may
  appear. Describe clients by DOMAIN (e.g. "a statewide court system", "a national coffee chain").
  Reuse a `domain` string already in `claims.yaml` when one fits; add a new one only for a new
  client. The internal fields (`project`, `refs`, `source`, `meta.worklog_folded`) may carry
  codenames; every other field and every comment may not. Paraphrase is the risk: a product's
  name, a client's city, a named system, or a client-named repo in a `refs` entry identifies the
  client as surely as its name.
- **No people's names** other than Jacob's — not teammates, not client staff — in any field,
  including `correction` ("co-built with a teammate", never the teammate's name). Session logs and
  summaries name people; the bank doesn't.
- **Trace to source:** every `tech` tag and any number/metric must come from the claim's source —
  the project summary, or the worklog entry in `source`. Never invent (this is the drift the old
  synthesizer caused — see specs/render-rules-reference.md).
- **No duplicates:** before adding, scan existing claim ids/topics for the project so you extend
  rather than repeat.
- **`themes` holds themes only** — never put a `scope` value (IC/owned-feature/co-tech-lead) in it.

## Need a summary first?

If `~/Projects/brainspace/artifacts/project-summaries/<project>-project-summary.md` doesn't exist
yet, generate it with the **`project-summary`** skill (data → summary), then extract claims from it
below.

## Adding claims from a summary

1. Read the relevant
   `~/Projects/brainspace/artifacts/project-summaries/<project>-project-summary.md` fully.
2. List the project's existing claims in `claims.yaml` so you don't duplicate.
3. Extract genuinely distinct accomplishments as claim blocks (schema above), anonymized. Claims
   pulled from a project summary are `type: technical`. Set `refs` to the ticket / PR ids the
   summary cites for that work. Summaries are **not** anonymized — they name the client and
   teammates — so everything you lift from one passes the confidentiality rules below.
4. Append them under the right domain section of `claims.yaml`.
5. Rebuild the index: `bun run buildBankIndex`.

## Enrich from the worklog (technical + non-technical)

This is the **forward-capture path** for the bank — the "why" git can't show (decisions, mentoring,
process, leadership = `non-technical`) **and** the technical work from `/log-work` session logs that
may never get a full project summary (= `technical`, e.g. side/client projects). Triggered by "enrich
the bank from the worklog" and by the weekly review. Source: `~/Projects/brainspace/career/atomic/worklog/`.

1. **Scope the input.** Consider only genuine work reflections: weekly summaries (`*-summary.md`) and
   session logs (`type: session-log`, named `YYYY-MM-DD-HHMM-<slug>.md`). **Skip** agent handoff
   entries (frontmatter `type: handoff`) and `README.md` — process chatter, not career material.
2. **Skip what's already ingested.** Collect the `source:` values of **all** existing claims. Skip any
   worklog entry whose filename already appears as a `source:` or under `meta.worklog_folded`. This is the real idempotency guard — it
   survives backfilled/out-of-order entries. (`meta.worklog_enriched_through` is just a cursor for
   where you left off; don't rely on it to dedup.)
3. **Cross-reference before extracting.** Session logs written since 2026-11-16 carry `tickets:`
   and `tech:` frontmatter (older ones carry `tags:` and name tickets only in prose — read those
   for ids instead).
   - **The claim carries a `correction`** → read it first and stay inside it, whatever the
     log says.
   - **A ticket matches an existing claim's `refs`** → that work already has a claim. Don't add a
     second one: extend the existing claim with what only the log knows (the decision and why, a
     figure from `Results / numbers`), and add any new ids to its `refs`. Leave its `source`
     alone; record the log as handled by listing its filename under `meta.worklog_folded`.
   - **A ticket matches nothing, or `tickets:` is empty** → the log is the only record of that
     work. Extract from it as a standalone source, and copy its `tickets` into the claim's `refs`.
   - Take `tech` for a new claim from the log's `tech:` field, checked against the body. A number
     enters a claim only from the log's `Results / numbers` section (or a stated measurement in
     an older log), carrying its caveat; a log that says `None this session.` contributes none.
4. **Extract** claims from each remaining entry — **`type: technical`** (what was built) and/or
   **`type: non-technical`** (a decision and why, who was mentored/unblocked, a process/leadership
   move). On every extracted claim set `source:` to the worklog filename, carry `agent_assisted: true`
   if the entry's frontmatter says so, and set `context:` (`personal` for side projects, else
   `professional`). **Frame agent-assisted work at Jacob's
   altitude** — what he directed, decided, reviewed, integrated — never "I built X" when an agent did
   most of it. Anonymize per the confidentiality rules below and honor the worklog's NDA note. **Never
   invent** — if an entry is still a template/placeholder (unfilled `⟵ add …` prompts, no real content
   yet), treat it as **not yet written**: extract nothing, and in step 6 do **not** advance the
   watermark past it (it's pending Jacob's fill-in). The `source:` guard re-surfaces it once it has
   content.
5. **Get sign-off on the batch, not each claim.** Summarize the run in chat — how many claims
   added and extended, per project, and call out only the ones that need a human call: a number
   with a caveat, an attribution you couldn't settle, anything touching confidentiality. Jacob
   approves the batch (or redirects it); he does not review claim by claim (decided 2026-11-16).
   Nothing is written without that ok, and the diff of `claims.yaml` is the detailed record.
6. **Write** the approved claims under the right domain (or a `working style / approach` style domain
   for cross-cutting ones), then advance `meta.worklog_enriched_through` to the latest date you
   **completed** — i.e. the newest entry you either extracted from or confirmed is genuinely
   complete-but-uneventful. Do **not** advance it over a still-unwritten template (see step 4). Then
   rebuild the index (`bun run buildBankIndex`). The watermark is advisory; the per-claim `source:` is
   the real dedup guard, so a thin entry left behind the watermark is still revisited correctly.

> The companion `/log-work` capture skill (a separate Claude Code skill, not in this repo) writes the
> session logs this consumes. If the worklog is thin, that's expected — this path fills forward.

## Curating

Jacob curates conversationally, not by editing YAML. When he says "bump X to featured", "that's not a
hook", "add a claim about Y", make the edit in `claims.yaml` and rebuild the index. Strength/hook are
only filters for renders, so they don't need to be perfect up front.

When he says a claim overstates something, rewrite the claim to what he says is true, add a
one-line `correction`, and set `verified` to today. Fix it here, never only in a render.

## Scope: professional + personal

The bank holds both **professional** experience (Atomic Object / client work — the bulk; Jacob has no
pre-Atomic employer) and **personal / side-project** experience. Every claim carries
`context: professional | personal` so renders can keep the two honest and distinct — never present a
side project as paid client delivery. Professional is the default; set `context: personal` for
side-project claims (these come forward via `/log-work` session logs).
