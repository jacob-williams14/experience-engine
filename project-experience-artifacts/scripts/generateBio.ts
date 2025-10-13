#!/usr/bin/env bun

/**
 * Biography Generation Script
 * Creates professional biographies from multiple project summaries
 * Uses the exact prompt format from the original professional bio generation system
 */

import { existsSync } from "fs";
import { readdir, stat } from "fs/promises";
import { generateAIText } from "../lib/ai.js";
import { getCurrentProvider } from "../lib/aiConfig.js";
import { setupGracefulExit } from "../lib/cliUtils.js";

/**
 * Discover project summary files from a directory
 */
async function discoverProjectSummaries(
	directoryPath: string
): Promise<string[]> {
	try {
		const files = await readdir(directoryPath);
		const summaryFiles = files
			.filter((file) => file.endsWith(".md"))
			.map((file) => `${directoryPath}/${file}`)
			.sort();

		console.log(
			`📁 Found ${summaryFiles.length} project summaries in ${directoryPath}`
		);
		return summaryFiles;
	} catch (error) {
		throw new Error(`Could not read directory ${directoryPath}: ${error}`);
	}
}

/**
 * Randomly select up to maxCount files from the list
 */
function selectRandomSummaries(
	summaryPaths: string[],
	maxCount: number = 3
): string[] {
	if (summaryPaths.length <= maxCount) {
		return summaryPaths; // Use all if maxCount or fewer
	}

	// Random selection of up to maxCount summaries
	const shuffled = [...summaryPaths].sort(() => 0.5 - Math.random());
	const selected = shuffled.slice(0, maxCount);

	console.log(
		`🎲 Randomly selected ${selected.length} summaries from ${summaryPaths.length} available:`
	);
	selected.forEach((path) => {
		const fileName = path.split("/").pop();
		console.log(`   • ${fileName}`);
	});

	return selected;
}

/**
 * Auto-discover and load Atomic Object values
 */
async function loadAtomicValues(): Promise<string | null> {
	const valuesDir = "resources/atomic-values";

	if (!existsSync(valuesDir)) {
		return null;
	}

	try {
		const files = await readdir(valuesDir);
		const valuesFiles = files.filter((file) => file.endsWith(".txt")).sort();

		if (valuesFiles.length === 0) {
			return null;
		}

		console.log(
			`🏢 Auto-discovered ${valuesFiles.length} Atomic Object values`
		);

		const valuesContent: string[] = [];
		for (const file of valuesFiles) {
			try {
				const content = await Bun.file(`${valuesDir}/${file}`).text();
				const valueName = file
					.replace(".txt", "")
					.replace(/-/g, " ")
					.toUpperCase();
				valuesContent.push(`**${valueName}:**\n${content.trim()}`);
			} catch (error) {
				console.warn(`⚠️  Could not load values file: ${file}`);
			}
		}

		return valuesContent.join("\n\n");
	} catch (error) {
		console.warn(`⚠️  Could not read atomic-values directory: ${error}`);
		return null;
	}
}

/**
 * Auto-discover and load Strengths files
 */
async function loadStrengthsData(): Promise<string | null> {
	const strengthsDir = "resources/strengths";

	if (!existsSync(strengthsDir)) {
		return null;
	}

	try {
		const files = await readdir(strengthsDir);
		const strengthsFiles = files.filter((file) => file.endsWith(".txt")).sort();

		if (strengthsFiles.length === 0) {
			return null;
		}

		console.log(`🎯 Auto-discovered ${strengthsFiles.length} Strengths themes`);

		const strengthsContent: string[] = [];
		for (const file of strengthsFiles) {
			try {
				const content = await Bun.file(`${strengthsDir}/${file}`).text();
				const themeName = file.replace(".txt", "").toUpperCase();
				strengthsContent.push(`**${themeName}:**\n${content.trim()}`);
			} catch (error) {
				console.warn(`⚠️  Could not load strength file: ${file}`);
			}
		}

		return strengthsContent.join("\n\n");
	} catch (error) {
		console.warn(`⚠️  Could not read strengths directory: ${error}`);
		return null;
	}
}

