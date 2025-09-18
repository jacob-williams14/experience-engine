# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Repository Overview

This repository contains an automated TypeScript system for generating professional project summaries from git logs. The `project-experience-artifacts/` directory houses a complete pipeline that processes git commit history and generates comprehensive, professional project summaries suitable for career documentation and biography construction.

## Common Commands

### System Setup and Configuration
```bash
# Navigate to the system directory
cd project-experience-artifacts/

# Install dependencies
bun install

# Check AI configuration status
bun run configure-ai status

# Switch AI modes (local/openai/claude)
bun run configure-ai set local
bun run configure-ai set openai
bun run configure-ai set claude
```

### Project Summary Generation
```bash
# Interactive mode (recommended for first-time users)
bun run generateProjectSummary.ts

# Direct command-line mode
bun run scripts/analyzeProject.ts "original-artifacts/git-log.txt" "Developer Name" "Project Name" \
  --email "developer@example.com" \
  --career-context "Developer experience and context" \
  --project-context "Project description and background"

# Example with real data
bun run scripts/analyzeProject.ts "original-artifacts/root_compass_git_log.txt" "Jacob Williams" "Root Compass" \
  --email "jacob@example.com" \
  --career-context "Junior developer with leadership potential" \
  --project-context "Educational platform requiring Contentful CMS integration"
```

### Content Analysis and Management
```bash
# View generated summaries
ls -la project-experience-artifacts/project-experience-summaries/

# Check word counts of summaries
wc -w project-experience-summaries/*.md

# Search for specific technologies across summaries
grep -r "React Native\|TypeScript\|GraphQL" project-experience-summaries/

# Find summaries by developer
grep -l "Jacob Williams" project-experience-summaries/*.md
```

### System Utilities
```bash
# Type check the entire system
bun run type-check

# View available npm scripts
bun run

# Check git data extraction (standalone)
bun run tools/extractGitData.ts --help
```

## Architecture and Structure

### System Architecture

```
Git Logs → extractGitData() → analyzeProject() → Professional Summary
```

**Current Workflow:**
1. **Git Processing**: Parse git logs and filter commits by developer
2. **AI Analysis**: Generate structured project summary using preserved prompt framework
3. **Output Generation**: Create professional markdown summaries

### Core Components

**Automated Processing Scripts** (`project-experience-artifacts/scripts/`)
- `analyzeProject.ts`: Main analysis engine with streaming git processing
- `configureAI.ts`: AI provider management and configuration
- `generateBio.ts`: Biography generation from multiple projects (in development)
- `validateOutput.ts`: Quality assurance and validation

**Interactive Interface**
- `generateProjectSummary.ts`: Interactive wrapper for easy parameter collection
- Prompts for all required inputs (developer info, project context, etc.)
- Calls the automated pipeline with collected parameters

**Core Libraries** (`project-experience-artifacts/lib/`)
- `ai.ts`: Multi-provider AI abstraction (OpenAI, Claude, Local)
- `aiConfig.ts`: Configuration management and provider switching
- `claude.ts`: Claude-specific SDK integration and model management
- `config.ts`: System constants and configuration
- `types.ts`: TypeScript type definitions

**Data Processing Tools** (`project-experience-artifacts/tools/`)
- `extractGitData.ts`: Git log parsing and developer filtering
- CSV backlog processing (planned)

**Input Sources** (`project-experience-artifacts/original-artifacts/`)
- Git log files: `root_compass_git_log.txt`, `root_leading_change_git_log.txt`
- CSV backlogs: `JIS_backlog.csv`, `biggby_backlog.csv` (for future processing)
- Raw project artifacts for analysis

**Generated Outputs**
- `project-experience-summaries/`: Comprehensive professional project summaries
- `professional-bios/`: Professional biographies (300-500 words)
- `locally-generated-prompts/`: AI prompts for manual copy/paste (local mode)

### AI Configuration System

**Three Operating Modes:**
1. **Local Mode** (default): Generates prompts for manual copy/paste into AI tools
2. **OpenAI Mode**: Automatically processes using GPT models (requires `OPENAI_API_KEY`)
3. **Claude Mode**: Automatically processes using Claude models (requires `ANTHROPIC_API_KEY`)

**Configuration Management:**
- Settings stored in `.ai-config.json` (created automatically)
- Switch modes with `bun run configure-ai set <provider>`
- Model settings: 3000 max tokens, 0.3 temperature (optimized for professional content)

### Key Workflows

**Automated Analysis Workflow:**
1. Place git log files in `original-artifacts/`
2. Run `bun run generateProjectSummary.ts` (interactive) or direct command-line
3. System automatically processes git data and generates professional summaries
4. Output saved to `project-experience-summaries/`

**Command-Line Workflow:**
```bash
# One command generates complete professional summary
bun run scripts/analyzeProject.ts "git-log.txt" "Developer Name" "Project" \
  --career-context "Developer experience level and context" \
  --project-context "Project description and technical background"
```

**Quality Assurance:**
- Consistent structure maintained across all generated summaries
- Original prompt framework preserved for quality standards
- TypeScript type safety throughout the system
- Automated git parsing eliminates manual data preparation errors

### Development Environment

**TypeScript System:**
- Built with Bun runtime for fast execution
- Full TypeScript typing throughout
- No build step required - direct TypeScript execution
- Type checking available via `bun run type-check`

**Streaming Architecture:**
- No intermediate JSON files - processes git data directly in memory
- Git log → analysis → summary in single pipeline
- Eliminates file I/O complexity and potential errors

**Multi-Provider AI Support:**
- Unified interface supporting OpenAI, Claude, and local prompt generation
- Easy switching between providers via configuration
- Consistent output quality regardless of AI provider
- Local mode supports teams without API access

### System Benefits

**For Individual Users:**
- Single command generates complete professional summaries
- Interactive mode guides through parameter collection
- No manual data preparation or formatting required
- Consistent high-quality output suitable for career documentation

**For Teams:**
- Standardized professional summary format across team members
- Reusable system for multiple projects and developers
- Version controlled configuration and templates
- Supports both automated and manual workflows

**Quality Assurance:**
- Preserves original manual prompt framework quality
- TypeScript ensures system reliability
- Automated processing eliminates human formatting errors
- Evidence-based summaries extracted directly from commit history

### Future Development

**Planned Features:**
- CSV backlog processing (complementing git log analysis)
- Enhanced biography generation from multiple project summaries
- Additional output formats and customization options
- Performance optimizations for large git repositories

This system represents the evolution from manual prompt engineering to automated professional documentation generation, maintaining the same high quality standards while dramatically reducing time investment and potential errors.
