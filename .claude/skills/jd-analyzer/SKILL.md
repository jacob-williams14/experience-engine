---
name: jd-analyzer
description: >-
  Score a job description against Jacob's experience bank before applying: requirements split into
  must-have / nice-to-have, a match score backed by specific bank claims, honest gaps, and the claim
  set to hand to tailored-render. Use when Jacob pastes a job posting or asks "should I apply", "how
  do I match this role", "analyze this job". Run BEFORE tailored-render for a JD-tailored resume.
---

# JD Analyzer

Decides whether a role is worth tailoring for, and which bank claims to tailor with. The bank
(`~/Projects/brainspace/artifacts/contributions/claims.yaml`) is the **only** evidence of what Jacob
has done — never credit experience that isn't in a claim.

> Adapted from `job-description-analyzer` in
> [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills) (MIT), rewired to
> the bank. Paths root at `~/Projects/brainspace/` (override: `$BRAINSPACE_ROOT`).

## No API

You (Claude Code) are the model. Read the JD and the bank directly.

## Inputs

- The job description (pasted, or a URL Jacob gives you). For a URL, read it through the session's
  browser (built-in browser first, then Claude in Chrome — load the matching `anthropic-skills:*`
  browser skill), read-only. **LinkedIn job pages** render the description outside the page's
  main region, so `get_page_text` returns only the header: scroll the "About the job" heading into
  view, then pull the text with `javascript_tool` by walking up from that heading to the first
  ancestor whose `innerText` is longer than ~800 characters. If the page is a sign-in wall, ask
  Jacob to sign in himself (never type credentials) or to paste the text.
- `artifacts/contributions/claims.yaml` — **read it as text, not only parsed**: the section comments
  (`# ── …`) carry load-bearing caveats (e.g. "never 'product lead'", "client-reported", "co-built",
  "never claim … launched it") that a YAML parser drops.
- `foundation/about-jacob.md` — hard facts: degree and graduation year, and the **Career direction**
  section (the real steering signal). It names clients — never copy those names into output.
- `career/job-search.md` — current search state; often thin, so lean on about-jacob for direction.

### Claim fields to use

- Evidence text: `keyword_rich` (`plain_language` is often empty). Also `tech`, `themes`, `domain`.
- `scope` (IC → owned-feature → co-tech-lead → tech-lead; `cross-cutting` = working style): the
  highest held is tech-lead — no claim supports staff/principal-level scope.
- `strength` / `hook`: order the hand-off (featured and hook first).
- `context: personal`: supporting evidence only — never the sole match for a must-have.
- `snapshot:` (a date): an active engagement; say so, and carry that engagement's section caveats.
- `agent_assisted: true`: frame as work Jacob directed and reviewed.

## Steps

1. **Extract requirements**, in this order of precedence:
   1. **Section headings decide first.** Items under "Requirements", "What you'll bring",
      "Qualifications", "Must have" are must-haves; under "Nice to have", "Preferred", "Bonus" are
      nice-to-haves.
   2. **No headings:** use the language — "required", "must", "you have" → must-have; "preferred",
      "a plus", "ideally" → nice-to-have.
   3. **Repetition only reinforces.** A keyword repeated 3+ times goes in the mirror list; it never
      creates a new requirement or changes a weight.
   4. **Responsibilities** ("What you'll do") are not scored — report their coverage on one line.
   5. **Constraints** — location / on-site days, clearance, license, salary — pull out wherever they
      appear (often in the intro). Years of experience are scored as a must-have when they sit in
      the requirements list; list them under Constraints only when they don't. Salary is reported,
      never judged (the KB holds no target).
