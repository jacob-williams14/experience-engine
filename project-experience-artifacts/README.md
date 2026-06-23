# Project Experience Artifacts

**Version 4.0.0** - Complete professional biography generation system

A comprehensive TypeScript system that processes project artifacts (git logs, CSV backlogs) to generate professional project summaries and complete biographies. Features auto-discovery of StrengthsFinder themes and comprehensive CLI interfaces.

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
# Generate professional biography (interactive mode - recommended)
bun run generateBio.ts

# Generate LinkedIn Experience section content (interactive mode)
bun run generateLinkedInExperience.ts

# Generate project summary (interactive mode)
bun run generateProjectSummary.ts

# Direct command-line usage for project analysis
bun run scripts/analyzeProject.ts "datasources/git-log.txt" "Developer Name" "Project Name" \
  --email "dev@example.com" \
  --career-context "Context about developer's experience level" \
  --project-context "Brief project description"

# Direct command-line usage for biography generation
bun run generateBio.ts "Jacob Williams" --experience-level "Senior Developer" \
  --aspirations "Technical Leadership" --voice-style "authentic"
```

## 🎖️ AI Configuration

The system supports three modes:

### Local Mode (Default)

Generates prompts for manual copy/paste into AI tools:

```bash
bun run scripts/configureAI.ts set local
```

### OpenAI Mode

Automatically processes with GPT models (requires `OPENAI_API_KEY`):

```bash
bun run scripts/configureAI.ts set openai
```

### Claude Mode

Automatically processes with Claude models (requires `ANTHROPIC_API_KEY`):

```bash
bun run scripts/configureAI.ts set claude
```

## 📁 Input Data

### Git Logs (Current Support)

Place git log files in `datasources/`:

```bash
# Generate a git log file
git log --oneline --author="Developer Name" > datasources/project-git-log.txt

# Process with the system
bun run scripts/analyzeProject.ts "datasources/project-git-log.txt" "Developer Name" "Project Name"
```

### CSV Backlogs (Supported)

Process project backlogs from CSV files:

```bash
bun run tools/processBacklog.ts "datasources/project_backlog.csv" "Developer Name" "Project Name" \
  --email "dev@example.com"
```

### StrengthsFinder Themes (Auto-Discovery)

Place StrengthsFinder theme files in `resources/strengths/`:

```
resources/strengths/
├── strategic.txt
├── command.txt
├── belief.txt
└── ...
```

Themes are automatically discovered and integrated into biography generation.

### Voice Analysis (Optional)

For authentic voice analysis based on Atomic Spin blog posts:

```bash
# 1. Download Atomic Spin blog posts
bun run getPosts.ts

# 2. Convert HTML posts to markdown format
bun run htmlToMarkdown.ts

# 3. Now voice analysis will be available in biography generation
bun run generateBio.ts
# → Choose "Yes" when prompted for voice analysis
```

**Note**: Voice analysis requires the blog post data to be downloaded first. If you skip these steps, choose "No" for voice analysis and use manual voice style selection instead.

## 🏧 System Architecture

```
Project Artifacts → Analysis → Project Summaries → Biography Generation
     ↓                ↓              ↓                    ↓
