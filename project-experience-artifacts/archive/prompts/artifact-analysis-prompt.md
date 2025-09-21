# Project Artifact Analysis Prompt

## Parameters

Define these parameters once at the beginning for easy reference throughout your prompt:

```
DEVELOPER_NAME: [Enter developer's full name, e.g., "Jacob Williams"]
PROJECT_NAME: [Enter project name, e.g., "Justice Information System"]
FILENAME: [Enter artifact filename, e.g., "datasources/JIS_backlog.csv"]
ARTIFACT_TYPE: [Enter type, e.g., "CSV backlog", "git log", "JSON export"]

OPTIONAL_OUTPUT_DIRECTORY:
[Enter custom output directory if desired, e.g., "project-experience-summaries" or "client-project-summaries"]

OPTIONAL_PROJECT_CONTEXT:
[Enter additional project context if desired, e.g., "Project Context: This was a large-scale government modernization project involving legacy system migration and new microservices architecture. The project required high security standards and integration with existing judicial systems."]

OPTIONAL_CAREER_CONTEXT:
[Enter career context if desired, e.g., "Career Context: Jacob Williams is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting his technical competence and growth trajectory."]

FILTER_IDENTIFIERS:
[Enter filtering info, e.g., "Look for commits by 'Jacob Williams', 'jacobwilliams122', or any commits mentioning 'Jacob' or 'JW' in commit messages or author fields."]
```

## Objective

Analyze the provided project artifact (git log, CSV backlog, JSON data, etc.) and create a comprehensive professional summary of the specified developer's technical contributions, leadership, and expertise demonstrated in the project.

## Context

- **Subject**: [DEVELOPER_NAME] - Software Developer and Technical Contributor
- **Purpose**: Create detailed summaries for professional biography construction that showcase technical expertise, problem-solving abilities, and leadership contributions
- **Output Location**: `[OPTIONAL_OUTPUT_DIRECTORY]` (defaults to `project-experience-summaries/` if not specified)
- **File Format**: Markdown (.md) preferred for readability and structure
- **Scope**: Focus on demonstrable technical contributions, architectural decisions, and collaborative achievements without assumptions about career stage

## Analysis Instructions

### 1. Initial Data Processing

- **Filter Scope**: Focus exclusively on work performed by the specified developer (filter by username, email, or name)
- **Data Types**: Process git logs, CSV backlogs, JSON exports, or other structured project data
- **Time Range**: Capture the full timeline of the developer's involvement

### 2. Technical Analysis Framework

#### A. Technical Architecture & Infrastructure

- Development environment setup and configuration
- CI/CD pipeline implementation and management
- Build systems, deployment automation
- Code quality tools and standardization
- Security implementations and best practices

#### B. Feature Development & Engineering

- Core functionality implementation
- User interface and user experience development
- API integration and data management
- Performance optimization and scalability
- Cross-platform or full-stack development work

#### C. Technical Leadership & Problem-Solving

- System design decisions and architectural choices
- Complex technical problem resolution
- Code review and mentoring activities
- Technical debt management and refactoring
- Innovation and creative solution development

#### D. Project Management & Collaboration

- Sprint planning and task breakdown
- Bug triaging and resolution
- Cross-functional team collaboration
- Documentation and knowledge sharing
- Quality assurance and testing strategies

### 3. Summary Structure Requirements

#### Project Overview Section

- Brief project description and the developer's role
- Technology stack and architectural decisions
- Project scope and business impact

#### Technical Contributions Section

- Organize by functional areas (Infrastructure, Feature Development, etc.)
- Use specific examples with technical details
- Highlight innovative solutions and complex problem-solving
- Include measurable impacts where possible

#### Skills Demonstration Section

- Extract and categorize technical skills demonstrated
- Include both hard technical skills and soft leadership skills
- Reference specific tools, frameworks, and methodologies used

#### Professional Impact Section

- Quantify contributions where possible (number of features, bug fixes, etc.)
- Describe leadership activities and team collaboration
- Highlight expertise areas that differentiate the developer professionally

### 4. Writing Guidelines

#### Technical Depth

- Include specific technology names, frameworks, and tools
- Describe architectural decisions and their rationale
- Use industry-standard terminology and concepts
- Balance technical detail with accessibility

#### Professional Tone