/**
 * Extract key highlights from a project summary for biography generation
 * Focuses only on biography-essential content while reducing token usage significantly
 */
function extractProjectHighlights(summary: string): string {
	const lines = summary.split("\n");
	const highlights: string[] = [];
	let currentSection = "";
	let captureMode = "none"; // "header", "overview", "skills", "impact", "none"
	let sectionContent: string[] = [];
	let bulletCount = 0;
	const maxBulletsPerSubsection = 3;

	for (const line of lines) {
		const trimmedLine = line.trim();

		// Project header information
		if (
			line.startsWith("# ") ||
			line.startsWith("**Developer:**") ||
			line.startsWith("**Project Duration:**") ||
			line.startsWith("**Role:**") ||
			line.startsWith("**Technology Stack:**")
		) {
			if (captureMode !== "none" && sectionContent.length > 0) {
				highlights.push(sectionContent.join("\n"));
			}
			sectionContent = [line];
			captureMode = "header";
			continue;
		}

		// Project Overview - capture full section
		if (line.startsWith("## Project Overview")) {
			if (captureMode !== "none" && sectionContent.length > 0) {
				highlights.push(sectionContent.join("\n"));
			}
			sectionContent = [line];
			captureMode = "overview";
			continue;
		}

		// Skills Demonstrated - only capture specific subsections with limited bullets
		if (line.startsWith("## Skills Demonstrated")) {
			if (captureMode !== "none" && sectionContent.length > 0) {
				highlights.push(sectionContent.join("\n"));
			}
			sectionContent = [line];
			captureMode = "skills";
			continue;
		}

		// Project Impact - only capture specific subsections with limited bullets
		if (line.startsWith("## Project Impact")) {
			if (captureMode !== "none" && sectionContent.length > 0) {
				highlights.push(sectionContent.join("\n"));
			}
			sectionContent = [line];
			captureMode = "impact";
			continue;
		}

		// Stop capturing if we hit an irrelevant major section
		if (
			line.startsWith("## ") &&
			!line.includes("Project Overview") &&
			!line.includes("Skills Demonstrated") &&
			!line.includes("Project Impact")
		) {
			if (captureMode !== "none" && sectionContent.length > 0) {
				highlights.push(sectionContent.join("\n"));
			}
			captureMode = "none";
			sectionContent = [];
			continue;
		}

		// Handle content based on current capture mode
		if (captureMode === "header" || captureMode === "overview") {
			// For header and overview, capture everything until next major section
			if (trimmedLine !== "") {
				sectionContent.push(line);
			}
		} else if (captureMode === "skills" || captureMode === "impact") {
			// For skills and impact, only capture key subsections with limited bullets
			if (
				line.startsWith("### **Technical Skills**") ||
				line.startsWith("### **Professional Skills**") ||
				line.startsWith("### **Technical Achievements**") ||
				line.startsWith("### **Business Value Delivered**")
			) {
				sectionContent.push("", line); // Add spacing before subsection
				bulletCount = 0;
			} else if (
				line.startsWith("- **") &&
				bulletCount < maxBulletsPerSubsection
			) {
				sectionContent.push(line);
				bulletCount++;
			} else if (line.startsWith("### ")) {
				// Skip other subsections we don't want
				continue;
			}
		}
	}

	// Don't forget the last section
	if (captureMode !== "none" && sectionContent.length > 0) {
		highlights.push(sectionContent.join("\n"));
	}

	return highlights.join("\n\n");
}

/**
 * Load and parse project summary files
 */
async function loadProjectSummaries(summaryPaths: string[]): Promise<string[]> {
	const summaries: string[] = [];

	for (const path of summaryPaths) {
		try {
			const content = await Bun.file(path).text();
			const highlights = extractProjectHighlights(content);
			summaries.push(highlights);
		} catch (error) {
			console.warn(`⚠️  Could not load project summary: ${path}`);
			console.warn(`   Error: ${error}`);
		}
	}

	if (summaries.length === 0) {
		throw new Error("No project summaries could be loaded");
	}

	console.log(`📊 Loaded ${summaries.length} project summaries`);
	return summaries;
}

