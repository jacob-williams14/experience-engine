# Prompts & Tools

A personal collection of AI prompts, automation tools, and experimental AI agents built in my free time.

## 🎯 Purpose

This repository serves as my playground for exploring AI-powered automation, prompt engineering, and tool development. It's a mix of practical utilities I use in my daily work and experimental projects that push the boundaries of what's possible with AI.

## 📁 Current Projects

### [Project Experience Artifacts](./project-experience-artifacts/)

A comprehensive TypeScript system for generating professional project summaries and biographies from project artifacts (git logs, CSV backlogs, etc.).

**Key Features:**

- Interactive CLI interfaces with comprehensive help and graceful error handling
- Multi-AI provider support (OpenAI, Claude, Local prompt generation)
- Complete biography generation from multiple project summaries
- Authentic voice analysis from writing samples with intelligent caching
- CSV backlog processing and git log analysis
- Streaming architecture with no intermediate files
- Professional-grade output suitable for client presentations

**Status:** ✅ Production-ready with extensive documentation

**Recently Completed:**
- ✅ Voice analysis integration for authentic content generation
- ✅ CSV backlog processing alongside git log analysis
- ✅ Intelligent caching system for voice analysis results
- ✅ Enhanced CLI experience with graceful error handling

## 🔮 Future Directions

### AI Agents & Multi-Agent Systems

- Specialized analysis agents for different content types
- Agent orchestration and communication patterns
- Enhanced multi-modal analysis capabilities

### Prompt Engineering Experiments

- Advanced prompt templates and frameworks
- Context optimization techniques
- Multi-modal prompt strategies

### Automation Tools

- Advanced workflow automation for content creation
- Enhanced integration with various data sources and APIs
- Expanded quality assurance and validation frameworks
- Performance optimizations for large-scale processing

## 🛠️ Technology Stack

- **Runtime:** Bun (fast JavaScript/TypeScript runtime)
- **AI Integration:** OpenAI GPT-4o, Anthropic Claude Sonnet, with local prompt fallback
- **Languages:** TypeScript with full type safety
- **CLI Framework:** @inquirer/prompts with custom utilities for graceful interruption handling
- **Architecture:** Modular, CLI-first design with streaming capabilities and intelligent caching
- **Data Processing:** CSV parsing, git log analysis, voice analysis with cheerio for web scraping

## 🎨 Philosophy

This repository reflects my approach to AI tool development:

1. **User Experience First:** Every tool should have intuitive interfaces and comprehensive help
2. **Practical Value:** Focus on solving real problems I encounter in my work
3. **Experimentation:** Try new approaches and document what works (and what doesn't)
4. **Quality:** Even experimental tools should be well-documented and maintainable
5. **Open Learning:** Share discoveries and techniques that might help others

## 🚀 Getting Started

Each project has its own README with detailed setup and usage instructions. Most tools are designed to work independently, so you can explore whatever interests you.

### Quick Setup

```bash
# Clone the repository
git clone <repo-url>
cd prompts-and-tools

# Navigate to a specific project
cd project-experience-artifacts

# Follow the project-specific README for setup
```

## 📝 Contributing

This is primarily a personal repository for my experiments and tools. However, if you find something useful or have suggestions for improvements, feel free to open an issue or start a discussion.

## 📄 License

This repository contains personal tools and experiments. Individual projects may have their own licensing terms - check each project's directory for details.

---

**Note:** This is a living repository that evolves as I explore new ideas and build new tools. Some projects may be experimental or work-in-progress. Check individual project READMEs for current status and stability.
