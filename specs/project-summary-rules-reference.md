# Reference: Project Summary Rules (preserved from `analyzeProject.ts`)

Preserved IP from the retired `scripts/analyzeProject.ts`. This is the framework that produces the
large, detailed `project-experience-summaries/*.md` artifacts. The `experience-bank` skill follows
this when generating a summary for a new project (no API — Claude Code is the model). The deterministic
parsers `tools/extractGitData.ts` and `tools/processBacklog.ts` still prepare the raw input.

## Input

Either git-log data or a project backlog (CSV), parsed by the tools above. Focus exclusively on the
named developer's work; capture the full timeline of their involvement.

## Analysis framework — extract specific evidence for each (A–D)

Use the commit messages / task descriptions as the primary source of technical detail. Do not
generalize where specifics exist.

- **A. Technical Architecture & Infrastructure** — dev environment, CI/CD, build systems, deployment
  automation, code-quality tooling, security.
- **B. Feature Development & Engineering** — core functionality, UI/UX, API integration & data,
  performance/scalability, full-stack/cross-platform work.
- **C. Technical Leadership & Problem-Solving** — system design decisions, complex problem resolution,
  code review & mentoring, technical-debt/refactoring, innovation.
- **D. Project Management & Collaboration** — planning & task breakdown, bug triage, cross-functional
  collaboration, documentation/knowledge sharing, QA & testing.

## Writing guidelines

- **Technical depth:** include specific technology names/frameworks/tools from the evidence; describe
  architectural decisions and rationale; extract the complete stack, not generalized categories.
- **Professional tone:** third person, action-oriented, outcome-focused; sophisticated but digestible;
  let the work speak — no assumptions about career level.
- **Formatting:** clear hierarchy; 4+ bullets per subsection; bold key technologies; `**[Title]**
  [description]` bullet format; bold technical terms consistently.
- **CRITICAL:** every summary must match the structure below EXACTLY and stay consistent with the
  existing summaries — same headings, same section order, no deviation.

## Required document structure (follow EXACTLY)

```markdown
# [Project] Project Summary

**Developer:** [name]
**Project Duration:** [duration or inferred date range]
**Role:** [inferred from commit patterns and contributions]
**Technology Stack:** [ALL specific technologies/frameworks/databases/tools from the evidence]

## Project Overview

[2-3 paragraphs: project description emphasizing the developer's contributions; tech stack and
architectural approach; their role and areas of ownership; scope, complexity, business impact; key
technical challenges.]

## Technical Architecture & Infrastructure

### **[Infrastructure Area]**
[Description paragraph.]
- **[Implementation]** [detailed, specific description]
  (4+ bullets per subsection; add further infrastructure areas as the evidence supports.)

## Feature Development & Engineering

### **[Major Feature Area]**
[Description paragraph.]
- **[Feature implementation]** [detailed technical description]
  (Multiple feature areas, 4+ bullets each.)

## Technical Leadership & Problem-Solving

### **[Leadership Area]** / **[Collaboration Area]** / **[Innovation Area]**
[Description paragraphs + bullets covering decisions, architecture, problem-solving, mentoring,
knowledge sharing, innovation.]

## Quality Assurance & Process Improvements

### **[Testing Area]** / **[Code Quality Area]** / **[Process Area]**
[Testing infrastructure, automation, QA processes, CI/CD, error handling, technical-debt management.]

## Skills Demonstrated

### **Technical Skills**
- **[Category]:** [specific skills and technologies]   (5+ categories)

### **Tools & Technologies**
- **[Category]:** [specific tools/frameworks]

### **Professional Skills**
- **[Category]:** [demonstrated capability]

## Project Impact

### **Technical Achievements**
- **[Achievement]** [accomplishment and impact]

### **Business Value Delivered**
- **[Impact]** [business/operational/UX/platform value]

### **Team & Process Contributions**
- **[Contribution]** [process / knowledge sharing / leadership / quality]

[Final 3-4 sentence paragraph summarizing overall impact, technical growth, and contributions.]
```

## Quality checklist

- [ ] Comprehensive enough to understand the developer's full contribution
- [ ] Technical details accurate, specific, extracted from evidence (not invented)
- [ ] Professional achievements clearly highlighted with supporting evidence
- [ ] Structured to feed downstream artifacts (the experience bank, renders)
- [ ] All major technical areas covered; skills section covers technical + leadership
- [ ] Document structure EXACTLY matches the template and prior summaries
- [ ] All sections/subsections present in the correct order; no placeholder text
