# Project Experience Artifacts

**Version 3.0.0** - Automated generation of professional project summaries

A streamlined TypeScript system that processes git logs to generate comprehensive, professional project summaries for career documentation and biography construction. CSV backlog processing support coming soon.

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh) runtime (v1.0.0 or later)
- Git log files from your projects
- (Optional) OpenAI or Claude API keys for automated processing

### Installation

```bash
# Navigate to the repository
cd project-experience-artifacts

# Install dependencies
bun install

# Check current AI configuration
bun run configure-ai status
```

### Basic Usage

```bash
# Interactive mode (recommended for first-time users)
bun run generateProjectSummary.ts

# Direct command-line usage
bun run scripts/analyzeProject.ts "original-artifacts/git-log.txt" "Developer Name" "Project Name" \
  --email "dev@example.com" \
  --career-context "Context about developer's experience level" \
  --project-context "Brief project description"
```

## 🎖️ AI Configuration

The system supports three modes:

### Local Mode (Default)
Generates prompts for manual copy/paste into AI tools:
```bash
bun run configure-ai set local
```

### OpenAI Mode
Automatically processes with GPT models (requires `OPENAI_API_KEY`):
```bash
bun run configure-ai set openai
```

### Claude Mode  
Automatically processes with Claude models (requires `ANTHROPIC_API_KEY`):
```bash
bun run configure-ai set claude
```

## 📁 Input Data

### Git Logs (Current Support)
Place git log files in `original-artifacts/`:
```bash
# Generate a git log file
git log --oneline --author="Developer Name" > original-artifacts/project-git-log.txt

# Process with the system
bun run scripts/analyzeProject.ts "original-artifacts/project-git-log.txt" "Developer Name" "Project Name"
```

### CSV Backlogs (Coming Soon)
Support for processing project backlogs from CSV files will be added to complement git log analysis.

## 🏧 System Architecture

```
Git Logs → extractGitData() → analyzeProject() → Professional Summary
```

### Current Workflow
1. **Git Processing**: Parse git logs and filter by developer
2. **AI Analysis**: Generate structured project summary using original prompt framework
3. **Output Generation**: Create professional markdown summaries

### Key Components

- **`scripts/analyzeProject.ts`** - Main analysis engine with streaming git processing
- **`generateProjectSummary.ts`** - Interactive wrapper for easy use
- **`scripts/configureAI.ts`** - AI provider management
- **`lib/aiConfig.ts`** - Configuration system
- **`lib/ai.ts`** - AI abstraction layer (OpenAI, Claude, or local prompt generation)

## 📊 Output

### Project Summaries
Generated in `project-experience-summaries/`:
- Comprehensive technical analysis
- Skills demonstration
- Professional achievements
- Structured for biography construction
- Consistent formatting across projects

### Professional Biographies
Generated in `professional-bios/`:
- 300-500 word professional narratives
- Synthesized from multiple project summaries
- Client-ready professional profiles

## 🔧 Configuration

### AI Models
- **OpenAI**: GPT-4o for analysis, GPT-4o-mini for general tasks
- **Claude**: Sonnet-4 for analysis, Sonnet-3.5 for general tasks
- **Settings**: 3000 max tokens, 0.3 temperature (optimized for professional content)

### File Structure
```
project-experience-summaries/    # Generated project summaries
professional-bios/              # Generated biographies  
original-artifacts/             # Source git logs and data
lib/                           # Core system libraries
scripts/                       # Main processing scripts
tools/                         # Data processing utilities
```

## 🚧 Current Status

### ✅ Completed
- Git log processing and analysis
- Multi-AI provider support (OpenAI, Claude, Local)
- Streaming architecture (no intermediate JSON files)
- Professional summary generation
- Interactive and command-line interfaces
- Configuration management system

### 🔄 In Development
- CSV backlog processing support
- Biography generation from multiple projects
- Enhanced validation and quality assurance

## 📏 Usage Examples

### Interactive Mode
```bash
bun run generateProjectSummary.ts
# Follows prompts to collect all parameters interactively
```

### Command Line Mode
```bash
# Basic usage
bun run scripts/analyzeProject.ts "git-log.txt" "John Doe" "E-commerce Platform"

# With context (recommended)
bun run scripts/analyzeProject.ts "compass-git-log.txt" "Jacob Williams" "Root Compass" \
  --email "jacob@example.com" \
  --username "jacob-williams14" \
  --career-context "Junior developer showing leadership potential" \
  --project-context "Educational platform with international localization requirements" \
  --role "Software Developer & Consultant"
```

### Configuration Management
```bash
# Check current setup
bun run configure-ai status

# Switch to OpenAI mode
bun run configure-ai set openai

# View available models
bun run configure-ai models
```

## 🎯 Quality Standards

All generated summaries follow strict formatting and content requirements:
- Consistent structure across projects
- Technical depth with specific implementation details
- Professional tone suitable for client presentation
- Evidence-based accomplishments extracted from commit history
- Skills categorization and technical competency demonstration

## 🔄 Migration from Manual Process

This system preserves the exact prompt framework and quality standards from the original manual process while automating:
- Git log parsing and filtering
- Data formatting for AI consumption
- Consistent application of analysis framework
- Professional output generation

The generated summaries maintain the same high quality and structure as manually created ones, but with significantly reduced time investment.

---

**Goal**: Generate professional-grade project summaries that showcase technical expertise, problem-solving abilities, and professional growth through automated analysis of project artifacts.