- Write in third person professional voice
- Use action-oriented language emphasizing technical competence and leadership contributions
- Highlight technical accomplishments based on evidence from artifacts
- Structure content for easy scanning and comprehension
- Focus on outcomes, impact, and demonstrated technical expertise
- Let the work speak for itself without assumptions about career level

#### Formatting Standards

- Use clear hierarchical structure with headers and subheaders
- Include bullet points for easy scanning
- Bold key technologies and concepts
- **CRITICAL: Maintain EXACT consistent formatting, layout, and structure across all summaries**
- Follow the precise heading structure and section organization defined in the Content Organization section
- Do not deviate from the established document structure under any circumstances

## Output Requirements

### File Naming Convention

Use format: `{project-name}-project-summary.md`
Examples:

- `biggby-mobile-app-project-summary.md`
- `compass-platform-project-summary.md`
- `jis-microservices-project-summary.md`

### Content Organization

**CRITICAL: The following structure MUST be followed EXACTLY for EVERY summary. Do not deviate from this structure or format:**

```markdown
# [Project Name] Project Summary

**Developer:** [Developer Name]  
**Project Duration:** [Month Year] - [Month Year]  
**Role:** [Role Title]  
**Technology Stack:** [Tech1], [Tech2], [Tech3], etc.

## Project Overview

[2-3 paragraphs describing the project and developer's contributions]

## Technical Architecture & Infrastructure

### **[Subsection Title]**

[Description paragraph]

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

### **[Additional Subsection Title]**

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

## Feature Development & Engineering

### **[Subsection Title]**

[Description paragraph]

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

### **[Additional Subsection Title]**

[Description paragraph]

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

## Technical Leadership & Problem-Solving

### **[Subsection Title]**

[Description paragraph]

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

### **[Additional Subsection Title]**

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

## Quality Assurance & Process Improvements

### **[Subsection Title]**

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

### **[Additional Subsection Title]**

- **[Bullet point title]** [description]
- **[Bullet point title]** [description]
  [...additional bullets as needed]

## Skills Demonstrated

### **Technical Skills**

- **[Category]:** [skill1], [skill2], [skill3], etc.
- **[Category]:** [skill1], [skill2], [skill3], etc.
  [...additional categories as needed]

### **Tools & Technologies**

- **[Category]:** [tool1], [tool2], [tool3], etc.
- **[Category]:** [tool1], [tool2], [tool3], etc.
  [...additional categories as needed]

### **Professional Skills**

- **[Category]:** [skill description]
- **[Category]:** [skill description]
  [...additional categories as needed]

## Project Impact

### **Technical Achievements**

- **[Achievement title]** [description]
- **[Achievement title]** [description]
  [...additional achievements as needed]

### **Business Value Delivered**

- **[Value title]** [description]
- **[Value title]** [description]
  [...additional values as needed]

### **Team & Process Contributions**

- **[Contribution title]** [description]
- **[Contribution title]** [description]
  [...additional contributions as needed]

[Final paragraph summarizing developer's overall impact and growth]
```

Each section and subsection must be included in the exact order shown. The formatting, including spacing, bold elements, and bullet structure must be precisely maintained across all summaries. Do not add, remove, or rearrange sections.

### Quality Checklist

- [ ] Summary is comprehensive enough to understand the developer's full contribution
- [ ] Technical details are accurate and specific
- [ ] Professional achievements are clearly highlighted
- [ ] Content is structured for biography construction
- [ ] Language is professional and achievement-focused
- [ ] All major technical areas are covered
- [ ] Skills section captures both technical and leadership abilities
- [ ] Document structure EXACTLY matches the required template format
- [ ] Consistent formatting has been maintained with previous summaries
- [ ] All sections and subsections are present in the correct order

## Optional Career Context

You can optionally replace `[OPTIONAL_CAREER_CONTEXT]` with career stage information to help tailor the summary tone and focus. Examples:

**For Mid-Level Developer Transitioning to Tech Lead:**

```
Career Context: [Developer Name] is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting their technical competence and growth trajectory.
```

**For Senior Developer:**

```
Career Context: [Developer Name] is an experienced senior developer with deep technical expertise. Please emphasize their technical leadership, architectural decision-making, and cross-team collaboration skills.
```

**For Junior Developer:**

```
Career Context: [Developer Name] is an early-career developer demonstrating strong technical aptitude and growth. Please emphasize learning agility, technical contributions, and collaborative skills while highlighting areas of emerging expertise.
```

