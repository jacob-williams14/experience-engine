#!/usr/bin/env bun

/**
 * LinkedIn Experience Generation Script
 * Creates concise LinkedIn Experience section content from comprehensive project summaries
 * Optimized for big tech recruiters and industry leaders
 */

import { existsSync } from "fs";
import { generateAIText } from "../lib/ai.js";
import { getCurrentProvider } from "../lib/aiConfig.js";
import { setupGracefulExit } from "../lib/cliUtils.js";

interface LinkedInExperienceOptions {
	developerName: string;
	projectSummaryPath: string;
	roleContext: string;
	companyContext: string;
	emphasizeMetrics?: boolean;
	includeTechnologies?: boolean;
	interactive?: boolean;
}

/**
 * Extract project header information for context
 */
function extractProjectHeader(content: string) {
	const lines = content.split('\n');
	const header: Record<string, string> = {};
	
	for (let i = 0; i < Math.min(20, lines.length); i++) {
		const line = lines[i];
		if (line && line.startsWith('**Project Duration:**')) {
			header.duration = line.replace('**Project Duration:**', '').trim();
		}
		if (line && line.startsWith('**Role:**')) {
			header.role = line.replace('**Role:**', '').trim();
		}
		if (line && line.startsWith('**Technology Stack:**')) {
			header.technologies = line.replace('**Technology Stack:**', '').trim();
		}
		if (line && line.startsWith('# ')) {
			header.projectName = line.replace('# ', '').replace(' Project Summary', '').trim();
		}
	}
	
	return header;
}

/**
 * Extract rich context from project summary for LinkedIn generation.
 * Captures the full narrative — overview, leadership, impact, and architecture —
 * so the prompt has enough material to identify what's distinct about this project.
 */
function extractLinkedInHighlights(content: string): string {
	const lines = content.split('\n');
	const highlights: string[] = [];

	// Add project header
	const header = extractProjectHeader(content);
	if (header.projectName) {
		highlights.push(`# ${header.projectName}`);
	}
	if (header.role) {
		highlights.push(`**Role:** ${header.role}`);
	}
	if (header.duration) {
		highlights.push(`**Duration:** ${header.duration}`);
	}
	if (header.technologies) {
		highlights.push(`**Key Technologies:** ${header.technologies}`);
	}
	highlights.push('');

	// Capture sections that matter for LinkedIn — overview, leadership, impact, architecture
	// Skip granular feature lists and skills inventories
	const captureSections = new Set([
		'Project Overview',
		'Technical Architecture',
		'Architecture',
		'Technical Leadership',
		'Project Impact',
		'Business Impact',
	]);
	const skipSections = new Set([
		'Feature Development',
		'Quality Assurance',
		'Skills Demonstrated',
		'Testing',
	]);

	let capturing = false;
	let sectionContent: string[] = [];

	for (const line of lines) {
		// Detect ## section headers
		if (line.startsWith('## ')) {
			// Flush previous section
			if (capturing && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}

			// Decide whether to capture this section
			const sectionName = line.replace('## ', '').replace(/[*&]/g, '').trim();
			const shouldCapture = [...captureSections].some(s => sectionName.includes(s));
			const shouldSkip = [...skipSections].some(s => sectionName.includes(s));

			if (shouldCapture && !shouldSkip) {
				sectionContent = [line];
				capturing = true;
			} else {
				capturing = false;
				sectionContent = [];
			}
			continue;
		}

		if (capturing) {
			sectionContent.push(line);
		}
	}

	// Flush last section
	if (capturing && sectionContent.length > 0) {
		highlights.push(sectionContent.join('\n'));
	}

	// Capture the closing narrative paragraph if present (often contains growth arc)
	const lastParagraphLines: string[] = [];
	for (let i = lines.length - 1; i >= 0; i--) {
		const line = lines[i]!.trim();
		if (line === '') continue;
		if (line.startsWith('#') || line.startsWith('- ') || line.startsWith('* ')) break;
		lastParagraphLines.unshift(lines[i]!);
		// Only grab the final paragraph, not multiple
		if (lastParagraphLines.length >= 5) break;
	}
	if (lastParagraphLines.length > 0) {
		const lastParagraph = lastParagraphLines.join('\n').trim();
		// Avoid duplicating if already captured
		const existingContent = highlights.join('\n');
		if (lastParagraph.length > 80 && !existingContent.includes(lastParagraph.slice(0, 60))) {
			highlights.push(`\n## Growth & Trajectory\n${lastParagraph}`);
		}
	}

	return highlights.join('\n\n');
}

