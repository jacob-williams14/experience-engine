# Quick Start Guide - Artifact Analysis Prompt

## How to Use the Prompt

1. **Choose your artifact** from `original-artifacts/` directory
2. **Copy the appropriate usage template** from `artifact-analysis-prompt.md`  
3. **Fill in the placeholders**:
   - `[DEVELOPER_NAME]` → e.g., "Jacob Williams"
   - `[PROJECT_NAME]` → e.g., "Compass Platform"
   - `[FILENAME]` → e.g., "root_compass_git_log.txt"
   - `[ARTIFACT_TYPE]` → e.g., "CSV backlog" or "git log"

## Available Artifacts (as of now)

- `root_compass_git_log.txt` - Compass project git history
- `root_leading_change_git_log.txt` - Leading Change project git history  
- `JIS_backlog.csv` - Justice Information System backlog
- `rore_backlog.csv` - RORE project backlog
- `biggby_backlog.csv` - Biggby mobile app backlog ✅ (already processed)

## Example Usage

### For Jacob's Git Log Analysis (Compass Project)
```
Please analyze the attached git log file for Jacob Williams' contributions to the Compass Platform. 
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Technical implementations and architectural decisions visible in commit messages
- Feature development patterns and areas of expertise
- Code quality and development process improvements
- Timeline and scope of contributions

File: root_compass_git_log.txt
```

### For Jacob's Backlog Analysis (JIS Project)
```
Please analyze the attached project backlog data for Jacob Williams' work on the Justice Information System.
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Feature development and technical implementation work
- Bug resolution and quality assurance activities
- Technical leadership and architectural contributions
- Cross-functional collaboration and project management

Note: The data has been pre-filtered to include only Jacob Williams' assigned work items.
File: JIS_backlog.csv
```

## For Team Members

To use this for other developers:
1. Replace "Jacob Williams" with the target developer's name
2. Filter artifacts to include only that developer's work
3. Update the file naming to match: `{developer-lastname}-{project-name}-project-summary.md`

## Output Location
All summaries are saved to: `project-experience-summaries/`

## Benefits of This Approach

- **Consistent Format**: All summaries follow the same professional structure
- **No Career Stage Bias**: Focuses on demonstrated work rather than assumptions
- **Reusable**: Can be used by any team member for their own professional documentation
- **Comprehensive**: Captures technical, leadership, and collaborative contributions
- **Biography-Ready**: Summaries are structured for easy professional biography construction
