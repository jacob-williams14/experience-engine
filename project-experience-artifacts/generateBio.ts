#!/usr/bin/env bun

/**
 * Main Professional Biography Generator
 * Interactive pipeline: project summaries → professional biography
 */

import { checkbox, confirm, input, select } from "@inquirer/prompts";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { getConfigStatus } from "./lib/aiConfig.js";
import { generateBio } from "./scripts/generateBio.js";
import { setupCLI } from "./lib/cliUtils.js";

/**
 * Get available project summary files from project-experience-summaries directory
 */
async function getProjectSummaries(): Promise<
	Array<{ name: string; value: string; description?: string }>
> {
	const choices: Array<{ name: string; value: string; description?: string }> =
		[];

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
 * Randomly select up to 3 project summaries from available options
 */
function selectRandomSummaries(
	summaries: string[],
	maxCount: number = 3
): string[] {
	if (summaries.length <= maxCount) {
		return summaries; // Use all if maxCount or fewer
	}

	// Random selection of up to maxCount summaries
	const shuffled = [...summaries].sort(() => 0.5 - Math.random());
	return shuffled.slice(0, maxCount);
}

/**
 * Prompt for project summaries with multi-select and random selection
 */
async function promptForProjectSummaries(): Promise<string[]> {
	try {
		const choices = await getProjectSummaries();
		const summaryChoices = choices.filter(
			(choice) => choice.value !== "__custom__"
		);

		if (summaryChoices.length === 0) {
			console.log(
				"⚠️  No project summaries found in project-experience-summaries/"
			);
			const customPath = await input({
				message: "Enter path to a project summary file:",
			});
			return [customPath];
		}

		// Ask if user wants random selection or manual selection
		const useRandom = await confirm({
			message: `Found ${summaryChoices.length} project summaries. Use random selection (up to 3 files) for efficiency?`,
			default: true,
		});

		if (useRandom) {
			const randomSelection = selectRandomSummaries(
				summaryChoices.map((c) => c.value)
			);
			console.log(
				`📊 Randomly selected ${randomSelection.length} project summaries:`
			);
			randomSelection.forEach((path) => {
				const fileName = path.split("/").pop();
				console.log(`   • ${fileName}`);
			});
			return randomSelection;
		} else {
			// Manual multi-select
			const selected = await checkbox({
				message: "Select project summaries to include:",
				choices: summaryChoices,
				required: true,
			});

			// Handle custom paths
			const finalSelection: string[] = [];
			for (const selection of selected) {
				if (selection === "__custom__") {
					const customPath = await input({
						message: "Enter custom file path:",
					});
					finalSelection.push(customPath);
				} else {
					finalSelection.push(selection);
				}
			}

			return finalSelection;
		}
	} catch (error) {
		// Handle Ctrl+C gracefully
		if (error instanceof Error && error.name === "ExitPromptError") {
			console.log("\n👋 Operation cancelled by user");
			process.exit(0);
		}
		throw error;
	}
}

/**
 * Prompt user for input with better shell integration and error handling
 */
async function prompt(
	question: string,
	defaultValue?: string
): Promise<string> {
	try {
		return await input({
			message: question,
			default: defaultValue,
		});
	} catch (error) {
		// Handle Ctrl+C gracefully
		if (error instanceof Error && error.name === "ExitPromptError") {
			console.log("\n👋 Operation cancelled by user");
			process.exit(0);
		}
		throw error;
	}
}

/**
 * Interactive mode - prompt user for all inputs
 */
async function runInteractive() {
	console.log("📝 Professional Biography Generator");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		"🎯 We'll analyze your project summaries to create a compelling professional biography."
	);
	console.log(
		"ℹ️  Tip: Provide rich context about your career level and aspirations for best results."
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
	const developerName = await prompt("Developer full name");
	const projectSummaries = await promptForProjectSummaries();

	console.log("");
	console.log("🎯 Career Context (significantly improves quality):");
	const experienceLevel = await prompt(
		"Current experience level",
		'e.g., "Mid-level Developer transitioning to Technical Leadership roles"'
	);
	const careerAspirations = await prompt(
		"Career aspirations (optional)",
		'e.g., "Technical Leadership, System Architecture, Team Mentoring"'
	);

	console.log("");
	console.log("📖 Optional - Personal Context:");
	const personalDescription = await prompt(
		"Personal description (optional - 2-3 sentences)",
		'e.g., "Jacob is a passionate full-stack developer who thrives on solving complex technical challenges and building scalable solutions. He brings a collaborative approach to development work and is energized by opportunities to mentor team members and drive architectural decisions."'
	);
	console.log("");
	console.log("🎨 Voice & Style:");

	// First ask about voice analysis
	const useVoiceAnalysis = await confirm({
		message:
			"Use voice analysis from your Atomic Spin blog posts? (Analyzes your writing style for authentic tone)",
		default: false,
	});

	// Always collect a voice style for fallback purposes
	const voiceStyle = await select({
		message: useVoiceAnalysis
			? "Choose fallback voice style (used if voice analysis fails):"
			: "Choose biography voice style:",
		choices: [
			{
				name: "Authentic (Recommended)",
				value: "authentic",
				description: "Professional credibility with genuine personal voice",
			},
			{
				name: "Professional",
				value: "professional",
				description: "Formal, results-oriented, traditional business tone",
			},
			{
				name: "Personable",
				value: "personable",
				description: "Warm, approachable, personality-driven",
			},
		],
		default: "authentic",
	});

	const outputDir = await prompt(
		"Output directory (optional)",
		"professional-bios"
	);

	console.log("");
	console.log("⚙️  Optional - Additional Guidance");
	console.log(
		"   You can steer the biography with plain-language directives. Examples:"
	);
	console.log(
		"   - Emphasize technical leadership and architectural thinking; target senior engineering roles."
	);
	console.log(
		"   - Focus on collaborative skills and mentoring; tone should be approachable and team-oriented."
	);
	console.log(
		"   - Highlight full-stack expertise and system design; keep technical but accessible."
	);
	console.log(
		"   - Target client-facing roles; emphasize communication and business value delivery."
	);
	const additionalInstructions = await prompt(
		"Additional biography instructions (optional)"
	);

	return {
		developerName,
		projectSummaries,
		bioOptions: {
			experienceLevel: experienceLevel || undefined,
			careerAspirations: careerAspirations || undefined,
			personalDescription: personalDescription || undefined,
			voiceStyle: voiceStyle as "professional" | "personable" | "authentic",
			outputDir: outputDir || undefined,
			additionalInstructions: additionalInstructions || undefined,
			useVoiceAnalysis: useVoiceAnalysis,
			// Store the manual voice style for fallback
			fallbackVoiceStyle: voiceStyle as
				| "professional"
				| "personable"
				| "authentic",
		},
	};
}

async function main() {
	const args = process.argv.slice(2);

	// Setup CLI with graceful exit handling and interactive input
	setupCLI();

	let config;

	if (args.length === 0) {
		// Interactive mode - no arguments provided
		config = await runInteractive();
	} else if (
		args.includes("--help") ||
		args.includes("-h") ||
		args[0] === "help"
	) {
		// Show help
		console.log("📝 Professional Biography Generator");
		console.log("");
		console.log("Usage options:");
		console.log("  1. Interactive mode: bun run generateBio.ts");
		console.log(
			"  2. Command line:     bun run generateBio.ts <developer-name> [options]"
		);
		console.log("");
		console.log("Options:");
		console.log("  --experience-level <level>    Experience level");
		console.log("  --aspirations <goals>         Career aspirations");
		console.log("  --description <text>          Personal description");
		console.log(
			"  --voice-style <style>         Voice style (professional/personable/authentic)"
		);
		console.log("  --output-dir <path>           Output directory");
		console.log("  --instructions <text>         Additional instructions");
		console.log(
			"  --summaries-dir <path>        Directory with project summaries"
		);
		console.log(
			"  --project-summaries <files>   Comma-separated list of files"
		);
		console.log("  --max-summaries <number>      Maximum summaries to include");
		console.log(
			"  --analyze-voice               Enable voice analysis for authentic tone (Atomic Spin posts only)"
		);
		console.log(
			"  --refresh-voice               Force refresh of cached voice analysis"
		);
		console.log("");
		console.log(
			"Note: StrengthsFinder themes are auto-discovered from resources/strengths/ directory"
		);
		console.log("Examples:");
		console.log("  # Interactive (recommended):");
		console.log("  bun run generateBio.ts");
		console.log("");
		console.log("  # Command line mode:");
		console.log(
			'  bun run generateBio.ts "Jacob Williams" --experience-level "Mid-level Developer"'
		);
		console.log("");
		console.log("  # With directory path:");
		console.log(
			'  bun run generateBio.ts "Developer" --summaries-dir "project-experience-summaries" --aspirations "Technical Leadership"'
		);
		console.log("");
		console.log("  # With specific files:");
		console.log(
			'  bun run generateBio.ts "Developer" --project-summaries "file1.md,file2.md" --max-summaries 3'
		);
		process.exit(0);
	} else if (args.length >= 1) {
		// Command line mode - arguments provided
		const [developerName] = args;

		// Parse options
		const bioOptions: Parameters<typeof generateBio>[2] = {};
		let projectSummariesInput: string | string[] = [];

		for (let i = 1; i < args.length; i++) {
			const flag = args[i];

			// Handle boolean flags (no value)
			if (flag === "--analyze-voice") {
				bioOptions.useVoiceAnalysis = true;
				continue;
			}
			if (flag === "--refresh-voice") {
				bioOptions.useVoiceAnalysis = true;
				bioOptions.refreshVoiceCache = true;
				continue;
			}

			// Handle flags with values
			const value = args[i + 1];
			if (!value || value.startsWith("--")) {
				continue; // Skip if no value or next flag
			}

			switch (flag) {
				case "--experience-level":
					bioOptions.experienceLevel = value;
					i++; // Skip next arg (the value)
					break;
				case "--aspirations":
					bioOptions.careerAspirations = value;
					i++; // Skip next arg (the value)
					break;
				case "--description":
					bioOptions.personalDescription = value;
					i++; // Skip next arg (the value)
					break;
				case "--voice-style":
					if (
						value &&
						["professional", "personable", "authentic"].includes(value)
					) {
						bioOptions.voiceStyle = value as
							| "professional"
							| "personable"
							| "authentic";
					}
					i++; // Skip next arg (the value)
					break;
				case "--output-dir":
					bioOptions.outputDir = value;
					i++; // Skip next arg (the value)
					break;
				case "--instructions":
					bioOptions.additionalInstructions = value;
					i++; // Skip next arg (the value)
					break;
				case "--summaries-dir":
					// Directory path
					if (value) {
						projectSummariesInput = value;
					}
					i++; // Skip next arg (the value)
					break;
				case "--project-summaries":
					// Individual files (comma-separated)
					if (value) {
						projectSummariesInput = value.split(",");
					}
					i++; // Skip next arg (the value)
					break;
				case "--max-summaries":
					if (value) {
						bioOptions.maxSummaries = parseInt(value, 10);
					}
					i++; // Skip next arg (the value)
					break;
			}
		}

		// If no project summaries specified, auto-discover and randomly select
		if (
			Array.isArray(projectSummariesInput) &&
			projectSummariesInput.length === 0
		) {
			const choices = await getProjectSummaries();
			const summaryChoices = choices.filter(
				(choice) => choice.value !== "__custom__"
			);
			if (summaryChoices.length > 0) {
				const randomSelection = selectRandomSummaries(
					summaryChoices.map((c) => c.value),
					3
				);
				projectSummariesInput = randomSelection;
				console.log(
					`📊 Auto-selected ${randomSelection.length} project summaries`
				);
			}
		}

		config = {
			developerName: developerName!,
			projectSummaries: projectSummariesInput,
			bioOptions,
		};
	} else {
		console.log("📝 Professional Biography Generator");
		console.log("");
		console.log("Usage options:");
		console.log("  1. Interactive mode: bun run generateBio.ts");
		console.log(
			"  2. Command line:     bun run generateBio.ts <developer-name> [options]"
		);
		console.log("");
		console.log("Examples:");
		console.log("  # Interactive (recommended):");
		console.log("  bun run generateBio.ts");
		console.log("");
		console.log("  # Command line mode:");
		console.log(
			'  bun run generateBio.ts "Jacob Williams" --experience-level "Mid-level Developer"'
		);
		console.log("");
		console.log("  # With specific summaries:");
		console.log(
			'  bun run generateBio.ts "Developer" --project-summaries "file1.md,file2.md" --aspirations "Technical Leadership"'
		);
		process.exit(1);
	}

	// Close stdin after gathering input
	process.stdin.pause();

	console.log("");
	console.log("🚀 Starting Professional Biography Generation");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`👤 Developer: ${config.developerName}`);

	// Show appropriate count based on input type
	if (typeof config.projectSummaries === "string") {
		console.log(`📁 Project Summaries Directory: ${config.projectSummaries}`);
	} else {
		console.log(
			`📄 Project Summaries: ${config.projectSummaries.length} files`
		);
	}
	console.log("");

	try {
		// Generate professional biography
		console.log("🤖 Generating professional biography...");
		await generateBio(
			config.developerName,
			config.projectSummaries,
			config.bioOptions
		);

		console.log("");
		console.log("🎉 SUCCESS! Professional biography generated successfully!");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`📄 Find your professional biography in:`);
		const finalOutputDir = config.bioOptions.outputDir || "professional-bios";
		console.log(
			`   ${finalOutputDir}/${config.developerName
				.toLowerCase()
				.replace(/\s+/g, "-")}-professional-bio.md`
		);
	} catch (error) {
		console.error("💥 Biography generation failed:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

export { main };
