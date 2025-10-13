#!/usr/bin/env bun

/**
 * Project Analysis Script
 * Generates comprehensive project summaries from processed git data
 * Uses the exact prompt format from the original artifact analysis system
 */

import { generateAIText } from "../lib/ai.js";
import { getCurrentProvider } from "../lib/aiConfig.js";
import { setupGracefulExit } from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import type { BacklogContribution, GitContribution } from "../lib/types.js";
import { extractGitData } from "../tools/extractGitData.js";
import { processBacklog } from "../tools/processBacklog.js";

/**
 * Create the sophisticated project analysis prompt based on the original artifact-analysis-prompt.md framework
 */
function createAnalysisPrompt(
	data: GitContribution | BacklogContribution,
	options: {
		projectContext?: string;
		careerContext?: string;
		role?: string;
		duration?: string;
		outputDir?: string;
		additionalInstructions?: string;
	} = {}
): string {
	const { developer, project } = data;

	// Determine data type and extract relevant information
	const isGitData = "commits" in data;
	const isCsvData = "tasks" in data;

	// Format data for the prompt based on type
	let formattedData: string;
	let recordCount: number;
	let dataTypeLabel: string;
	let dateRange: string;

	if (isGitData) {
		const gitData = data as GitContribution;
		formattedData = gitData.commits
			.map((commit) => `${commit.hash} | ${commit.date} | ${commit.message}`)
			.join("\n");
		recordCount = gitData.commits.length;
		dataTypeLabel = "git log data";

		// Extract date range from commits
		const dates = gitData.commits
			.map((c) => new Date(c.date))
			.sort((a, b) => a.getTime() - b.getTime());
		const startDate = dates[0];
		const endDate = dates[dates.length - 1];
		dateRange =
			startDate && endDate
				? `${startDate.toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
				  })} - ${endDate.toLocaleDateString("en-US", {
						month: "long",
						year: "numeric",
				  })}`
				: "Date range not available";
	} else {
		const csvData = data as BacklogContribution;
		// Format CSV data showing key task information
		formattedData = csvData.tasks
			.map((task, index) => {
				// Find the most relevant columns for display
				const title =
					task["Title"] ||
					task["Card Name"] ||
					task["Summary"] ||
					task["Card Name"] ||
					"No title";
				const status =
					task["State"] ||
					task["Status"] ||
					task["List Name"] ||
					"Unknown status";
				const type =
					task["Work Item Type"] ||
					task["Issue Type"] ||
					task["Labels"] ||
					"Task";
				return `Task ${index + 1} | ${status} | ${type} | ${title}`;
			})
			.join("\n");
		recordCount = csvData.tasks.length;
		dataTypeLabel = "project backlog data";
		dateRange = "Date range extracted from task data";
	}

	const outputDir = options.outputDir || "project-experience-summaries";

	return `Please analyze the attached project data for ${
		developer.name
	}'s contributions to ${project.name}. 
Create a comprehensive summary following the artifact analysis framework, focusing on:
- Technical implementations and architectural decisions ${
		isGitData
			? "visible in commit messages"
			: "evident in task descriptions and work items"
	}
- Feature development patterns and areas of expertise
- Code quality and development process improvements
- Timeline and scope of contributions

${options.projectContext ? `${options.projectContext}\n\n` : ""}
${options.careerContext ? `${options.careerContext}\n\n` : ""}

Data Filtering: The data has been pre-filtered to include only ${
		developer.name
	}'s ${isGitData ? "commits" : "assigned tasks"}.
Output Directory: ${outputDir}
Data Input: ${dataTypeLabel} (${recordCount} ${isGitData ? "commits" : "tasks"})

**${isGitData ? "Git Log" : "Project Backlog"} Data:**
\`\`\`
${formattedData}
\`\`\`

## Analysis Instructions

### 1. Initial Data Processing
- **Filter Scope**: Focus exclusively on work performed by ${developer.name}
- **Data Types**: Process git log commits
- **Time Range**: Capture the full timeline of ${developer.name}'s involvement

### 2. Technical Analysis Framework

**CRITICAL: For each framework category (A-D) below, extract specific technical evidence from the ${
		isGitData ? "commit messages" : "task descriptions and work items"
	} above that demonstrates ${developer.name}'s work in that area. Use the ${
		isGitData ? "commit messages" : "task titles, descriptions, and context"
	} as your primary source of technical detail.**

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
- Include specific technology names, frameworks, and tools mentioned in commit messages
- Describe architectural decisions and their rationale based on commit evidence
- Use industry-standard terminology and concepts
- Balance technical detail with accessibility
- Extract complete technology stack from commit messages, not generalized categories

#### Professional Tone
- Write in third person professional voice
- Use action-oriented language emphasizing technical competence and leadership contributions
- Highlight technical accomplishments based on evidence from artifacts
- Structure content for easy scanning and comprehension
- Focus on outcomes, impact, and demonstrated technical expertise
- Let the work speak for itself without assumptions about career level
- **Use sophisticated, but digestible professional language**
- **Demonstrate deep technical understanding**: Show complex problem-solving and architectural thinking in each description
- **Include specific technical implementations**: Describe actual technical work performed, not generic activities

#### Formatting Standards
- Use clear hierarchical structure with headers and subheaders
- Include bullet points for easy scanning - aim for 4+ bullet points per subsection to match comprehensive technical depth
- Bold key technologies and concepts
- **CRITICAL: Maintain EXACT consistent formatting, layout, and structure across all summaries**
- Follow the precise heading structure and section organization defined in the Content Organization section
- Do not deviate from the established document structure under any circumstances

## Output Requirements

### Content Organization
**CRITICAL: The following structure MUST be followed EXACTLY for EVERY summary. This structure must match previous summaries exactly:**

\`\`\`markdown
# ${project.name} Project Summary

**Developer:** ${developer.name}  
**Project Duration:** ${options.duration ? options.duration : dateRange}  
**Role:** ${
		options.role
			? options.role
			: "[Infer detailed role from commit patterns and technical contributions]"
	}  
**Technology Stack:** [Extract ALL specific technologies, frameworks, databases, and tools mentioned in commit messages based on actual commit evidence]

## Project Overview

[Write 2-3 comprehensive paragraphs that include:
- Brief project description emphasizing ${
		developer.name
	}'s central contributions
- Technology stack and architectural approach
- ${developer.name}'s specific role and areas of ownership
- Project scope, complexity, and business impact
- Key technical challenges addressed
${options.projectContext ? `- Context: ${options.projectContext}` : ""}]

## Technical Architecture & Infrastructure

### **[Specific Infrastructure Area - e.g., "Contentful CMS Integration & Architecture"]**
[Detailed description paragraph explaining the technical implementation]

- **[Specific technical implementation]** [detailed description with technical specifics]
- **[Another technical implementation]** [detailed description with technical specifics]
- **[Additional technical work]** [detailed description with technical specifics]
- **[More technical details]** [detailed description with technical specifics]

### **[Another Infrastructure Area - e.g., "Development Environment & Tooling"]**  
- **[Specific tooling work]** [detailed description]
- **[Build/deployment work]** [detailed description]
- **[Environment setup work]** [detailed description]
- **[Additional infrastructure work]** [detailed description]

## Feature Development & Engineering

### **[Major Feature Area - e.g., "Internationalization & Localization Architecture"]**
[Comprehensive description paragraph of the feature development work]

- **[Specific feature implementation]** [detailed technical description]
- **[Another feature component]** [detailed technical description] 
- **[Additional feature work]** [detailed technical description]
- **[Complex feature implementation]** [detailed technical description]
- **[Integration work]** [detailed technical description]

### **[Second Major Feature Area - e.g., "Content Management Workflows"]**
[Description paragraph explaining the scope and approach]

- **[Specific implementation]** [detailed description]
- **[User experience work]** [detailed description]
- **[Data management work]** [detailed description]
- **[Additional feature work]** [detailed description]

### **[Third Feature Area - e.g., "Advanced Component Development"]**
- **[Component architecture work]** [detailed description]
- **[State management work]** [detailed description] 
- **[Performance optimization]** [detailed description]
- **[Accessibility and UX work]** [detailed description]

## Technical Leadership & Problem-Solving

### **[Leadership Area - e.g., "Feature Ownership & Technical Decision-Making"]**
[Description paragraph highlighting leadership and ownership]

- **[Technical decision making]** [specific examples with context]
- **[Architecture choices]** [detailed reasoning and implementation]
- **[Complex problem solving]** [specific challenges and solutions]
- **[Performance optimization]** [technical approaches and results]

### **[Collaboration Area - e.g., "Cross-Functional Collaboration"]**
- **[Team coordination work]** [specific examples and outcomes]
- **[Stakeholder management]** [detailed description of coordination]
- **[Code review and mentoring]** [specific contributions]
- **[Technical knowledge sharing]** [documentation and training work]

### **[Innovation Area - e.g., "Innovation & Technical Excellence"]**
- **[Technical innovation]** [specific innovative solutions]
- **[Best practices establishment]** [process improvements]
- **[Quality standards]** [technical standards and guidelines]
- **[Process improvements]** [development workflow enhancements]

## Quality Assurance & Process Improvements

### **[Testing Area - e.g., "Comprehensive Testing Infrastructure"]**
[Description paragraph of testing approach and framework development]

- **[Testing architecture]** [specific testing implementations]
- **[Test automation]** [automated testing solutions]
- **[Quality assurance processes]** [QA workflow improvements]
- **[CI/CD improvements]** [build and deployment reliability]

### **[Code Quality Area - e.g., "Code Quality & Maintainability"]**
- **[Quality processes]** [specific quality improvement initiatives]
- **[Error handling]** [robust error management implementations]
- **[Performance monitoring]** [monitoring and optimization work]
- **[Technical debt management]** [refactoring and code improvement]

### **[Process Area - e.g., "Development Process Leadership"]**
- **[Process standardization]** [development workflow improvements]
- **[Documentation standards]** [knowledge management initiatives]
- **[Knowledge transfer]** [training and mentoring activities]

## Skills Demonstrated

### **Technical Skills**
- **[Technical Category]:** [comprehensive list of specific skills and technologies]
- **[Another Technical Category]:** [comprehensive list of specific skills and technologies]
- **[Third Technical Category]:** [comprehensive list of specific skills and technologies]
- **[Fourth Technical Category]:** [comprehensive list of specific skills and technologies]
- **[Fifth Technical Category]:** [comprehensive list of specific skills and technologies]
- **[Additional Technical Category]:** [comprehensive list of specific skills and technologies]

### **Tools & Technologies**
- **[Technology Category]:** [specific tools, frameworks, and technologies]
- **[Another Technology Category]:** [specific tools, frameworks, and technologies]
- **[Third Technology Category]:** [specific tools, frameworks, and technologies]
- **[Fourth Technology Category]:** [specific tools, frameworks, and technologies]
- **[Additional Technology Category]:** [specific tools, frameworks, and technologies]

### **Professional Skills**
- **[Professional Skill Category]:** [detailed description of demonstrated capability]
- **[Another Professional Skill]:** [detailed description of demonstrated capability]
- **[Third Professional Skill]:** [detailed description of demonstrated capability]
- **[Fourth Professional Skill]:** [detailed description of demonstrated capability]
- **[Additional Professional Skill]:** [detailed description of demonstrated capability]

## Project Impact

### **Technical Achievements**
- **[Major Technical Achievement]** [detailed description of technical accomplishment and impact]
- **[Second Technical Achievement]** [detailed description of technical accomplishment and impact]
- **[Third Technical Achievement]** [detailed description of technical accomplishment and impact]
- **[Fourth Technical Achievement]** [detailed description of technical accomplishment and impact]

### **Business Value Delivered**
- **[Business Impact]** [detailed description of business value and outcomes]
- **[Operational Impact]** [detailed description of operational improvements]
- **[User Experience Impact]** [detailed description of user-facing improvements]
- **[Technical Platform Impact]** [detailed description of platform and scalability improvements]

### **Team & Process Contributions**
- **[Process Contribution]** [detailed description of team and process improvements]
- **[Knowledge Sharing Contribution]** [detailed description of knowledge transfer activities]
- **[Technical Leadership Contribution]** [detailed description of technical leadership impact]
- **[Quality Contribution]** [detailed description of quality and reliability improvements]

[Write a comprehensive final paragraph (3-4 sentences) summarizing ${
		developer.name
	}'s overall impact, technical growth, and professional contributions demonstrated throughout the ${
		project.name
	} project. Highlight their technical competence, leadership capabilities, and the value they brought to the project and team.]
\`\`\`

${
	options.additionalInstructions
		? `\n## Additional Instructions\n${options.additionalInstructions}\n`
		: ""
}

