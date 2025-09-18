#!/usr/bin/env bun

/**
 * Main Project Summary Generator
 * Interactive pipeline: git log → processed data → professional summary
 */

import { input, search } from "@inquirer/prompts";
import { existsSync } from "fs";
import { readdir } from "fs/promises";
import path from "path";
import { getConfigStatus } from "./lib/aiConfig.js";
import { analyzeProject } from "./scripts/analyzeProject.js";

/**
 * Get available git log files with shortcuts
 */
async function getGitLogFiles(): Promise<
	Array<{ name: string; value: string; description?: string }>
> {
	const choices: Array<{ name: string; value: string; description?: string }> =
		[];

	// Add shortcuts for common locations
	const shortcuts = [
		{
			name: "📁 original-artifacts/",
			value: "original-artifacts/",
			description: "Browse original-artifacts directory",
		},
		{
			name: "📄 Root Compass",
			value: "original-artifacts/root_compass_git_log.txt",
			description: "Root Compass project git log",
		},
		{
			name: "📄 Root Leading Change",
			value: "original-artifacts/root_leading_change_git_log.txt",
			description: "Root Leading Change project git log",
		},
	];

	// Add existing shortcuts
	for (const shortcut of shortcuts) {
		if (existsSync(shortcut.value)) {
			choices.push(shortcut);
		}
	}

	// Add other git log files in original-artifacts
	if (existsSync("original-artifacts/")) {
		try {
			const files = await readdir("original-artifacts/");
			for (const file of files) {
				if (
					file.endsWith(".txt") &&
					file.includes("git") &&
					!shortcuts.some((s) => s.value.endsWith(file))
				) {
					const fullPath = `original-artifacts/${file}`;
					choices.push({
						name: `📄 ${file}`,
						value: fullPath,
						description: "Git log file",
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
 * Browse directory contents recursively
 */
async function browseDirectory(dirPath: string, question: string): Promise<string> {
	try {
		while (true) {
			const choices: Array<{ name: string; value: string; description?: string }> = [];
			
			// List directory contents first
			if (existsSync(dirPath)) {
				const items = await readdir(dirPath);
				const { stat } = await import('fs/promises');
				
				for (const item of items.sort()) {
					const fullPath = path.join(dirPath, item);
					try {
						const stats = await stat(fullPath);
						
						if (stats.isDirectory()) {
							choices.push({
								name: `📁 ${item}/`,
								value: `__dir_${fullPath}__`,
								description: `Browse ${item} directory`
							});
						} else if (item.endsWith('.txt') && (item.includes('git') || item.includes('log'))) {
							choices.push({
								name: `📄 ${item}`,
								value: fullPath,
								description: 'Git log file'
							});
						}
					} catch {
						// Skip items we can't stat
					}
				}
			}
			
			// Add manual entry and go back options at bottom
			choices.push({
				name: "✏️  Enter custom path...",
				value: "__custom__",
				description: "Type a custom file path"
			});
			
			choices.push({
				name: "🔙 .. (go back)",
				value: "__back__",
				description: "Go back to main file selection"
			});
			
			if (choices.length === 0) {
				console.log(`No files found in ${dirPath}`);
				return "";
			}
			
			// Show selection
			const selected = await search({
				message: `${question} (browsing: ${dirPath})`,
				source: async (input) => {
					if (!input) return choices;
					return choices.filter(
						(choice) =>
							choice.name.toLowerCase().includes(input.toLowerCase()) ||
							choice.value.toLowerCase().includes(input.toLowerCase())
					);
				},
			});
			
			// Handle selection
			if (selected === "__custom__") {
				return input({
					message: "Enter file path:",
					default: ""
				});
			} else if (selected === "__back__") {
				dirPath = path.dirname(dirPath);
				if (dirPath === ".") {
					// Go back to main file selection
					return promptForFile(question.replace(/ \(browsing:.*\)$/, ""));
				}
				continue;
			} else if (selected.startsWith("__dir_")) {
				// Navigate into directory
				dirPath = selected.replace("__dir_", "").replace("__", "");
				continue;
			} else {
				// File selected
				return selected;
			}
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
 * Prompt for file path with completion and shortcuts
 */
async function promptForFile(
	question: string,
	defaultValue?: string
): Promise<string> {
	try {
		const choices = await getGitLogFiles();

		if (choices.length > 1) {
			// Use search prompt for file selection
			const selected = await search({
				message: question,
				source: async (input) => {
					if (!input) return choices;
					return choices.filter(
						(choice) =>
							choice.name.toLowerCase().includes(input.toLowerCase()) ||
							choice.value.toLowerCase().includes(input.toLowerCase())
					);
				},
			});

			if (selected === "__custom__") {
				return input({
					message: "Enter file path:",
					default: defaultValue,
				});
			}
			
			// Handle directory browsing
			if (selected === "original-artifacts/") {
				// Browse directory contents
				return await browseDirectory("original-artifacts", question);
			}

			return selected;
		} else {
			// Fallback to regular input if no shortcuts available
			return input({
				message: question,
				default: defaultValue,
			});
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
	console.log("🚀 Project Experience Artifacts Generator");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		"📝 We'll gather detailed inputs to produce a high-quality, professional summary."
	);
	console.log(
		"ℹ️  Tip: Use short but descriptive sentences (not just keywords). Include scope, outcomes, metrics, and constraints."
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
	const gitLogFile = await promptForFile(
		"Select git log file:",
		"original-artifacts/root_compass_git_log.txt"
	);
	const developerName = await prompt("Developer full name");
	const projectName = await prompt("Project name (descriptive)");

	console.log("");
	console.log("🎯 Optional - Git Filtering (improves commit attribution):");
	const developerEmail = await prompt("Developer email (optional)");
	const developerUsername = await prompt(
		"Developer username/handle (optional)"
	);

	console.log("");
	console.log("📖 Optional - Rich Context (significantly improves quality):");
	const careerContext = await prompt(
		"Describe your career context (optional - full paragraph)",
		'e.g., "Jacob is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting technical competence and growth trajectory."'
	);
	const projectContext = await prompt(
		"Provide a project overview (optional)",
		'e.g., "Enterprise learning platform migrating to Contentful; focus on i18n, API integration, and CI stability."'
	);
	const role = await prompt(
		"Describe your role (optional)",
		'e.g., "Software Developer responsible for i18n, Contentful integration, and test infrastructure"'
	);
	const duration = await prompt(
		"Provide a project duration (optional)",
		'e.g., "July 2022 - November 2022"'
	);
	const outputDir = await prompt(
		"Provide an output directory (optional)",
		"project-experience-summaries"
	);

	console.log("");
	console.log("⚙️  Optional - Advanced Guidance");
	console.log(
		"   You can steer the analysis with plain-language directives. Examples:"
	);
	console.log(
		"   - Emphasize internationalization and Contentful architecture; deemphasize generic UI polish."
	);
	console.log(
		"   - Target audience: hiring managers (senior backend focus); tone: concise and metrics-driven."
	);
	console.log(
		"   - Highlight problem-solving around CI flakiness and schema validation; quantify impact where possible."
	);
	console.log(
		"   - Exclude sensitive details and proprietary names; generalize where needed."
	);
	console.log(
		"   - Prefer bullet density over prose in Skills and Achievements."
	);
	const additionalInstructions = await prompt(
		"Additional analysis instructions (optional)"
	);

	return {
		gitLogFile,
		developerName,
		projectName,
		analysisOptions: {
			careerContext: careerContext || undefined,
			projectContext: projectContext || undefined,
			role: role || undefined,
			duration: duration || undefined,
			outputDir: outputDir || undefined,
			additionalInstructions: additionalInstructions || undefined,
			developerEmail: developerEmail || undefined,
			developerUsername: developerUsername || undefined,
		},
	};
}

async function main() {
	const args = process.argv.slice(2);

	// Handle process signals gracefully
	process.on("SIGINT", () => {
		console.log("\n👋 Operation cancelled by user");
		process.exit(0);
	});

	// Enable stdin for interactive input
	process.stdin.resume();
	process.stdin.setEncoding("utf8");

	let config;

	if (args.length === 0) {
		// Interactive mode - no arguments provided
		config = await runInteractive();
	} else if (args.length >= 3) {
		// Command line mode - arguments provided
		const [gitLogFile, developerName, projectName] = args;

		// Parse options
		const analysisOptions: Parameters<typeof analyzeProject>[3] = {};

		for (let i = 3; i < args.length; i += 2) {
			const flag = args[i];
			const value = args[i + 1];

			switch (flag) {
				case "--email":
					analysisOptions.developerEmail = value;
					break;
				case "--username":
					analysisOptions.developerUsername = value;
					break;
				case "--career-context":
					analysisOptions.careerContext = value;
					break;
				case "--project-context":
					analysisOptions.projectContext = value;
					break;
				case "--role":
					analysisOptions.role = value;
					break;
				case "--duration":
					analysisOptions.duration = value;
					break;
				case "--output-dir":
					analysisOptions.outputDir = value;
					break;
				case "--instructions":
					analysisOptions.additionalInstructions = value;
					break;
			}
		}

		config = {
			gitLogFile: gitLogFile!,
			developerName: developerName!,
			projectName: projectName!,
			analysisOptions,
		};
	} else {
		console.log("🚀 Project Experience Artifacts Generator");
		console.log("");
		console.log("Usage options:");
		console.log("  1. Interactive mode: bun run generateProjectSummary.ts");
		console.log(
			"  2. Command line:     bun run generateProjectSummary.ts <git-log> <developer> <project> [options]"
		);
		console.log("");
		console.log("Examples:");
		console.log("  # Interactive (recommended):");
		console.log("  bun run generateProjectSummary.ts");
		console.log("");
		console.log("  # Command line mode:");
		console.log(
			'  bun run generateProjectSummary.ts original-artifacts/compass.txt "Jacob Williams" "Compass Platform"'
		);
		console.log("");
		console.log("  # With additional context:");
		console.log(
			'  bun run generateProjectSummary.ts git-log.txt "Developer" "Project" --email dev@example.com --career-context "Senior developer"'
		);
		process.exit(1);
	}

	// Close stdin after gathering input
	process.stdin.pause();

	console.log("");
	console.log("🚀 Starting Project Experience Artifacts Generation");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`📁 Git Log: ${config.gitLogFile}`);
	console.log(`👤 Developer: ${config.developerName}`);
	console.log(`🏗️ Project: ${config.projectName}`);
	console.log("");

	try {
		// Generate project summary (includes git extraction)
		console.log("🤖 Generating professional project summary...");
		await analyzeProject(
			config.gitLogFile,
			config.developerName,
			config.projectName,
			config.analysisOptions
		);

		console.log("");
		console.log("🎉 SUCCESS! Project summary generated successfully!");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`📄 Find your professional project summary in:`);
		const finalOutputDir =
			config.analysisOptions.outputDir || "project-experience-summaries";
		console.log(
			`   ${finalOutputDir}/${config.projectName
				.toLowerCase()
				.replace(/\s+/g, "-")}-project-summary.md`
		);
	} catch (error) {
		console.error("💥 Pipeline failed:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

export { main };
