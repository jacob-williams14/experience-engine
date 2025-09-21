# Professional Biography Generation Prompt

## Parameters
Define these parameters once at the beginning for easy reference throughout your prompt:

```
DEVELOPER_NAME: [Enter developer's full name, e.g., "Jacob Williams"]
EXPERIENCE_LEVEL: [Enter current level, e.g., "Mid-level Developer transitioning to Technical Leadership"]
CAREER_ASPIRATIONS: [Enter goals, e.g., "Technical Leadership, Team Management, Architectural Decision-Making"]

OPTIONAL_OUTPUT_DIRECTORY:
[Enter custom output directory if desired, e.g., "professional-bios" or "employee-profiles"]

PERSONAL_DESCRIPTION: 
[Enter 2-3 sentences about professional identity/passion, or leave blank]

PROJECT_SUMMARIES:
[List project summary files, e.g.:
- Leading Change Project (`project-experience-summaries/leading_change_analysis.md`)
- RORE Project (`project-experience-summaries/rore_analysis.md`)
- Biggby Mobile App (`project-experience-summaries/biggby_analysis.md`)]

OPTIONAL_STRENGTHS:
[Enter StrengthsFinder themes or other strengths, or leave blank]
```

## Objective
Analyze the provided project experience summaries and create a concise, compelling professional biography for an Atomic Object employee profile that showcases technical competence, leadership capabilities, and professional growth.

## Context
- **Subject**: [DEVELOPER_NAME] - Software Developer and Technical Professional
- **Purpose**: Create employee profile biography for potential clients, business executives, tech recruiters, and industry leaders
- **Output Location**: `[OPTIONAL_OUTPUT_DIRECTORY]` (defaults to `professional-bios/` if not specified)
- **File Format**: Markdown (.md) preferred for readability and structure
- **Audience**: Both technical and non-technical readers
- **Length**: 300-500 words maximum
- **Style**: Professional but approachable, results-oriented

## Analysis Instructions

### 1. Project Summary Synthesis
- **Review Scope**: Analyze all provided project experience summaries comprehensively
- **Pattern Identification**: Extract common themes, growth patterns, and recurring strengths across projects
- **Timeline Understanding**: Identify career progression and increasing responsibility over time

### 2. Biography Construction Framework

#### A. Professional Identity & Expertise
- Core technical competencies and areas of specialization
- Unique value proposition and what sets them apart
- Professional passion and approach to work
- Industry domain knowledge and experience

#### B. Technical Leadership & Problem-Solving
- Evidence of technical leadership emergence and growth
- Complex problem-solving approach and innovation examples
- Architectural thinking and system design capabilities
- Mentoring and knowledge transfer activities

#### C. Collaboration & Business Impact
- Cross-functional partnership and stakeholder management
- Client-focused approach and business value delivery
- Team building and collaborative leadership style
- Communication excellence and relationship building

#### D. Professional Growth & Future Potential
- Learning agility and adaptability across technologies and domains
- Career trajectory and progression toward leadership roles
- Continuous improvement mindset and growth orientation
- Alignment with Atomic Object values and consulting excellence

### 3. Writing Guidelines

#### Content Approach
- **Synthesize, Don't List**: Identify patterns across projects rather than describing each individually
- **Show Progression**: Demonstrate career growth and increasing technical responsibility
- **Balance Technical & Leadership**: Equal emphasis on technical competence and collaborative abilities
- **Broad Technical Terms**: Use "full-stack development," "system architecture," "mobile applications" rather than specific frameworks
- **Business Value Focus**: Emphasize project success, client satisfaction, and problem-solving for business challenges

#### Writing Style
- **Professional Tone**: Confident, authentic, results-oriented without being boastful
- **Accessible Language**: Clear to both technical and non-technical readers
- **Active Voice**: Use action-oriented language emphasizing impact and contributions
- **Concise Structure**: 3-4 focused paragraphs, each with clear purpose
- **Avoid Jargon**: Minimize industry-specific terms that might confuse non-technical readers

## Output Requirements

### Biography Structure
1. **Opening Paragraph**: Professional identity, core expertise, and distinctive value proposition
2. **Technical Leadership**: Project impact, problem-solving approach, and leadership emergence evidence
3. **Collaboration & Impact**: Cross-functional work, stakeholder management, and team development
4. **Future Focus**: Professional growth trajectory, aspirations, and value to Atomic Object clients

### Format Specifications
- **Length**: 300-500 words maximum
- **Paragraphs**: 3-4 concise, focused paragraphs
- **Tone**: Professional but approachable, confident without being arrogant
- **Accessibility**: Understandable to both technical and non-technical audiences
- **Focus**: Results-oriented, emphasizing business and technical impact

### Quality Checklist
- [ ] Biography immediately conveys technical credibility to engineering leaders
- [ ] Clearly communicates business value to non-technical executives
- [ ] Demonstrates leadership potential for future role considerations
- [ ] Feels authentic and distinctive rather than generic or templated
- [ ] Inspires confidence in ability to handle complex client challenges
- [ ] Reflects Atomic Object's values of craftsmanship, collaboration, and client partnership
- [ ] Synthesizes patterns across multiple projects effectively
- [ ] Shows clear professional growth and trajectory
- [ ] **CRITICAL: Maintains consistent formatting and structure across all generated biographies**
- [ ] Content length stays within 300-500 word requirement
- [ ] File saved to correct output directory with proper naming convention

## Output Requirements

### File Naming Convention
Use format: `{developer-name}-professional-bio.md`
Examples:
- `jacob-williams-professional-bio.md`
- `sarah-johnson-professional-bio.md`
- `michael-chen-professional-bio.md`

## Usage Instructions

```
Please create a professional biography for [DEVELOPER_NAME]'s Atomic Object employee profile following the Professional Biography Generation framework.

Career Context: [EXPERIENCE_LEVEL] with aspirations toward [CAREER_ASPIRATIONS].

[Include PERSONAL_DESCRIPTION if provided]

Please analyze these project experience summaries:
[LIST PROJECT_SUMMARIES]

[Include OPTIONAL_STRENGTHS if provided]

Output Directory: [OPTIONAL_OUTPUT_DIRECTORY] (if not specified, use default: professional-bios)
Generate a compelling 300-500 word professional biography suitable for potential clients, business executives, and tech recruiters.
```

## Success Criteria
The resulting biography should enable readers to:
1. Immediately understand the developer's technical competence and professional value
2. Recognize their leadership potential and collaborative approach
3. Appreciate their problem-solving abilities and business impact
4. Feel confident in their ability to handle complex client challenges
5. See clear evidence of professional growth and future potential
6. Connect with their authentic professional identity and approach to work

## CRITICAL CONSISTENCY REQUIREMENTS

**The format, structure, and organization of all professional biographies must be CONSISTENT across developers.** This means:

1. **Consistent paragraph structure** - Same organizational flow and logical progression
2. **Uniform length requirements** - All biographies stay within 300-500 word range
3. **Identical formatting standards** - Same emphasis patterns, bullet points, and styling
4. **Consistent file naming** - Follow exact naming convention for all outputs
5. **Same professional tone** - Maintain identical voice and approach across all biographies

Any deviation from the established biography format and standards is considered a critical error. When generating biographies, ensure complete consistency in structure, length, tone, and formatting. The goal is to create a collection of professional biographies that maintain uniform quality and presentation standards.

This framework ensures consistent, compelling biographies that effectively showcase technical expertise while remaining accessible to diverse audiences in a custom software consultancy environment.