## Quality Checklist
- [ ] Summary is comprehensive enough to understand ${
		developer.name
	}'s full contribution
- [ ] Technical details are accurate and specific
- [ ] Professional achievements are clearly highlighted
- [ ] Content is structured for biography construction
- [ ] Language is professional and achievement-focused
- [ ] All major technical areas are covered
- [ ] Skills section captures both technical and leadership abilities
- [ ] Document structure EXACTLY matches the required template format
- [ ] Consistent formatting has been maintained with previous summaries
- [ ] All sections and subsections are present in the correct order

## Critical Quality Requirements

### Content Requirements
- Summary must be comprehensive enough to understand ${
		developer.name
	}'s full technical contribution
- Technical details must be accurate, specific, and extracted from commit evidence
- Professional achievements must be clearly highlighted with supporting evidence
- Content must be structured specifically for professional biography construction
- Language must be professional, achievement-focused, and action-oriented
- All major technical areas must be thoroughly covered with specific examples
- Skills section must capture both deep technical capabilities and leadership abilities

### Structure Requirements (CRITICAL)
- Document structure must EXACTLY match the required template format
- Consistent formatting must be maintained with all previous summaries
- All sections and subsections must be present in the exact order specified
- Each section must contain substantial, detailed content - no placeholder text
- Bullet points must follow the exact **[Title]** [description] format
- Technical terms must be bolded consistently

