# Reference: Render Rules (preserved from `createSynthesisPrompt`)

Preserved IP from the retired `scripts/generateAtomicExperience.ts:createSynthesisPrompt`. These are
the phrasing rules a render applies when turning bank claims into a target document. They move to the
`tailored-render` skill (see [skills-migration.md](./skills-migration.md) and
[experience-bank.md](./experience-bank.md)). The synthesizer itself was deleted because its *premise*
(compress everything into 4 themed bullets) was wrong; its *rules* are still good.

## Structure (for a LinkedIn Experience render)

1. A 1-2 sentence summary with personality — who they are and what drives them, not a restatement of
   the bullets. Show attitude, not a domain list.
2. 4 bullets organized by THEME, not by project (technical leadership, cross-domain adaptability,
   system design, growth). Force-cut to the strongest 4.

## Brevity (non-negotiable)

- Each bullet is ONE concise sentence. No compound sentences joined by em-dashes, semicolons, or "and."
- No lists within a bullet. ONE specific example beats three generic ones.
- A comma-separated list of more than two items (in the sentence) is too long — cut it.
- LinkedIn is scanned in 5 seconds. Dense, punchy, specific.

## Keywords (required, reproducible)

- End every bullet with a parenthetical tech-stack tag of the concrete technologies from that claim,
  e.g. "(React Native, Expo, Stripe)".
- Pull ONLY from the claim's `tech` tags / source — never invent a technology.
- 2-5 most recruiter-relevant terms; prefer named frameworks/languages/services over generic words.
- The tag sits outside the one-sentence prose and doesn't count against brevity.

## Balance professional vocabulary with human voice

- Keep recruiter-searchable terms (React Native, CI/CD, API design, system design, technical lead,
  full-stack) — they're keywords.
- Frame work as PROBLEMS SOLVED and OUTCOMES, not feature lists or implementation detail.
- Lead with what was HARD or UNUSUAL, then the outcome. Make the STAKES clear — who benefits, what
  was at risk.

## Lenses

**Role lens** (pick by target):

- `senior-engineer` — technical depth and independent delivery across domains.
- `staff-engineer` — architectural thinking, cross-project patterns, technical influence.
- `principal-engineer` — technical vision, shaping engineering direction across the org.
- `eng-manager` — team leadership, delivery outcomes, growing engineers.
- `tech-lead` — both hands-on technical work and leadership growth.
- `full-stack` — breadth across the stack and rapid context switching.

**Company lens** (pick by target):

- `big-tech` — scale, system design, technical rigor.
- `startup` — speed, ownership, wearing multiple hats.
- `enterprise` — reliability, integration complexity, business value.
- `mid-startup` — scaling systems and engineering maturity.
- `general` — balance technical depth with business impact and adaptability.

## What makes a render compelling

- The consultancy breadth IS the differentiator — make it central.
- Show fast ramp-up in unfamiliar domains and delivery.
- Surface the IC → tech-lead growth as a story.
- Name actual domains (healthcare, courts, education, retail) — specificity beats "diverse industries".
- At least one HOOK — a specific, hard problem that makes a recruiter want to talk.
- Signal scale/impact in plain language, only where source supports it.
- No generic collaboration bullets unless the outcome was specific and unusual.

## Client confidentiality

- Never name specific clients, companies, or products. Only "Atomic Object" appears.
- Describe by DOMAIN and WORK, not client name (e.g. "a state judicial information system", not the
  product name). The bank already stores claims this way; render re-checks.

## What to avoid

- Listing projects sequentially (a render is a synthesis, not a list).
- Repeating action-verb patterns across bullets.
- Generic consultancy language ("delivered solutions for diverse clients").
- Inventing metrics, numbers, or narrative not in the source.
- Any commentary, notes, or disclaimers in the output.

## Voice

Apply the author's voice signature (`voice-cache/<author>-voice.json`) as an override on top of the
above — it should sound like the person, not corporate LinkedIn copy. Shorter, conversational
sentences are fine.
