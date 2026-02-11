#!/usr/bin/env bun

/**
 * Atomic Object LinkedIn Experience Synthesizer
 * Combines per-project LinkedIn artifacts into a single cohesive Experience entry
 * organized by themes — technical leadership, cross-domain adaptability, growth arc.
 */

import { existsSync, mkdirSync } from "fs";
import { getConfigStatus } from "./lib/aiConfig.js";
import {
	generateAtomicExperience,
	discoverLinkedInFiles,
} from "./scripts/generateAtomicExperience.js";
import { setupCLI, promptInput, promptSelect, promptConfirm } from "./lib/cliUtils.js";

/**
 * Interactive mode
 */
async function runInteractive() {
	console.log("💼 Atomic Object LinkedIn Experience Synthesizer");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		"🎯 Synthesize per-project LinkedIn bullets into a single cohesive Experience entry."
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
	console.log("");

	// Developer name
	const developerName = await promptInput("Developer full name");

	// Discover available per-project LinkedIn files
	const availableFiles = await discoverLinkedInFiles();

	if (availableFiles.length === 0) {
		console.log("\n⚠️  No per-project LinkedIn files found in linkedin-experience/");
		console.log("   Run generateLinkedInExperience.ts for each project first.");
		process.exit(1);
	}

	console.log(`\n📄 Found ${availableFiles.length} per-project LinkedIn files:`);
	for (const file of availableFiles) {
		console.log(`   • ${file.split('/').pop()}`);
	}

	const useAll = await promptConfirm(
		`Use all ${availableFiles.length} files?`,
		true
	);

	let selectedFiles: string[];
	if (useAll) {
		selectedFiles = availableFiles;
	} else {
		// Let user pick individually
		selectedFiles = [];
		for (const file of availableFiles) {
			const include = await promptConfirm(
				`Include ${file.split('/').pop()}?`,
				true
			);
			if (include) {
				selectedFiles.push(file);
			}
		}
		if (selectedFiles.length === 0) {
			console.log("\n⚠️  No files selected. Exiting.");
			process.exit(1);
		}
	}

	console.log("");
	console.log("🎯 Target Position Context:");
	const roleContext = await promptSelect(
		"What type of role are you targeting?",
		[
			{ name: "Technical Lead", value: "tech-lead", description: "Technical leadership within team" },
			{ name: "Senior Software Engineer", value: "senior-engineer", description: "IC roles at tech companies" },
			{ name: "Staff Engineer", value: "staff-engineer", description: "Senior IC roles with technical leadership" },
			{ name: "Principal Engineer", value: "principal-engineer", description: "Technical leadership and architecture" },
			{ name: "Engineering Manager", value: "eng-manager", description: "People management and team leadership" },
			{ name: "Full-Stack Developer", value: "full-stack", description: "General full-stack development roles" },
		]
	);

	const companyContext = await promptSelect(
		"Target company type?",
		[
			{ name: "General Tech Companies", value: "general", description: "Broad tech industry appeal" },
			{ name: "Big Tech (FAANG+)", value: "big-tech", description: "Google, Meta, Apple, Amazon, etc." },
			{ name: "High-Growth Startup", value: "startup", description: "Fast-moving, high-impact environments" },
			{ name: "Enterprise/Fortune 500", value: "enterprise", description: "Large established companies" },
			{ name: "Mid-Stage Startup", value: "mid-startup", description: "Series B+ companies" },
		]
	);

	const experienceYears = await promptInput(
		"How long at Atomic Object? (e.g., 'nearly 4 years')",
		"nearly 4 years"
	);

	const growthArc = await promptInput(
		"Describe your growth arc (e.g., 'IC developer → co-technical lead')",
		"Individual contributor developer progressing to co-technical lead"
	);

	await generateAtomicExperience({
		developerName,
		linkedInSourcePaths: selectedFiles,
		roleContext,
		companyContext,
		experienceYears,
		growthArc,
		interactive: true,
	});
}

/**
 * CLI argument parsing
 */
function parseArgs() {
	const args = process.argv.slice(2);

	if (args.includes('--help') || args.includes('-h')) {
		showHelp();
		process.exit(0);
	}

	const options: any = {
		interactive: args.length === 0,
		linkedInSourcePaths: [] as string[],
	};

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		if (arg === '--developer' || arg === '--name') {
			options.developerName = args[++i];
		} else if (arg === '--role-context' || arg === '--role') {
			options.roleContext = args[++i];
		} else if (arg === '--company-context' || arg === '--company') {
			options.companyContext = args[++i];
		} else if (arg === '--experience-years' || arg === '--years') {
			options.experienceYears = args[++i];
		} else if (arg === '--growth-arc' || arg === '--growth') {
			options.growthArc = args[++i];
		} else if (arg === '--all') {
			options.useAll = true;
		} else if (arg && !arg.startsWith('--')) {
			options.linkedInSourcePaths.push(arg);
		}
	}

	return options;
}

function showHelp(): void {
	console.log(`
💼 Atomic Object LinkedIn Experience Synthesizer

Combines per-project LinkedIn artifacts into a single cohesive LinkedIn Experience
entry organized by themes rather than individual projects.

USAGE:
  bun run generateAtomicExperience.ts [options]

INTERACTIVE MODE (recommended):
  bun run generateAtomicExperience.ts

COMMAND LINE MODE:
  bun run generateAtomicExperience.ts --all \\
    --developer "Jacob Williams" \\
    --role-context "tech-lead" \\
    --company-context "general" \\
    --experience-years "nearly 4 years" \\
    --growth-arc "IC developer → co-technical lead"

OPTIONS:
  --developer, --name       Developer name
  --role-context            Target role (tech-lead, senior-engineer, staff-engineer, etc.)
  --company-context         Target company type (general, big-tech, startup, etc.)
  --experience-years        Tenure at Atomic Object
  --growth-arc              Career progression description
  --all                     Use all files in linkedin-experience/
  --help, -h                Show this help

PREREQUISITE:
  Run generateLinkedInExperience.ts for each project first to create per-project files.

OUTPUT: linkedin-experience/{developer}-atomic-object-experience.md
`);
}

/**
 * Main execution
 */
async function main() {
	setupCLI();

	if (!existsSync('linkedin-experience')) {
		mkdirSync('linkedin-experience', { recursive: true });
	}

	const options = parseArgs();

	if (options.interactive) {
		await runInteractive();
	} else {
		// CLI mode: resolve --all flag
		if (options.useAll) {
			options.linkedInSourcePaths = await discoverLinkedInFiles();
		}
		await generateAtomicExperience(options);
	}

	process.exit(0);
}

if (import.meta.main) {
	main().catch((error) => {
		console.error('Error:', error);
		process.exit(1);
	});
}