Leave this section blank or remove `[OPTIONAL_CAREER_CONTEXT]` entirely if you prefer the analysis to focus purely on demonstrated work without career stage assumptions.

## Data Filtering

Replace `[FILTER_IDENTIFIERS]` with specific identifiers to help locate the developer's work in the artifact. Examples:

**For Git Logs:**

```
Data Filtering: Look for commits by "[Full Name]", "[username]", or email "[email@example.com]". Also include any commits mentioning "[initials]" or "[first name]" in commit messages.
```

**For CSV/Backlogs (if not pre-filtered):**

```
Data Filtering: Filter by username "[username]" in Members column, or "[Full Name]" in any name fields. Include any items assigned to or commented on by [Developer Name].
```

**For Mixed Data:**

```
Data Filtering: Look for "[username]", "[Full Name]", "[email@company.com]", or any variations of "[first name]" or "[initials]" in contributor fields, comments, or attribution data.
```

Note: For pre-filtered data, you can omit this section or note that filtering has already been completed.

## Usage Instructions

### For Git Logs

```
Please analyze the attached git log file for [DEVELOPER_NAME]'s contributions to [PROJECT_NAME].
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Technical implementations and architectural decisions visible in commit messages
- Feature development patterns and areas of expertise
- Code quality and development process improvements
- Timeline and scope of contributions

[OPTIONAL_PROJECT_CONTEXT]

[OPTIONAL_CAREER_CONTEXT]

Data Filtering: [FILTER_IDENTIFIERS]
Output Directory: [OPTIONAL_OUTPUT_DIRECTORY] (if not specified, use default: project-experience-summaries)
Data Input: [FILENAME]
```

### For CSV/JSON Backlogs

```
Please analyze the attached project backlog data for [DEVELOPER_NAME]'s work on [PROJECT_NAME].
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Feature development and technical implementation work
- Bug resolution and quality assurance activities
- Technical leadership and architectural contributions
- Cross-functional collaboration and project management

[OPTIONAL_PROJECT_CONTEXT]

[OPTIONAL_CAREER_CONTEXT]

Data Filtering: The data has been pre-filtered to include only [DEVELOPER_NAME]'s assigned work items.
Output Directory: [OPTIONAL_OUTPUT_DIRECTORY] (if not specified, use default: project-experience-summaries)
Data Input: [FILENAME]
```

### For Mixed Artifact Types

```
Please analyze the provided [ARTIFACT_TYPE] for [DEVELOPER_NAME]'s professional contributions to [PROJECT_NAME].
Create a comprehensive summary following the artifact analysis framework, extracting:
- Technical expertise demonstrated
- Leadership and mentoring activities
- Problem-solving and innovation examples
- Professional skills and competencies shown

[OPTIONAL_PROJECT_CONTEXT]

[OPTIONAL_CAREER_CONTEXT]

The summary should be detailed enough for constructing a professional biography showcasing their technical expertise and contributions.

Output Directory: [OPTIONAL_OUTPUT_DIRECTORY] (if not specified, use default: project-experience-summaries)
Data Input: [FILENAME]
```

## Success Criteria

The resulting summary should enable someone to:

1. Understand the developer's specific technical contributions and professional growth
2. Identify their areas of expertise and technical leadership capabilities
3. Recognize their problem-solving abilities and approach to complex technical challenges
4. Appreciate the scope and complexity of their professional work
5. See evidence of their technical competencies and collaborative skills
6. Extract relevant details for professional biography construction
7. Compare multiple developer project summaries with consistent structure and format

## CRITICAL CONSISTENCY REQUIREMENTS

**The structure, format, and organization of all summaries must be IDENTICAL across projects.** This means:

1. **Exact same section headings** in the exact same order
2. **Identical formatting** for developer information, bullet points, and emphasis
3. **Consistent writing style** across all documents
4. **Same organizational pattern** within each section
5. **Uniform styling** of technical terms and concepts

Any deviation from the established template format is considered a critical error. When generating summaries, always refer to previously created summaries to ensure complete consistency in structure and formatting. The goal is to create a collection of professional summaries that can be read side-by-side with identical organization and structure.

This prompt framework ensures consistent, comprehensive analysis that captures the full scope of professional expertise and contributions across different types of project artifacts.