/**
 * Generate voice-specific writing guidelines based on the selected voice style
 */
function getVoiceGuidelines(
	voiceStyle: "professional" | "personable" | "authentic"
): string {
	switch (voiceStyle) {
		case "professional":
			return `- **Professional Tone**: Confident, formal, results-oriented without being boastful
- **Accessible Language**: Clear to both technical and non-technical readers
- **Active Voice**: Use action-oriented language emphasizing impact and contributions
- **Concise Structure**: 3-4 focused paragraphs, each with clear purpose
- **Avoid Jargon**: Minimize industry-specific terms that might confuse non-technical readers
- **Objective Focus**: Emphasize achievements and capabilities over personality traits`;

		case "personable":
			return `- **Warm Tone**: Approachable, genuine, and relatable while maintaining professionalism
- **Personal Voice**: Let personality shine through word choices and phrasing
- **Conversational Language**: More natural, less formal phrasing where appropriate
- **Strengths Integration**: Weave personality insights naturally into descriptions
- **Human Connection**: Show the person behind the professional achievements
- **Authentic Expression**: Use language that feels true to the individual's character`;

		case "authentic":
		default:
			return `- **Balanced Tone**: Professional credibility with authentic personal voice
- **Strengths-Informed Language**: Use insights from personality themes to guide word choices
- **Natural Phrasing**: Professional but not overly formal or templated
- **Personal Authenticity**: Let individual character come through while maintaining business appropriateness
- **Active Voice**: Action-oriented language that reflects the person's natural approach
- **Genuine Expression**: Avoid generic phrases in favor of language that feels true to the individual
- **Professional Warmth**: Confident and capable while remaining approachable and human`;
	}
}

/**
 * Create the sophisticated biography generation prompt based on the original professional_bio_generation_prompt.md framework
 */
function createBiographyPrompt(
	developerName: string,
	projectSummaries: string[],
	options: {
		experienceLevel?: string;
		careerAspirations?: string;
		personalDescription?: string;
		strengthsData?: string;
		voiceStyle?: "professional" | "personable" | "authentic";
		voiceSignature?: string;
		outputDir?: string;
		additionalInstructions?: string;
	} = {}
): string {
	const outputDir = options.outputDir || "professional-bios";

	// Format project summaries for the prompt
	const formattedSummaries = projectSummaries
		.map(
			(summary, index) =>
				`**Project Summary ${index + 1}:**\n\`\`\`\n${summary}\n\`\`\``
		)
		.join("\n\n");

	return `Please create a professional biography for ${developerName}'s Atomic Object employee profile following the Professional Biography Generation framework.

**CRITICAL: Write this biography in FIRST PERSON** - as if ${developerName} is speaking directly about their own experience and approach. Use "I" throughout, not "he/she" or third person.

## Parameters
- **Developer Name**: ${developerName}
- **Experience Level**: ${
		options.experienceLevel || "[Infer from project summaries]"
	}
- **Career Aspirations**: ${
		options.careerAspirations ||
		"[Infer leadership trajectory from project patterns]"
	}
- **Output Directory**: ${outputDir}
${
	options.personalDescription
		? `- **Personal Description**: ${options.personalDescription}`
		: ""
}

## Personality & Voice Guidance
${
	options.strengthsData
		? `### Strengths Themes
${options.strengthsData}

### Voice Integration Instructions
Use these Strengths themes to inform the biography's voice and personality:
- Let the person's natural strengths shine through in how their work is described
- Use language that reflects their authentic approach to problem-solving and collaboration
- Incorporate personality-driven phrases that feel genuine to someone with these strengths
- Balance professional credibility with authentic personal voice`
		: "[No Strengths data available - use neutral professional voice]"
}

## Objective
Analyze the provided project experience summaries and create a concise, compelling professional biography for an Atomic Object employee profile that showcases technical competence, leadership capabilities, and professional growth.

## Context
- **Subject**: ${developerName} - Software Developer and Technical Professional
- **Purpose**: Create employee profile biography for potential clients, business executives, tech recruiters, and industry leaders
- **Output Location**: \`${outputDir}\` 
- **File Format**: Markdown (.md) preferred for readability and structure
- **Audience**: Both technical and non-technical readers
- **Length**: 200-400 words maximum (reduced for conciseness)
- **Voice Style**: ${
		options.voiceStyle || "authentic"
	} (professional/personable/authentic)${
		options.voiceSignature
			? `\n- **Voice Signature**: Based on analysis of ${developerName}'s writing style:\n${options.voiceSignature}`
			: ""
	}