/**
 * Create LinkedIn-optimized prompt based on role and company context
 */
function createLinkedInPrompt(
	projectHighlights: string,
	options: LinkedInExperienceOptions
): string {
	const roleLens: Record<string, string> = {
		'senior-engineer': 'Emphasize depth of technical contribution, system design, and independent ownership of complex features.',
		'staff-engineer': 'Emphasize architectural decisions, cross-team influence, and technical strategy beyond individual features.',
		'principal-engineer': 'Emphasize technical vision, system-wide impact, and shaping engineering direction.',
		'eng-manager': 'Emphasize people leadership, team growth, process improvements, and delivery outcomes.',
		'tech-lead': 'Emphasize both hands-on technical work and leadership — mentoring, decision-making, stakeholder communication.',
		'full-stack': 'Emphasize breadth across the stack and ability to deliver end-to-end.',
	};

	const companyLens: Record<string, string> = {
		'big-tech': 'Lean toward scale, system design, and technical rigor.',
		'startup': 'Lean toward speed, ownership, wearing multiple hats, and shipping.',
		'enterprise': 'Lean toward reliability, integration complexity, and business value.',
		'mid-startup': 'Lean toward scaling systems and growing engineering maturity.',
		'general': 'Balance technical depth with business impact.',
	};

	const metricsGuidance = options.emphasizeMetrics
		? 'Include metrics ONLY if they appear verbatim in the source material. Never invent numbers.'
		: 'Omit metrics entirely. Focus on qualitative achievements.';

	const techGuidance = options.includeTechnologies
		? 'Name specific technologies where they add credibility (e.g., "React Native/Expo" not just "mobile framework").'
		: 'Minimize technology name-dropping. Focus on what was achieved, not what tools were used.';

	return `Convert this project summary into 3-5 LinkedIn Experience bullet points for ${options.developerName}.

These bullets are intermediate artifacts — they will later be synthesized into a single LinkedIn Experience entry for their consultancy role. So each bullet should capture what was DISTINCT about this specific project.

WHAT MAKES A GOOD BULLET:
- Leads with what made this project unique — the domain challenge, the role growth, or the specific technical problem
- Is specific enough that it could only describe THIS project, not any generic software project
- Surfaces role progression if present (e.g., stepping up from IC to tech lead mid-project)
- Names the domain concretely (e.g., "HIPAA-compliant clinical assessment tool for movement science practitioners" not "health evaluation platform")

WHAT TO AVOID:
- Generic openers like "Architected and implemented comprehensive X using Y" — every project can say this
- Listing multiple achievements in a single run-on bullet
- Vague domain descriptions ("enterprise platform", "complex system", "comprehensive application")
- Starting every bullet with the same verb pattern
- Any commentary, notes, or disclaimers after the bullets

ROLE LENS (${options.roleContext}):
${roleLens[options.roleContext] || roleLens['senior-engineer']}

COMPANY LENS (${options.companyContext}):
${companyLens[options.companyContext] || companyLens['general']}

METRICS: ${metricsGuidance}
TECHNOLOGIES: ${techGuidance}

PROJECT SUMMARY:
${projectHighlights}

Return ONLY the bullet points using • symbols. No headers, no notes, no commentary.`;
}

/**
 * Main LinkedIn Experience generation function
 */