### Analysis Depth Requirements
- Extract specific technical implementations from commit messages
- Identify architectural patterns and design decisions
- Highlight complex problem-solving and innovative solutions
- Demonstrate technical growth and learning throughout the project
- Show evidence of technical leadership and collaboration
- Quantify impact and contributions where possible from commit evidence

This analysis must produce a professional-grade summary that demonstrates ${
		developer.name
	}'s technical expertise, problem-solving abilities, and professional growth through concrete evidence extracted from their ${recordCount} ${
		isGitData ? "commits" : "tasks"
	} on the ${project.name} project.

## CRITICAL CONSISTENCY REQUIREMENTS

**The structure, format, and organization of all summaries must be IDENTICAL across projects.** This means:

1. **Exact same section headings** in the exact same order
2. **Identical formatting** for developer information, bullet points, and emphasis
3. **Consistent writing style** across all documents
4. **Same organizational pattern** within each section
5. **Uniform styling** of technical terms and concepts

Any deviation from the established template format is considered a critical error. When generating summaries, always refer to previously created summaries to ensure complete consistency in structure and formatting. The goal is to create a collection of professional summaries that can be read side-by-side with identical organization and structure.`;
}

// ===== Main analysis function =====
async function analyzeProject(
	dataFilePath: string,
	developerName: string,
	projectName: string,
	options: {
		projectContext?: string;
		careerContext?: string;
		role?: string;
		duration?: string;
		outputDir?: string;
		additionalInstructions?: string;
		developerEmail?: string;
		developerUsername?: string;
		developerAliases?: string[];
	} = {}
): Promise<void> {
	try {
		// Determine file type and process accordingly
		const isCSV = dataFilePath.toLowerCase().endsWith(".csv");
		let projectData: GitContribution | BacklogContribution;

		if (isCSV) {
			console.log(`📊 Processing CSV backlog from: ${dataFilePath}`);
			const csvResult = await processBacklog(
				dataFilePath,
				developerName,
				projectName,
				{
					developerEmail: options.developerEmail,
					developerUsername: options.developerUsername,
					saveToFile: false,
				}
			);

			if (!csvResult.success) {
				console.error("❌ CSV backlog processing failed:");
				csvResult.errors.forEach((error) =>
					console.error(`   ${error.message}`)
				);
				throw new Error("CSV backlog processing failed");
			}

			projectData = csvResult.data!;
		} else {
			console.log(`📊 Extracting git data from: ${dataFilePath}`);
			const gitResult = await extractGitData(
				dataFilePath,
				developerName,
				projectName,
				{
					developerEmail: options.developerEmail,
					developerUsername: options.developerUsername,
					developerAliases: options.developerAliases,
					saveToFile: false, // Stream processing - no intermediate files
				}
			);

			if (!gitResult.success) {
				console.error("❌ Git data extraction failed:");
				gitResult.errors.forEach((error) =>
					console.error(`   ${error.message}`)
				);
				throw new Error("Git data extraction failed");
			}

			projectData = gitResult.data!;
		}

		// Generate analysis prompt using original format
		console.log("🎨 Creating analysis prompt...");
		const prompt = createAnalysisPrompt(projectData, options);
		const provider = getCurrentProvider();

		console.log(`🤖 Using AI provider: ${provider.toUpperCase()}`);
		if (provider !== "local") {
			console.log(
				"📡 Sending request to AI service... (this may take a moment)"
			);
		}

		// Try to generate with AI - if local mode, will return null
		const aiResult = await generateAIText(prompt, "detailed");

		if (aiResult === null) {
			// === LOCAL MODE - PROMPT GENERATION ===
			console.log("\n🎯 Local mode: Generated Analysis Prompt");
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log(prompt);
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log("\n📋 Copy the above prompt and paste it into your AI tool!");

			// Save prompt to locally-generated-prompts directory
			const promptFileName = `${projectName
				.toLowerCase()
				.replace(/\s+/g, "-")}-analysis-prompt.md`;
			const promptFilePath = `locally-generated-prompts/${promptFileName}`;
			await Bun.write(promptFilePath, prompt);

			console.log(`✅ Prompt saved to: ${promptFilePath}`);
		} else {
			// === AI MODE ===
			console.log(`🤖 Analysis completed with ${provider}!`);

			const outputFileName = `${projectName
				.toLowerCase()
				.replace(/\s+/g, "-")}-project-summary.md`;
			const outputBaseDir = options.outputDir || CONFIG.PROJECT_SUMMARIES_DIR;
			const outputFilePath = `${outputBaseDir}/${outputFileName}`;
			await Bun.write(outputFilePath, aiResult);

			console.log(`📄 Project summary saved to: ${outputFilePath}`);
		}
	} catch (error) {
		console.error("💥 Analysis failed:", error);
		throw error;
	}
}

// ===== CLI Interface =====
async function main() {
	const args = process.argv.slice(2);

	// Setup graceful exit handling
	setupGracefulExit();

	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log("🔍 Project Analysis Tool");
		console.log("");
		console.log(
			"Usage: bun run scripts/analyzeProject.ts <data-file> <developer-name> <project-name> [options]"
		);
		console.log("");
		console.log("Options:");
		console.error(
			"  --career-context <text>       Rich career context paragraph"
		);
		console.error("  --project-context <context>   Additional project context");
		console.error(
			"  --role <text>                 Override inferred role in header"
		);
		console.error(
			"  --duration <text>             Override inferred duration in header"
		);
		console.log("");
		console.log("Description:");
		console.log(
			"  Analyzes project data (CSV/git logs) to generate comprehensive project summaries"
		);
		console.log("");
		console.log("Examples:");
		console.log(
			'  bun run scripts/analyzeProject.ts data.csv "Jacob Williams" "Biggby Mobile App"'
		);
		console.log(
			'  bun run scripts/analyzeProject.ts git.log "Developer" "Project" --role "Lead Developer"'
		);
		process.exit(0);
	}

	if (args.length < 3) {
		console.error(
			"Usage: bun run scripts/analyzeProject.ts <data-file> <developer-name> <project-name> [options]"
		);
		console.error(
			'Use "bun run scripts/analyzeProject.ts --help" for more information'
		);
		console.error("");
		console.error("Options:");
		console.error(
			"  --career-context <text>       Rich career context paragraph"
		);
		console.error("  --project-context <context>   Additional project context");
		console.error(
			"  --role <text>                 Override inferred role in header"
		);
		console.error(
			"  --duration <text>             Override inferred duration in header"
		);
		console.error("  --output-dir <path>           Output directory override");
		console.error(
			"  --instructions <text>         Additional analysis instructions"
		);
		console.error("  --email <email>               Developer email address");
		console.error("  --username <username>         Developer username/handle");
		console.error(
			"  --alias <alias>               Additional name alias (can be used multiple times)"
		);
		console.error("");
		console.error("Examples:");
		console.error("  # Git log analysis:");
		console.error(
			'  bun run scripts/analyzeProject.ts "datasources/root_compass_git_log.txt" "Jacob Williams" "Root Compass"'
		);
		console.error("  # CSV backlog analysis:");
		console.error(
			'  bun run scripts/analyzeProject.ts "datasources/biggby_backlog.csv" "Jacob Williams" "Biggby"'
		);
		console.error("  # With additional context:");
		console.error(
			'  bun run scripts/analyzeProject.ts "data-file.csv" "Developer" "Project" --email dev@example.com --career-context "Senior developer"'
		);
		console.error("");
		console.error(
			'Note: Use "bun run configure-ai" to set AI provider (openai/claude/local)'
		);
		process.exit(1);
	}

	const [dataFilePath, developerName, projectName] = args;

	// Parse options
	const options: Parameters<typeof analyzeProject>[3] = {};
	for (let i = 3; i < args.length; i++) {
		const flag = args[i];

		switch (flag) {
			case "--career-context":
				options.careerContext = args[++i];
				break;
			case "--project-context":
				options.projectContext = args[++i];
				break;
			case "--role":
				options.role = args[++i];
				break;
			case "--duration":
				options.duration = args[++i];
				break;
			case "--output-dir":
				options.outputDir = args[++i];
				break;
			case "--instructions":
				options.additionalInstructions = args[++i];
				break;
			case "--email":
				options.developerEmail = args[++i];
				break;
			case "--username":
				options.developerUsername = args[++i];
				break;
			case "--alias":
				options.developerAliases = options.developerAliases || [];
				options.developerAliases.push(args[++i]!);
				break;
		}
	}

	await analyzeProject(dataFilePath!, developerName!, projectName!, options);
}

if (import.meta.main) {
	main();
}

export { analyzeProject };