Git Logs/CSV    → AI Analysis → Markdown Files → Professional Bio
StrengthsFinder → Auto-Discovery → Voice Integration → Authentic Voice
```

### Complete Workflow

1. **Data Processing**: Parse git logs, CSV backlogs, and discover StrengthsFinder themes
2. **Project Analysis**: Generate structured project summaries using AI analysis
3. **Biography Generation**: Synthesize multiple project summaries into professional biographies
4. **Voice Integration**: Apply authentic voice characteristics from StrengthsFinder themes

### Key Components

**Core Scripts:**

- **`generateBio.ts`** - Main biography generation with interactive interface
- **`generateLinkedInExperience.ts`** - LinkedIn Experience section content generation
- **`generateProjectSummary.ts`** - Project summary generation wrapper
- **`scripts/analyzeProject.ts`** - Project analysis engine with streaming processing
- **`scripts/generateBio.ts`** - Core biography generation logic
- **`scripts/configureAI.ts`** - AI provider management

**Tools:**

- **`tools/extractGitData.ts`** - Git log processing and analysis
- **`tools/processBacklog.ts`** - CSV backlog processing
- **`tools/validateArtifacts.ts`** - Artifact validation

**Libraries:**

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
linkedin-experience/            # LinkedIn Experience section content
datasources/                    # Source git logs and CSV data
resources/                      # Auto-discovered resources
├── strengths/                  # StrengthsFinder theme files
└── atomic-values/             # Company values (auto-discovered)
locally-generated-prompts/      # Manual copy/paste prompts
future-ideas/                   # Architecture evolution plans
lib/                           # Core system libraries
scripts/                       # Main processing scripts
tools/                         # Data processing utilities
```

## 🚧 Current Status

### ✅ Completed

- Git log processing and analysis
- CSV backlog processing support
- Multi-AI provider support (OpenAI, Claude, Local)
- Streaming architecture (no intermediate JSON files)
- Professional summary generation
- Complete biography generation from multiple projects
- StrengthsFinder theme auto-discovery and integration
- Interactive and command-line interfaces with help support
- Configuration management system
- Comprehensive CLI interfaces with graceful exit handling
- Voice analysis integration with Atomic Spin blog posts
- Intelligent caching system for voice analysis results
- Graceful fallback from voice analysis to manual voice styles

### 🔄 Future Enhancements

- Enhanced validation and quality assurance
- Multi-agent architecture for specialized analysis
- Voice analysis from custom writing samples (beyond Atomic Spin posts)

## 📏 Usage Examples

### Biography Generation

```bash
# Interactive mode (recommended)
bun run generateBio.ts

# Command line mode
bun run generateBio.ts "Jacob Williams" \
  --experience-level "Senior Developer" \
  --aspirations "Technical Leadership" \
  --voice-style "authentic" \
  --summaries-dir "project-experience-summaries"

# With voice analysis (requires blog posts setup)
bun run generateBio.ts "Jacob Williams" \
  --analyze-voice \
  --experience-level "Senior Developer"

# Force refresh cached voice analysis
bun run generateBio.ts "Jacob Williams" \
  --refresh-voice

# Get help for any script
bun run generateBio.ts --help
```

### LinkedIn Experience Generation

```bash
# Interactive mode (recommended)
bun run generateLinkedInExperience.ts

# Command line mode for big tech recruiting
bun run generateLinkedInExperience.ts "project-experience-summaries/root-compass-project-summary.md" \
  --developer "Jacob Williams" \
  --role-context "senior-engineer" \
  --company-context "big-tech"

# For startup recruiting
bun run generateLinkedInExperience.ts "project-experience-summaries/biggby-mobile-app-project-summary.md" \
  --developer "Jacob Williams" \
  --role-context "tech-lead" \
  --company-context "startup"

# Get help
bun run generateLinkedInExperience.ts --help
```

### Project Analysis

```bash
# Interactive mode
bun run generateProjectSummary.ts

# Command line mode with context
bun run scripts/analyzeProject.ts "compass-git-log.txt" "Jacob Williams" "Root Compass" \
  --email "jacob@example.com" \
  --username "jacob-williams14" \
  --career-context "Junior developer showing leadership potential" \
  --project-context "Educational platform with international localization requirements" \
  --role "Software Developer & Consultant"

# CSV backlog processing
bun run tools/processBacklog.ts "datasources/project_backlog.csv" "Developer Name" "Project" \
  --email "dev@example.com"
```

### Configuration Management

```bash
# Check current setup
bun run scripts/configureAI.ts status

# Switch to OpenAI mode
bun run scripts/configureAI.ts set openai

# Get help
bun run scripts/configureAI.ts --help
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
