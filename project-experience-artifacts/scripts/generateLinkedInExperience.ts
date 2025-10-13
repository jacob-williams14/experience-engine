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
 * Extract key content sections for LinkedIn optimization
 * Focus on achievements, impact, and technical highlights
 */
function extractLinkedInHighlights(content: string): string {
	const lines = content.split('\n');
	const highlights: string[] = [];
	let currentSection = '';
	let captureMode: 'overview' | 'impact' | 'skills' | 'architecture' | 'none' = 'none';
	let sectionContent: string[] = [];
	let bulletCount = 0;
	
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
	highlights.push(''); // Add spacing
	
	for (const line of lines) {
		const trimmedLine = line.trim();
		
		// Project Overview - capture full section
		if (line.startsWith('## Project Overview')) {
			if (captureMode !== 'none' && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}
			sectionContent = [line];
			captureMode = 'overview';
			continue;
		}
		
		// Project Impact - key for LinkedIn
		if (line.startsWith('## Project Impact') || line.startsWith('## Business Impact')) {
			if (captureMode !== 'none' && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}
			sectionContent = [line];
			captureMode = 'impact';
			bulletCount = 0;
			continue;
		}
		
		// Technical Architecture - show technical depth
		if (line.startsWith('## Technical Architecture') || line.startsWith('## Architecture')) {
			if (captureMode !== 'none' && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}
			sectionContent = [line];
			captureMode = 'architecture';
			bulletCount = 0;
			continue;
		}
		
		// Skills - condensed version
		if (line.startsWith('## Skills Demonstrated')) {
			if (captureMode !== 'none' && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}
			sectionContent = [line];
			captureMode = 'skills';
			continue;
		}
		
		// Stop capturing detailed sections we don't need
		if (line.startsWith('##') && 
			!line.includes('Project Overview') && 
			!line.includes('Project Impact') && 
			!line.includes('Business Impact') && 
			!line.includes('Technical Architecture') &&
			!line.includes('Architecture') &&
			!line.includes('Skills Demonstrated')) {
			if (captureMode !== 'none' && sectionContent.length > 0) {
				highlights.push(sectionContent.join('\n'));
			}
			captureMode = 'none';
			sectionContent = [];
			continue;
		}
		
		// Capture content based on current mode
		if (captureMode === 'overview') {
			sectionContent.push(line);
		} else if (captureMode === 'impact') {
			// Limit bullets in impact section
			if (line.startsWith('- ') || line.startsWith('* ')) {
				if (bulletCount < 4) {
					sectionContent.push(line);
					bulletCount++;
				}
			} else {
				sectionContent.push(line);
			}
		} else if (captureMode === 'architecture') {
			// Limit architecture details
			if (line.startsWith('- ') || line.startsWith('* ')) {
				if (bulletCount < 3) {
					sectionContent.push(line);
					bulletCount++;
				}
			} else {
				sectionContent.push(line);
			}
		} else if (captureMode === 'skills') {
			// Only capture the summary sections, not detailed lists
			if (line.startsWith('### ') && line.includes('Skills')) {
				sectionContent.push(line);
			} else if (line.startsWith('- ') && sectionContent[sectionContent.length - 1]?.startsWith('### ')) {
				// Only capture first few items after each skills header
				sectionContent.push(line);
			}
		}
	}
	
	// Don't forget the last section
	if (captureMode !== 'none' && sectionContent.length > 0) {
		highlights.push(sectionContent.join('\n'));
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
	const roleContext = {
		'senior-engineer': 'Senior Software Engineer roles at top tech companies',
		'staff-engineer': 'Staff Engineer roles requiring technical leadership and architectural thinking',
		'principal-engineer': 'Principal Engineer roles focused on technical strategy and system design',
		'eng-manager': 'Engineering Manager roles requiring people leadership and technical oversight',
		'tech-lead': 'Technical Lead roles with both IC contributions and team guidance',
		'full-stack': 'Full-Stack Developer roles requiring end-to-end development capabilities',
	}[options.roleContext] || 'Senior Software Engineer roles';

	const companyContext = {
		'big-tech': 'big tech companies (Google, Meta, Apple, Amazon, etc.) - emphasize scale, performance, and system design',
		'startup': 'high-growth startups - emphasize speed, impact, and ownership',
		'enterprise': 'enterprise companies - emphasize reliability, integration, and business value',
		'mid-startup': 'mid-stage startups - emphasize growth scaling and technical maturity',
		'general': 'various tech companies - balance technical depth with business impact',
	}[options.companyContext] || 'various tech companies';

	const metricsEmphasis = options.emphasizeMetrics 
		? 'ONLY include metrics, numbers, or performance data that are explicitly mentioned in the project summary. DO NOT invent or estimate any numbers, percentages, user counts, or performance metrics.' 
		: 'Focus on qualitative achievements and technical accomplishments without any numbers or metrics.';

	const techEmphasis = options.includeTechnologies 
		? 'Naturally integrate specific technologies, frameworks, and tools into the descriptions.' 
		: 'Focus more on achievements and impact rather than specific technologies.';

	return `You are a senior technical recruiter at a top-tier tech company specializing in identifying exceptional engineering talent for ${roleContext}. You need to convert this comprehensive project summary into LinkedIn Experience section content that will immediately catch the attention of recruiters at ${companyContext}.

CRITICAL REQUIREMENTS FOR LINKEDIN EXPERIENCE:
- Create exactly 2-4 concise bullet points (total 150-300 words)
- Each bullet point should be 1-2 lines maximum
- Use strong action verbs (Architected, Led, Delivered, Optimized, Built, Scaled)
- Focus on technical achievements and business impact
- Show progression: Challenge → Technical Solution → Business Impact
- Make it scannable for time-pressed recruiters

CRITICAL: NEVER INVENT METRICS OR NUMBERS
- DO NOT include any percentages, user counts, performance metrics, or statistics unless they are explicitly stated in the source material
- DO NOT estimate or guess at any quantitative measures
- Focus on qualitative achievements and technical depth instead
- If no specific metrics are provided, emphasize the scope, complexity, and technical sophistication of the work

TONE AND STYLE:
- Professional and confident, not boastful
- Achievement-focused with concrete results
- Technical depth without overwhelming detail
- Demonstrate ownership and initiative

CONTENT FOCUS:
- Technical challenges solved and how
- Business impact and value delivered
- Leadership and collaboration aspects
- Innovation and technical excellence
${metricsEmphasis}
${techEmphasis}

TARGET AUDIENCE: ${companyContext.charAt(0).toUpperCase() + companyContext.slice(1)} recruiters, hiring managers, and technical leaders looking for ${roleContext.toLowerCase()}.

PROJECT SUMMARY TO CONVERT:
${projectHighlights}

Generate LinkedIn Experience bullet points that make ${options.developerName} stand out for ${roleContext} positions. Focus on the most impressive and relevant achievements for this role level and company type.

IMPORTANT: Return only the bullet points, formatted with • symbols, ready to copy/paste into LinkedIn.`;
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
		const linkedInContent = linkedInResult;
		
		// Create output file
		const outputPath = `linkedin-experience/${projectName}-linkedin-experience.md`;
		
		const formattedOutput = `# ${projectName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} - LinkedIn Experience

**Developer:** ${options.developerName}  
**Target Role:** ${options.roleContext}  
**Target Company Type:** ${options.companyContext}  
**Generated:** ${new Date().toISOString().split('T')[0]}

## LinkedIn Experience Section Content

${linkedInContent}

---

**Usage Instructions:**
1. Copy the bullet points above
2. Paste into your LinkedIn Experience section for this project/role
3. Adjust company name and dates as needed

**Optimization Focus:**
- Role: ${options.roleContext}
- Companies: ${options.companyContext}
- Metrics: ${options.emphasizeMetrics ? 'Emphasized' : 'De-emphasized'}
- Technologies: ${options.includeTechnologies ? 'Included' : 'Minimized'}

*Generated from: ${options.projectSummaryPath}*  
*AI Provider: ${getCurrentProvider()}*`;

		// Write the file
		await Bun.write(outputPath, formattedOutput);

		console.log('\n✅ LinkedIn Experience content generated successfully!');
		console.log(`📁 Saved to: ${outputPath}`);
		
		console.log('\n📋 Generated Content:');
		console.log('─'.repeat(60));
		console.log(linkedInContent);
		console.log('─'.repeat(60));
		
		console.log(`\n💡 This content is optimized for ${options.roleContext} roles at ${options.companyContext} companies.`);
		console.log('📋 Ready to copy/paste into your LinkedIn Experience section!');

		if (options.interactive) {
			console.log('\n🔗 Next Steps:');
			console.log('   • Review and customize the content for your specific situation');
			console.log('   • Add company name and employment dates');
			console.log('   • Consider generating content for other projects');
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