## Project Experience Summaries
${formattedSummaries}

## Analysis Instructions

### 1. Project Summary Synthesis
- **Review Scope**: Analyze all provided project experience summaries comprehensively
- **Pattern Identification**: Extract common themes, growth patterns, and recurring strengths across projects
- **Timeline Understanding**: Identify career progression and increasing responsibility over time

### 2. Biography Construction Framework

#### A. Professional Identity & Expertise
- Core technical competencies and areas of specialization
- Unique value proposition and what sets them apart
- Professional passion and approach to work
- Industry domain knowledge and experience

#### B. Technical Leadership & Problem-Solving
- Evidence of technical leadership emergence and growth
- Complex problem-solving approach and innovation examples
- Architectural thinking and system design capabilities
- Mentoring and knowledge transfer activities

#### C. Collaboration & Business Impact
- Cross-functional partnership and stakeholder management
- Client-focused approach and business value delivery
- Team building and collaborative leadership style
- Communication excellence and relationship building

#### D. Professional Growth & Future Potential
- Learning agility and adaptability across technologies and domains
- Career trajectory and progression toward leadership roles
- Continuous improvement mindset and growth orientation
- Alignment with Atomic Object consulting excellence and company culture

### 3. Writing Guidelines

#### Content Approach
- **Focus on Who They Are**: Write about their personality, values, and way of thinking - avoid project details entirely
- **Show Character Through Perspective**: Reveal personality through their approach to problems and people, not work examples
- **Be Genuinely Human**: Every sentence should sound like a real person talking - avoid AI writing patterns
- **Avoid Technical References**: No project names, technologies, or specific work details
- **Personal Philosophy**: Focus on their beliefs about work, growth, and collaboration
- **Natural Speech Patterns**: Sound like actual human conversation, not polished marketing copy


## Output Requirements

### Biography Structure (FIRST PERSON)
Write in natural, shorter paragraphs that flow like genuine personal reflection:

- **Personal Philosophy**: What drives you and how you see your work - your authentic perspective
- **How You Think**: Your natural approach to problems, people, and growth - your actual personality 
- **What Excites You**: Where you're headed and what energizes you - genuine enthusiasm

**STRUCTURE GUIDELINES:**
- Use 4-5 shorter paragraphs instead of 3 dense ones for better readability
- Keep paragraphs focused on one main idea each
- Let the writing breathe - don't pack too much into each paragraph

**AVOID THESE AI PATTERNS:**
- Em-dashes and excessive punctuation
- "Whether I'm [doing X] or [doing Y]" constructions
- Listing multiple examples in one sentence
- Corporate buzzwords and polished language
- Technical project references

### Format Specifications
- **Length**: 200-400 words maximum (concise and impactful)
- **Paragraphs**: 3-4 concise, focused paragraphs
- **Tone**: Professional but approachable, confident without being arrogant
- **Accessibility**: Understandable to both technical and non-technical audiences
- **Focus**: Results-oriented, emphasizing business and technical impact

### Quality Checklist
- [ ] Biography immediately conveys technical credibility to engineering leaders
- [ ] Clearly communicates business value to non-technical executives
- [ ] Demonstrates leadership potential for future role considerations
- [ ] Feels authentic and distinctive rather than generic or templated
- [ ] Inspires confidence in ability to handle complex client challenges
- [ ] Reflects Atomic Object's values of craftsmanship, collaboration, and client partnership
- [ ] Synthesizes patterns across multiple projects effectively
- [ ] Shows clear professional growth and trajectory
- [ ] **CRITICAL: Maintains consistent formatting and structure across all generated biographies**
- [ ] Content length stays within 200-400 word requirement
- [ ] File saved to correct output directory with proper naming convention

