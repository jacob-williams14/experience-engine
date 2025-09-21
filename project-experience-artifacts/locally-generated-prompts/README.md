# Locally Generated Prompts

This directory contains analysis prompts generated for manual copy/paste into AI tools like Warp AI, Claude, or ChatGPT. Also includes biography generation prompts created by the system.

## Quick Start

Generate prompts for manual analysis:

```bash
# Project analysis prompt (interactive mode)
bun run generateProjectSummary.ts
# Select "Generate prompt for copy/paste" when prompted

# Biography generation prompt (interactive mode)
bun run generateBio.ts
# Select local mode or use --generate-prompt flag

# Command line mode for project analysis
bun run generateProjectSummary.ts "datasources/root_compass_git_log.txt" "Jacob Williams" "Root Compass" --generate-prompt
```

## Analysis and Generation Modes

### 1. AI Processing Mode (Default)

**Project Analysis:**

- Processes git/CSV data and generates final summary automatically
- Uses the configured AI model (Claude Sonnet or OpenAI GPT)
- Output goes to `project-experience-summaries/`

```bash
bun run generateProjectSummary.ts "git-log.txt" "Developer Name" "Project Name"
```

**Biography Generation:**

- Synthesizes multiple project summaries into professional biographies
- Integrates StrengthsFinder themes automatically
- Output goes to `professional-bios/`

```bash
bun run generateBio.ts "Developer Name"
```

### 2. Prompt Generation Mode

**Project Analysis Prompts:**

- Generates comprehensive prompts for manual copy/paste
- Perfect for using with different AI models or tools
- Output goes to `locally-generated-prompts/`
- Includes all project data and analysis framework

```bash
bun run generateProjectSummary.ts "git-log.txt" "Developer Name" "Project Name" --generate-prompt
```

**Biography Generation Prompts:**

- Creates complete biography generation prompts with all context
- Includes project summaries, StrengthsFinder themes, and personal frame
- Available when AI configuration is set to "local" mode

```bash
bun run scripts/configureAI.ts set local
bun run generateBio.ts "Developer Name"
```

## Using Generated Prompts

1. Run the script with `--generate-prompt` flag or set AI mode to "local"
2. Copy the displayed prompt or open the saved `.md` file
3. Paste into your preferred AI tool (Warp AI, Claude, ChatGPT, etc.)
4. The AI will generate comprehensive output following the exact same framework

## Benefits of Prompt Generation Mode

- **Model Flexibility**: Use any AI model, not just the configured one
- **Quality Control**: Test different models to find the best results
- **Reliability**: No API calls, no rate limits, no network dependencies
- **Experimentation**: Easily try different analysis approaches
- **Backup**: Always have the prompt for later use
- **Cost Control**: Avoid API costs for experimentation

## File Naming Convention

Generated prompts are saved with descriptive names:

**Project Analysis Prompts:**

```
locally-generated-prompts/[project-name]-analysis-prompt.md
```

**Biography Generation Prompts:**

```
locally-generated-prompts/[developer-name]-biography-prompt.md
```

Examples:

- `root-compass-analysis-prompt.md`
- `biggby-mobile-app-analysis-prompt.md`
- `jacob-williams-biography-prompt.md`
