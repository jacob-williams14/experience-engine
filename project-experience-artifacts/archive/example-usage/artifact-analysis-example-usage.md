# Example Usage - Parameterized Prompt

## How to Use the Parameters Section

1. **Fill in the parameters at the top** with your specific values
2. **Copy the appropriate usage template** from the main prompt
3. **The placeholders will reference your defined parameters**

## Example: Jacob's JIS Project Analysis

### Step 1: Define Parameters

```
DEVELOPER_NAME: Jacob Williams
PROJECT_NAME: Justice Information System
FILENAME: datasources/JIS_backlog.csv
ARTIFACT_TYPE: CSV backlog

OPTIONAL_OUTPUT_DIRECTORY:
government-project-summaries

OPTIONAL_PROJECT_CONTEXT:
Project Context: This was a large-scale government modernization project involving legacy system migration and new microservices architecture. The project required high security standards and integration with existing judicial systems.

OPTIONAL_CAREER_CONTEXT:
Career Context: Jacob Williams is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting his technical competence and growth trajectory.

FILTER_IDENTIFIERS:
Data has already been pre-filtered to include only Jacob Williams' assigned work items (jacobwilliams122).
```

### Step 2: Use the Template

```
Please analyze the attached project backlog data for Jacob Williams' work on Judicial Information Services.
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Feature development and technical implementation work
- Bug resolution and quality assurance activities
- Technical leadership and architectural contributions
- Cross-functional collaboration and project management

Project Context: This was a large-scale government modernization project involving legacy system migration and new microservices architecture. The project required high security standards and integration with existing judicial systems.

Career Context: Jacob Williams is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting his technical competence and growth trajectory.

Data Filtering: The data has been pre-filtered to include only Jacob Williams' assigned work items.
Data Input: datasources/JIS_backlog.csv
Output Directory: government-project-summaries
```

## Benefits of Using Parameters

- ✅ **Define once, use everywhere** - No need to repeat the same info
- ✅ **Easy to update** - Change parameters in one place
- ✅ **Less error-prone** - Reduces copy/paste mistakes
- ✅ **Team-friendly** - Clear structure for others to follow
- ✅ **Quick setup** - Just fill in the parameters section and go

## For Team Members

Each person can create their own parameter block:

```
DEVELOPER_NAME: [Your Name]
PROJECT_NAME: [Your Project]
FILENAME: [Your Artifact File]
ARTIFACT_TYPE: [Type of artifact]
OPTIONAL_OUTPUT_DIRECTORY: [Your custom directory or leave blank for default]
OPTIONAL_PROJECT_CONTEXT: [Your project context]
OPTIONAL_CAREER_CONTEXT: [Your career context]
FILTER_IDENTIFIERS: [Your filtering info]
```

Then use any of the usage templates from the main prompt!
