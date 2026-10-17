---
name: linkedin-review
description: >-
  Review Jacob's LIVE LinkedIn profile against the experience bank and resume — headline, About,
  Experience, Skills — reading it through whichever browser the session has (the desktop app's
  built-in browser or Claude in Chrome), then proposing numbered, paste-ready fixes he applies
  himself. Use when asked to review/optimize/update LinkedIn
  or sync LinkedIn with the resume. Triggers on "review my LinkedIn", "optimize my LinkedIn", "sync
  LinkedIn with my resume", "is my LinkedIn up to date".
---

# LinkedIn Review

Reads the live profile, audits it against the bank and resume, and proposes fixes. **Read-only on
LinkedIn**: Jacob pastes every change himself — LinkedIn's User Agreement prohibits automated
activity, and profile edits are public.

> Adapted from `linkedin-profile-optimizer` in
> [Paramchoudhary/ResumeSkills](https://github.com/Paramchoudhary/ResumeSkills) (MIT), rewired to
> the bank and the live profile. KB paths root at `~/Projects/brainspace/` (override:
> `$BRAINSPACE_ROOT`); repo paths root at `~/Projects/experience-engine/`.

## No API

You (Claude Code) are the model. Read the profile and the bank directly.

## Inputs

- **The live profile**, through the first source available, in this order:
  1. **Built-in browser** (`mcp__Claude_Browser__*` or `mcp__remote-devices__Claude_Browser__*`) —
     the desktop app's pane; load the `anthropic-skills:built-in-browser` skill and follow it.
  2. **Claude in Chrome** (`mcp__claude-in-chrome__*`; CLI: `claude --chrome`) — load the
     `anthropic-skills:chrome-browser` skill and follow it.

  Check with ToolSearch which browser tools exist; don't use other browser automation (e.g.
  agent-browser) — LinkedIn sign-in happens only in a browser Jacob can see. If neither browser is
  available, say so and stop; there is no file-based fallback.
- `artifacts/linkedin/paste-list-*.md` — earlier approved paste lists; the newest says what changed
  last time and is the only baseline kept (no profile snapshots).
- `artifacts/contributions/claims.yaml` — read as text: section comments (`# ── …`) carry caveats
  (e.g. "client-reported, cite as such", "never 'product lead'", "co-built") a parser drops. It's
  long: grep the `# ──` headers first, then read the relevant blocks — the newest caveats sit in the
  later "additional claims" sections.
- `artifacts/resume/jacob-williams-resume.pdf` — the current resume (Jacob edits it by hand; read
  the PDF with the Read tool). Titles, dates, and metrics must agree with it.
- `foundation/about-jacob.md` **Career direction** — target direction for keywords. It names
  clients; never copy those names. It is **not** authoritative for facts — the bank and resume are.
- `voice-cache/jacob-williams-voice.json` (repo) — apply lightly: it's a blog voice.

## Steps

1. **Open the profile** with the first available source (see Inputs). Say which one you're using.
   - **Browser:** open `https://www.linkedin.com/in/me/` in a new tab (it redirects to Jacob's
     profile) — built-in browser: `preview_start` with the URL; Chrome: `tabs_context_mcp`, then
     `tabs_create_mcp` and `navigate`.
   - **Not signed in** (sign-in page or wall): make sure Jacob can see the browser (built-in: check
     `tabs_context`; the pane may be hidden), then ask him to sign in himself — never type
     credentials. Wait, then continue.
   - **Site permission pending or refused**, or the browser doesn't respond: tell Jacob, then wait
     or drop to the next browser.
2. **Read, read-only**. `get_page_text` (or `read_page`) on the profile, then on
   `…/details/experience/` and `…/details/skills/` (the main page truncates both). Only these
   pages; no clicks on Edit, Connect, Message, or posts; no repeated reloads. Close tabs you opened.
3. **Consistency audit.** Check every number, title, date, domain list, and client description. A
   **finding** is any of:
   - a value that differs from the bank or the resume;
   - a figure with no source (e.g. a store count the bank never states) — propose removing it;
   - a figure missing its provenance qualifier (e.g. client-reported metrics stated as fact);
   - something stale: engagements, domain counts, years, or the current role;
   - wording that identifies a client (names a client, a specific state agency, a product).

   **When the bank and the resume disagree**, don't pick: mark it `needs Jacob` and show both values.
   Wording-only differences ("~$500K/week" vs "$500K+ weekly") aren't disagreements — use the bank's
   wording. A finding can be **split**: a `Fix:` for the part both support and a `needs Jacob:` line
   for the rest. The bank holds no titles or dates, so the resume decides those; anything neither
   holds (e.g. a start month) is `needs Jacob`.
4. **Proposed changes** — paste-ready text within LinkedIn's limits:
   - **Headline** (220 chars): keep Jacob's positioning; note keyword trade-offs.
   - **About** (2,600 max; the first ~300 show before "see more"): targeted edits following the
     confidentiality and no-invention rules in `specs/render-rules-reference.md`. A full rewrite
     only if Jacob asks.
   - **Experience**: one Atomic Object role, engagements beneath it. For missing or stale
     engagements, map the strongest claims (featured/hook first) and offer to render them with
     `tailored-render`.
   - **Skills** (up to 50; top 3 featured): rank by relevance to Career direction, then roughly by
     how many claims carry the tag. Soft skills count when a claim's `themes` or text supports them.
     Resume skills with no claim are **bank gaps**, not skills to add.
5. **Profile checklist** — from what the page showed: photo, banner, Featured, recommendations,
   Open to Work. Mark each present / missing / couldn't tell.

## Output

In chat (Jacob may not have watched the browser pane — say what you read):

```text
Read     <pages read> · last paste list: <date | none>
Audit (most severe first)
  1. [section] <finding> — live: "<text>" | bank: <value> (<claim id>) | resume: <value>
     Fix: "<paste-ready text>"  — or —  needs Jacob: <the decision>
  2. …
Proposed changes
  Headline · About · Experience · Skills — numbered, continuing the audit numbering, paste-ready
Checklist   photo · banner · Featured · recommendations · Open to Work — present / missing / ?
Approve by number (e.g. "1, 2, 5"); give decisions with needs-Jacob items (e.g. "2=600K").
```

## After approval

Hand back the approved items as one paste list, grouped by section, in the order LinkedIn's editor
shows them. A `needs Jacob` item without its decision isn't included — say so. Save it to
`artifacts/linkedin/paste-list-<YYYY-MM-DD>.md` once Jacob approves — it's the record of what
changed and the baseline for the next review. Don't edit LinkedIn. When Jacob says he's updated it,
re-read (step 2) and confirm each item landed. Facts Jacob settles along the way belong in the bank — point to the `experience-bank` skill.

## Rules

- **Read-only on LinkedIn.** Never edit, post, message, connect, or change settings; never sign
  out or touch credentials.
- **Bank and resume are the truth.** No metric, title, or claim that isn't in one of them; where
  they disagree, Jacob decides.
- **No client names** in paste-ready text; describe clients by domain. "Atomic Object" is the only
  named company.
- **Voice over formula.** Generic LinkedIn advice (keyword density, posting cadence) is secondary
  to sounding like Jacob.
