#!/usr/bin/env bun

/**
 * LinkedIn Experience Generator
 * Converts comprehensive project summaries into concise LinkedIn Experience section content
 * Optimized for big tech recruiters, startup founders, and industry leaders
 */

import { existsSync, mkdirSync } from "fs";
import { readdir } from "fs/promises";
import { getConfigStatus } from "./lib/aiConfig.js";
import { generateLinkedInExperience } from "./scripts/generateLinkedInExperience.js";
import { setupCLI, promptInput, promptConfirm, promptSelect } from "./lib/cliUtils.js";

/**
 * Get available project summary files from project-experience-summaries directory
 */
async function getProjectSummaries(): Promise<
	Array<{ name: string; value: string; description?: string }>
> {
	const choices: Array<{ name: string; value: string; description?: string }> = [];

	// Scan project-experience-summaries directory for all relevant files
	if (existsSync("project-experience-summaries/")) {
		try {
			const files = await readdir("project-experience-summaries/");

			// Sort files alphabetically for consistent ordering
			files.sort();

			for (const file of files) {
				if (file.endsWith(".md")) {
					const fullPath = `project-experience-summaries/${file}`;
					choices.push({
						name: `📄 ${file}`,
						value: fullPath,
						description: "Project summary file",
					});
				}
			}
		} catch {
			// Ignore errors reading directory
		}
	}

	// Add manual entry option
	choices.push({
		name: "✏️  Enter custom path...",
		value: "__custom__",
		description: "Type a custom file path",
	});

	return choices;
}

/**
 * Interactive mode - prompt user for all inputs
 */
async function runInteractive() {
	console.log("💼 LinkedIn Experience Generator");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		"🎯 Convert your comprehensive project summaries into concise LinkedIn Experience content."
	);
	console.log(
		"📈 Optimized for big tech recruiters, startup founders, and industry leaders."
	);
	console.log("");

	// Show current AI configuration
	const aiStatus = getConfigStatus();
	console.log("🔧 Current AI Configuration:");
	console.log(
		`   Provider: ${aiStatus.currentProvider.toUpperCase()} ${
			aiStatus.isConfigured ? "✅" : "❌"
		}`
	);
	if (aiStatus.availableProviders.length > 1) {
		console.log(`   Available: ${aiStatus.availableProviders.join(", ")}`);
	}
	console.log(
		'   Use "bun run configure-ai" to change provider or check status'
	);
	console.log("");

	// Required inputs
	console.log("📋 Required Information:");
	const developerName = await promptInput("Developer full name");
	
	// Project summary selection
	const choices = await getProjectSummaries();
	const summaryChoices = choices.filter(choice => choice.value !== "__custom__");
	
	let projectSummaryPath: string;
	
	if (summaryChoices.length === 0) {
		console.log("⚠️  No project summaries found in project-experience-summaries/");
		projectSummaryPath = await promptInput("Enter path to a project summary file:");
	} else {
		const selectedChoice = await promptSelect(
			"Select project summary to convert:",
			choices
		);
		
		if (selectedChoice === "__custom__") {
			projectSummaryPath = await promptInput("Enter custom file path:");
		} else {
			projectSummaryPath = selectedChoice;
		}
	}

	console.log("");
	console.log("🎯 Target Position Context:");
	const roleContext = await promptSelect(
		"What type of role are you targeting?",
		[
			{ name: "Senior Software Engineer", value: "senior-engineer", description: "IC roles at big tech companies" },
			{ name: "Staff Engineer", value: "staff-engineer", description: "Senior IC roles with technical leadership" },
			{ name: "Principal Engineer", value: "principal-engineer", description: "Technical leadership and architecture" },
			{ name: "Engineering Manager", value: "eng-manager", description: "People management and team leadership" },
			{ name: "Technical Lead", value: "tech-lead", description: "Technical leadership within team" },
			{ name: "Full-Stack Developer", value: "full-stack", description: "General full-stack development roles" },
		]
	);

	const companyContext = await promptSelect(
		"Target company type (affects tone and emphasis)?",
		[
			{ name: "Big Tech (FAANG+)", value: "big-tech", description: "Google, Meta, Apple, Amazon, etc." },
			{ name: "High-Growth Startup", value: "startup", description: "Fast-moving, high-impact environments" },
			{ name: "Enterprise/Fortune 500", value: "enterprise", description: "Large established companies" },
			{ name: "Mid-Stage Startup", value: "mid-startup", description: "Series B+ companies" },
			{ name: "General Tech Companies", value: "general", description: "Broad tech industry appeal" },
		]
	);

	console.log("");
	console.log("🎨 Content Optimization:");
	const emphasizeMetrics = await promptConfirm(
		"Emphasize quantifiable metrics and scale (recommended for big tech)?",
		true
	);

	const includeTechnologies = await promptConfirm(
		"Include specific technologies and frameworks in the content?",
		true
	);

	// Call the generation script
	await generateLinkedInExperience({
		developerName,
		projectSummaryPath,
		roleContext,
		companyContext,
		emphasizeMetrics,
		includeTechnologies,
		interactive: true,
	});
}