2. **Match each requirement to evidence.** Score each **1** (a claim clearly covers it), **0.5**
   (partial — say what's missing), or **0** (unmet). "X or Y" counts if either is covered; "X and Y"
   scores 0.5 if only one half is covered.
   - **Year thresholds** are the one place hard facts count *for* a requirement. Tenure = years since
     the 2022 graduation, rounded **down** to the half year (conservative). For a skill-specific
     duration ("2+ years of React Native"), claims prove the skill and the date ranges give the
     duration — dates live in claim text and in the section comments (`# ── … (Jan 2026 – ongoing)`).
     Score 1 if met, 0.5 if within 15% of the threshold, else 0. Below 75% of a total-years
     threshold is a dealbreaker.
3. **Score.** All requirements weigh equally. Match = must-have % × 0.7 + nice-to-have % × 0.3.
   When the JD lists **no nice-to-haves**, the match is the must-have % alone (don't score an empty
   list as 0 or 100); write the Score line as `0.7 × NN% + 0.3 × (none) = NN%`.
   Show counts as summed points (`4.5/6`). Pick the band from the unrounded match; display it
   rounded to a whole percent.
4. **Recommend.** Any **dealbreaker** → **skip**, whatever the score. Otherwise:

   | Match | Band | Recommendation |
   | --- | --- | --- |
   | 90%+ | possible under-leveling | apply — check the level |
   | 75–89% | strong fit | apply |
   | 60–74% | good fit | apply — lead with gap framing |
   | 50–59% | stretch | stretch |
   | under 50% | likely skip | skip |

   Weigh against the Career direction in about-jacob — say in one clause if it changes the call.
5. **Gaps, honestly.**
   - **Dealbreaker**: a hard constraint Jacob can't meet (years below 75% of the threshold, license,
     clearance). If the role is on-site, hybrid, or region-restricted and Jacob's location or
     willingness isn't stated, **ask before scoring** and wait — don't infer it. Fully remote roles
     need no question.
   - **Real gap**: name it; frame it truthfully (adjacent claim, or current learning only if a claim
     or Jacob says so). Never phrasing that implies experience the bank doesn't hold.
   - **Minor gap**: learnable, or covered by a transferable claim.
6. **Signals.** Red flags (no salary range, "rockstar", "wear many hats", unclear scope), positives
   (clear scope, named stack, stated range), and what to research. Don't research unless asked.
7. **Hand-off** (skip it when the recommendation is skip, unless Jacob asks): 6–10 claim ids in lead
   order, the JD terms to mirror (only where a claim supports them), the JD terms **not** to mirror
   (no claim), and the caveats those claims carry.

## Output

Any question for Jacob comes first, on its own. Then the block below — one line per requirement,
no other prose (the direction clause goes in Signals):

```text
<Role> · <Company> · Match NN% (<band>) · <recommendation>

Constraints   location/on-site · years · other — met / unmet / ask Jacob
Must-haves    X/N
  - <requirement> → <claim ids> | partial: <claim ids> — <what's missing> | unmet
Nice-to-haves X/N
  - (same)
Score         0.7 × NN% + 0.3 × NN% = NN%
Duties        <one line: how well responsibilities are covered, key claim ids>
Gaps          dealbreaker / real / minor — one line each, with truthful framing
Signals       red flags · positives · to research · direction fit (one clause)
Hand-off      <ordered claim ids>
  Mirror      <JD terms backed by claims>
  Don't mirror <JD terms with no claim>
  Caveats     <section caveats the hand-off claims carry>
```

When the JD lists no responsibilities, write `Duties none listed`. When the recommendation is skip,
write `Hand-off skipped (recommendation is skip)` and drop its sub-lines. Snapshot claims are noted in
`Caveats`. Save only if Jacob asks.

## Next: tailored-render

Pass the hand-off to `tailored-render` as its **selected claims** (its step 2) — use the ordered ids
instead of re-matching the JD, apply the mirror / don't-mirror lists, and keep every caveat.

## Rules

- **No invented experience or metrics.** Every "you have" points to a claim id. If the bank is
  missing something Jacob says he did, add it through the `experience-bank` skill first — don't
  score on it here.
- **Confidentiality.** No client names in output: not from `project:` codenames, and not
  from about-jacob.md, which names clients. Use `domain`.