export async function generateLinkedInExperience(options: LinkedInExperienceOptions): Promise<void> {
	try {
		setupGracefulExit();

		// Validate inputs
		if (!options.projectSummaryPath || !existsSync(options.projectSummaryPath)) {
			throw new Error(`Project summary file not found: ${options.projectSummaryPath}`);
		}

		if (!options.developerName) {
			throw new Error('Developer name is required');
		}

		// Set defaults
		options.emphasizeMetrics = options.emphasizeMetrics ?? true;
		options.includeTechnologies = options.includeTechnologies ?? true;

		console.log('\n🔄 Generating LinkedIn Experience content...');
		console.log(`📄 Processing: ${options.projectSummaryPath}`);
		console.log(`🎯 Target Role: ${options.roleContext}`);
		console.log(`🏢 Target Companies: ${options.companyContext}`);

		// Read and process project summary
		const projectContent = await Bun.file(options.projectSummaryPath).text();
		const projectHighlights = extractLinkedInHighlights(projectContent);

		console.log(`📊 Extracted ${projectHighlights.length} characters of key content for LinkedIn optimization`);

		// Generate LinkedIn content
		const linkedInPrompt = createLinkedInPrompt(projectHighlights, options);

		console.log('\n🤖 Generating LinkedIn Experience bullet points...');
		
		const linkedInResult = await generateAIText(linkedInPrompt, "concise");

		// Extract project name for filename
		const projectName = options.projectSummaryPath
			.split('/')
			.pop()
			?.replace('-project-summary.md', '')
			?.replace(/[^a-zA-Z0-9-]/g, '-') || 'project';

		if (linkedInResult === null) {
			// === LOCAL MODE - PROMPT GENERATION ===
			console.log('\n🎯 Local mode: Generated LinkedIn Experience Prompt');
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			console.log(linkedInPrompt);
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			console.log('\n📋 Copy the above prompt and paste it into your AI tool!');

			// Save prompt to locally-generated-prompts directory
			const promptFileName = `${projectName}-linkedin-experience-prompt.md`;
			const promptFilePath = `locally-generated-prompts/${promptFileName}`;
			await Bun.write(promptFilePath, linkedInPrompt);

			console.log(`✅ Prompt saved to: ${promptFilePath}`);
			return;
		}

		// === AI MODE ===
		// Strip any AI commentary/notes that appear after the bullets
		const linkedInContent = linkedInResult
			.replace(/\n\s*Note:.*$/s, '')
			.replace(/\n\s*\*Note:.*$/s, '')
			.trim();

		// Create output file
		const outputPath = `linkedin-experience/${projectName}-linkedin-experience.md`;

		const formattedOutput = `# ${projectName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - LinkedIn Experience

> Intermediate artifact for synthesis into a single LinkedIn Experience entry.
> Use \`generateAtomicExperience.ts\` to combine all per-project files.

**Developer:** ${options.developerName}
**Source:** ${options.projectSummaryPath}
**Generated:** ${new Date().toISOString().split('T')[0]}
**Role Lens:** ${options.roleContext} | **Company Lens:** ${options.companyContext}

---

${linkedInContent}

---

*AI Provider: ${getCurrentProvider()}*`;

		// Write the file
		await Bun.write(outputPath, formattedOutput);

		console.log('\n✅ Per-project LinkedIn content generated!');
		console.log(`📁 Saved to: ${outputPath}`);

		console.log('\n📋 Generated Content:');
		console.log('─'.repeat(60));
		console.log(linkedInContent);
		console.log('─'.repeat(60));

		if (options.interactive) {
			console.log('\n🔗 Next Steps:');
			console.log('   • Generate per-project content for your other projects');
			console.log('   • Then run generateAtomicExperience.ts to synthesize into a single LinkedIn entry');
		}

	} catch (error) {
		console.error('\n❌ Error generating LinkedIn Experience content:');
		if (error instanceof Error) {
			console.error(`   ${error.message}`);
		} else {
			console.error('   Unknown error occurred');
		}
		throw error;
	}
}