# Locally Generated Prompts

This directory contains analysis prompts generated for manual copy/paste into AI tools like Warp AI, Claude, or ChatGPT.

## Quick Start

Generate a prompt for manual analysis:

```bash
# Interactive mode (select "Generate prompt for copy/paste" when prompted)
bun run generateProjectSummary.ts

# Command line mode
bun run generateProjectSummary.ts "original-artifacts/root_compass_git_log.txt" "Jacob Williams" "Root Compass" --generate-prompt
```

## Two Analysis Modes

### 1. AI Analysis Mode (Default)

- Processes git data and generates final summary automatically
- Uses the configured AI model (Claude 4 Sonnet)
- Output goes to `project-experience-summaries/`

```bash
bun run generateProjectSummary.ts "git-log.txt" "Developer Name" "Project Name"
```

### 2. Prompt Generation Mode (New)

- Generates a comprehensive prompt for manual copy/paste
- Perfect for using with different AI models or tools
- Output goes to `locally-generated-prompts/`
- Includes all git data and analysis framework

```bash
bun run generateProjectSummary.ts "git-log.txt" "Developer Name" "Project Name" --generate-prompt
```

## Using Generated Prompts

1. Run the script with `--generate-prompt` flag
2. Copy the displayed prompt or open the saved `.md` file
3. Paste into your preferred AI tool (Warp AI, Claude, ChatGPT, etc.)
4. The AI will generate a comprehensive project summary following the exact same framework

## Benefits of Prompt Generation Mode

- **Model Flexibility**: Use any AI model, not just the configured one
- **Quality Control**: Test different models to find the best results
- **Reliability**: No API calls, no rate limits, no network dependencies
- **Experimentation**: Easily try different analysis approaches
- **Backup**: Always have the prompt for later use

## File Naming Convention

Generated prompts are saved as:

```
locally-generated-prompts/[project-name]-analysis-prompt.md
```

For example:

- `root-compass-analysis-prompt.md`
- `biggby-mobile-app-analysis-prompt.md`