## File Naming Convention
Use format: \`{developer-name}-professional-bio.md\`
Example: \`${developerName
		.toLowerCase()
		.replace(/\s+/g, "-")}-professional-bio.md\`

${
	options.additionalInstructions
		? `\n## Additional Instructions\n${options.additionalInstructions}\n`
		: ""
}

## Success Criteria
The resulting biography should enable readers to:
1. Immediately understand the developer's technical competence and professional value
2. Recognize their leadership potential and collaborative approach
3. Appreciate their problem-solving abilities and business impact
4. Feel confident in their ability to handle complex client challenges
5. See clear evidence of professional growth and future potential
6. Connect with their authentic professional identity and approach to work

## CRITICAL CONSISTENCY REQUIREMENTS

**The format, structure, and organization of all professional biographies must be CONSISTENT across developers.** This means:

1. **Consistent paragraph structure** - Same organizational flow and logical progression
2. **Uniform length requirements** - All biographies stay within 200-400 word range
3. **Identical formatting standards** - Same emphasis patterns, bullet points, and styling
4. **Consistent file naming** - Follow exact naming convention for all outputs
5. **Same professional tone** - Maintain identical voice and approach across all biographies

Any deviation from the established biography format and standards is considered a critical error. When generating biographies, ensure complete consistency in structure, length, tone, and formatting. The goal is to create a collection of professional biographies that maintain uniform quality and presentation standards.