/**
 * CLI argument parsing for non-interactive usage
 */
function parseArgs() {
	const args = process.argv.slice(2);
	
	// Show help
	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		process.exit(0);
	}
	
	// Basic parsing for direct execution
	const options: any = {
		interactive: false,
	};
	
	for (let i = 0; i < args.length; i++) {
		const arg = args[i];
		
		if (arg === '--developer' || arg === '--name') {
			options.developerName = args[++i];
		} else if (arg === '--project' || arg === '--summary') {
			options.projectSummaryPath = args[++i];
		} else if (arg === '--role-context') {
			options.roleContext = args[++i];
		} else if (arg === '--company-context') {
			options.companyContext = args[++i];
		} else if (arg === '--no-metrics') {
			options.emphasizeMetrics = false;
		} else if (arg === '--no-tech') {
			options.includeTechnologies = false;
		} else if (arg && !arg.startsWith('--')) {
			// Assume first non-flag argument is project summary path
			if (!options.projectSummaryPath) {
				options.projectSummaryPath = arg;
			}
		}
	}
	
	return options;
}

/**
 * Show command line help
 */
function showHelp(): void {
	console.log(`
💼 LinkedIn Experience Generator

Converts comprehensive project summaries into concise LinkedIn Experience section 
content optimized for big tech recruiters and industry leaders.

USAGE:
  bun run generateLinkedInExperience.ts [options]

INTERACTIVE MODE:
  bun run generateLinkedInExperience.ts
  (Recommended - guides you through all options)

COMMAND LINE MODE:
  bun run generateLinkedInExperience.ts "project-experience-summaries/root-compass-project-summary.md" \\
    --developer "Jacob Williams" \\
    --role-context "senior-engineer" \\
    --company-context "big-tech"

OPTIONS:
  --developer, --name          Developer name
  --project, --summary         Path to project summary file
  --role-context              Target role type (senior-engineer, staff-engineer, tech-lead, etc.)
  --company-context           Target company type (big-tech, startup, enterprise, etc.)
  --no-metrics                Skip emphasis on quantifiable metrics
  --no-tech                   Skip specific technology mentions
  --help, -h                  Show this help

EXAMPLES:
  # Interactive mode (recommended)
  bun run generateLinkedInExperience.ts

  # Generate for specific project with full context
  bun run generateLinkedInExperience.ts \\
    "project-experience-summaries/biggby-mobile-app-project-summary.md" \\
    --developer "Jacob Williams" \\
    --role-context "staff-engineer" \\
    --company-context "big-tech"

TARGET AUDIENCE: Big tech recruiters, startup founders, VPs of Engineering, CTOs
OUTPUT FORMAT: 2-4 concise, impactful bullet points per project (150-300 words)
OUTPUT LOCATION: linkedin-experience/
`);
}

/**
 * Main execution flow
 */
async function main() {
	// Set up CLI utilities (graceful exit, etc.)
	setupCLI();

	// Ensure output directory exists
	if (!existsSync('linkedin-experience')) {
		mkdirSync('linkedin-experience', { recursive: true });
	}

	const options = parseArgs();
	
	if (options.interactive !== false) {
		// Run interactive mode
		await runInteractive();
	} else {
		// Run with CLI arguments
		await generateLinkedInExperience(options);
	}
	
	// Exit successfully
	process.exit(0);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});
}