This framework ensures consistent, compelling biographies that effectively showcase technical expertise while remaining accessible to diverse audiences in a custom software consultancy environment.${
		options.voiceSignature
			? `

## FINAL OVERRIDE - AUTHENTIC VOICE (MOST IMPORTANT)

#### Writing Style & Voice Guidelines
${getVoiceGuidelines(options.voiceStyle || "authentic")}

**CRITICAL: Before writing, read this voice signature and write in ${developerName}'s authentic style:**

${options.voiceSignature}

**FINAL INSTRUCTIONS - OVERRIDE ALL PREVIOUS GUIDELINES:**
- Write as if ${developerName} personally wrote this bio in their own voice
- Use their natural conversational style and personality markers from above
- Ignore corporate language - this should sound human and authentic
- Channel their characteristic way of thinking and expressing ideas
- Make it feel like they're talking to a colleague, not writing a corporate bio

Write the biography now in ${developerName}'s authentic voice.`
			: ""
	}`;
}

// ===== Main generation function =====
async function generateBio(
	developerName: string,
	projectSummaryPathsOrDirectory: string | string[],
	options: {
		experienceLevel?: string;
		careerAspirations?: string;
		personalDescription?: string;
		voiceStyle?: "professional" | "personable" | "authentic";
		outputDir?: string;
		additionalInstructions?: string;
		maxSummaries?: number;
		useVoiceAnalysis?: boolean;
		refreshVoiceCache?: boolean;
		fallbackVoiceStyle?: "professional" | "personable" | "authentic";
		voiceSignature?: string;
	} = {}
): Promise<void> {
	try {
		// Determine if we have a directory or file paths
		let summaryPaths: string[];

		if (typeof projectSummaryPathsOrDirectory === "string") {
			// Single string - check if it's a directory or file
			if (existsSync(projectSummaryPathsOrDirectory)) {
				const stats = await stat(projectSummaryPathsOrDirectory);
				if (stats.isDirectory()) {
					console.log(
						`📁 Discovering summaries in directory: ${projectSummaryPathsOrDirectory}`
					);
					const allSummaries = await discoverProjectSummaries(
						projectSummaryPathsOrDirectory
					);
					summaryPaths = selectRandomSummaries(
						allSummaries,
						options.maxSummaries || 3
					);
				} else {
					// Single file
					summaryPaths = [projectSummaryPathsOrDirectory];
				}
			} else {
				throw new Error(
					`Path does not exist: ${projectSummaryPathsOrDirectory}`
				);
			}
		} else {
			// Array of file paths
			summaryPaths = projectSummaryPathsOrDirectory;
		}

		// Load project summaries
		console.log(`📊 Loading project summaries for ${developerName}...`);
		const projectSummaries = await loadProjectSummaries(summaryPaths);

		// Auto-discover Strengths data
		const strengthsData = await loadStrengthsData();

		// Handle voice analysis if requested
		let voiceSignature: string | undefined = options.voiceSignature;
		let finalVoiceStyle =
			options.voiceStyle || options.fallbackVoiceStyle || "authentic";

		if (options.useVoiceAnalysis && !voiceSignature) {
			const { getVoiceAnalysis } = await import("../lib/voiceHelper.js");
			try {
				const voiceResult = await getVoiceAnalysis(
					developerName,
					options.refreshVoiceCache
				);
				if (voiceResult.success) {
					voiceSignature = voiceResult.voiceSignature;
					console.log(
						`✅ Voice analysis ${
							voiceResult.fromCache ? "loaded from cache" : "completed"
						}`
					);
				} else {
					console.warn(
						"⚠️ Voice analysis failed - using manual voice style selection"
					);
					finalVoiceStyle =
						options.fallbackVoiceStyle || options.voiceStyle || "authentic";
				}
			} catch (err) {
				console.warn(
					`⚠️ Voice analysis error: ${
						err instanceof Error ? err.message : String(err)
					}`
				);
				console.warn("   Using manual voice style selection");
				finalVoiceStyle =
					options.fallbackVoiceStyle || options.voiceStyle || "authentic";
			}
		}

		// Generate biography prompt using original format
		console.log("🎨 Creating biography generation prompt...");
		const prompt = createBiographyPrompt(developerName, projectSummaries, {
			...options,
			voiceStyle: finalVoiceStyle,
			voiceSignature: voiceSignature,
			strengthsData: strengthsData || undefined,
		});
		const provider = getCurrentProvider();

		console.log(`🤖 Using AI provider: ${provider.toUpperCase()}`);
		if (provider !== "local") {
			console.log(
				"📡 Sending request to AI service... (this may take a moment)"
			);
		}

		// Try to generate with AI - if local mode, will return null
		const aiResult = await generateAIText(prompt, "bio");

		if (aiResult === null) {
			// === LOCAL MODE - PROMPT GENERATION ===
			console.log("\n🎯 Local mode: Generated Biography Prompt");
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log(prompt);
			console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
			console.log("\n📋 Copy the above prompt and paste it into your AI tool!");

			// Save prompt to locally-generated-prompts directory
			const promptFileName = `${developerName
				.toLowerCase()
				.replace(/\s+/g, "-")}-biography-prompt.md`;
			const promptFilePath = `locally-generated-prompts/${promptFileName}`;
			await Bun.write(promptFilePath, prompt);

			console.log(`✅ Prompt saved to: ${promptFilePath}`);
		} else {
			// === AI MODE ===
			console.log(`🤖 Biography completed with ${provider}!`);

			const outputFileName = `${developerName
				.toLowerCase()
				.replace(/\s+/g, "-")}-professional-bio.md`;
			const outputBaseDir = options.outputDir || "professional-bios";
			const outputFilePath = `${outputBaseDir}/${outputFileName}`;

			// Ensure output directory exists
			await Bun.write(outputFilePath, aiResult);

			console.log(`📄 Professional biography saved to: ${outputFilePath}`);

			// Validate word count
			const wordCount = aiResult.split(/\s+/).length;
			if (wordCount < 200 || wordCount > 400) {
				console.warn(
					`⚠️  Word count (${wordCount}) is outside recommended range (200-400 words)`
				);
			} else {
				console.log(`✅ Word count: ${wordCount} words (within 200-400 range)`);
			}
		}
	} catch (error) {
		console.error("💥 Biography generation failed:", error);
		throw error;
	}
}

// ===== CLI Interface =====
async function main() {
	const args = process.argv.slice(2);

	// Setup graceful exit handling
	setupGracefulExit();

	if (args.length < 2) {
		console.error(
			"Usage: bun run scripts/generateBio.ts <developer-name> <directory-or-files> [options]"
		);
		console.error("");
		console.error("Arguments:");
		console.error("  <developer-name>              Full name of the developer");
		console.error(
			"  <directory-or-files>          Directory path OR individual file paths"
		);
		console.error("");
		console.error("Options:");
		console.error("  --experience-level <level>    Experience level");
		console.error("  --aspirations <text>          Career aspirations");
		console.error("  --description <text>          Personal description");
		console.error(
			"  --voice-style <style>         Voice style (professional/personable/authentic)"
		);
		console.error("  --output-dir <path>           Output directory override");
		console.error("  --instructions <text>         Additional instructions");
		console.error(
			"  --max-summaries <number>      Max summaries to use (default: 3)"
		);
		console.error("");
		console.error(
			"Note: StrengthsFinder themes are auto-discovered from resources/strengths/ directory"
		);
		console.error("");
		console.error("Examples:");
		console.error("  # Directory usage (recommended):");
		console.error(
			'  bun run scripts/generateBio.ts "Jacob Williams" "project-experience-summaries"'
		);
		console.error("  # Individual files:");
		console.error(
			'  bun run scripts/generateBio.ts "Jacob Williams" "summary1.md" "summary2.md"'
		);
		console.error("  # With additional context:");
		console.error(
			'  bun run scripts/generateBio.ts "Developer" "summaries/" --experience-level "Senior Developer" --max-summaries 3'
		);
		console.error("");
		console.error(
			'Note: Use "bun run configure-ai" to set AI provider (openai/claude/local)'
		);
		process.exit(1);
	}

	const [developerName, ...remainingArgs] = args;
	const projectSummaryPaths: string[] = [];
	const options: Parameters<typeof generateBio>[2] = {};

	// Parse arguments - collect file/directory paths until we hit an option flag
	let i = 0;
	while (i < remainingArgs.length && !remainingArgs[i]!.startsWith("--")) {
		projectSummaryPaths.push(remainingArgs[i]!);
		i++;
	}

	// Parse option flags
	while (i < remainingArgs.length) {
		const flag = remainingArgs[i];
		const value = remainingArgs[i + 1];

		switch (flag) {
			case "--experience-level":
				options.experienceLevel = value;
				i += 2;
				break;
			case "--aspirations":
				options.careerAspirations = value;
				i += 2;
				break;
			case "--description":
				options.personalDescription = value;
				i += 2;
				break;
			case "--voice-style":
				if (
					value &&
					["professional", "personable", "authentic"].includes(value)
				) {
					options.voiceStyle = value as
						| "professional"
						| "personable"
						| "authentic";
				}
				i += 2;
				break;
			case "--output-dir":
				options.outputDir = value;
				i += 2;
				break;
			case "--instructions":
				options.additionalInstructions = value;
				i += 2;
				break;
			case "--max-summaries":
				if (value) {
					options.maxSummaries = parseInt(value, 10);
					if (isNaN(options.maxSummaries) || options.maxSummaries < 1) {
						console.error("Error: --max-summaries must be a positive number");
						process.exit(1);
					}
				}
				i += 2;
				break;
			default:
				console.error(`Unknown option: ${flag}`);
				process.exit(1);
		}
	}

	if (projectSummaryPaths.length === 0) {
		console.error(
			"Error: At least one project summary file or directory must be provided"
		);
		process.exit(1);
	}

	// If we have a single path, pass it as a string; otherwise pass as array
	const pathsOrDirectory =
		projectSummaryPaths.length === 1
			? projectSummaryPaths[0]!
			: projectSummaryPaths;
	await generateBio(developerName!, pathsOrDirectory, options);
}

if (import.meta.main) {
	main();
}

export { generateBio };
