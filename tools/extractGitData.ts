#!/usr/bin/env bun

/**
 * Git Data Extraction Tool
 * Processes git log files and extracts structured developer contribution data
 */

import { join } from "path";
import { setupGracefulExit } from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import { matchesDeveloper } from "../lib/identity.js";
import type {
	Developer,
	GitCommit,
	GitContribution,
	ProcessingErrorData,
	ProcessingResult,
	Project,
} from "../lib/types.js";

// ===== Utility Functions =====

/**
 * Parse a single git log entry from standard git log format
 */
function parseGitLogEntry(entry: string): GitCommit | null {
	try {
		const lines = entry.trim().split("\n");
		if (lines.length < 3) return null;

		// Expected format:
		// commit abc123def456...
		// [Merge: hash1 hash2]  (optional merge line)
		// Author: Name <email@example.com>
		// Date: Wed Nov 23 12:01:22 2022 -0500
		//
		//     Commit message (indented)
		//     May span multiple lines

		let lineIndex = 0;

		// Parse commit hash
		const commitMatch = lines[lineIndex]?.match(/^commit\s+([a-f0-9]+)/);
		if (!commitMatch) return null;
		const hash = commitMatch[1]!.trim();
		lineIndex++;

		// Skip merge line if present
		if (lines[lineIndex]?.startsWith("Merge:")) {
			lineIndex++;
		}

		// Parse author
		const authorMatch = lines[lineIndex]?.match(/^Author:\s*(.+?)\s*<(.+?)>$/);
		if (!authorMatch) return null;
		const author = authorMatch[1]!.trim();
		const email = authorMatch[2]!.trim();
		lineIndex++;

		// Parse date
		const dateMatch = lines[lineIndex]?.match(/^Date:\s*(.+)$/);
		if (!dateMatch) return null;
		const date = dateMatch[1]!.trim();
		lineIndex++;

		// Parse commit message (skip empty line, then collect indented lines)
		let message = "";
		lineIndex++; // skip empty line after date

		while (lineIndex < lines.length) {
			const line = lines[lineIndex];
			if (line && (line.startsWith("    ") || line.startsWith("\t"))) {
				// This is part of the commit message (indented)
				message += (message ? " " : "") + line.trim();
			} else if (line && line.trim()) {
				// Non-indented, non-empty line - probably next commit or other info
				break;
			}
			lineIndex++;
		}

		if (!message) {
			// If no indented message found, look for first non-empty line after date
			for (let i = 4; i < lines.length && i < 10; i++) {
				const line = lines[i];
				if (line && line.trim()) {
					message = line.trim();
					break;
				}
			}
		}

		return {
			hash: hash.substring(0, 12),
			author,
			email,
			date,
			message: message || "No commit message",
		};
	} catch (error) {
		console.warn(`Failed to parse git log entry: ${error}`);
		return null;
	}
}


/**
 * Main extraction function
 */
async function extractGitData(
	filePath: string,
	developerName: string,
	projectName: string,
	options: {
		developerEmail?: string;
		developerUsername?: string;
		developerAliases?: string[];
		saveToFile?: boolean;
		outputDir?: string;
	} = {}
): Promise<ProcessingResult<GitContribution>> {
	const startTime = Date.now();
	const errors: ProcessingErrorData[] = [];
	const warnings: string[] = [];

	try {
		console.log(`📊 Processing git log: ${filePath}`);
		console.log(`🔍 Filtering for developer: ${developerName}`);

		// Read and parse git log file
		const fileContent = await Bun.file(filePath).text();
		// Split on commit boundaries - each entry starts with "commit "
		const entries = fileContent
			.split(/(?=^commit )/gm)
			.filter((entry) => entry.trim());

		console.log(`📝 Found ${entries.length} total git log entries`);

		// Parse individual commits
		const allCommits: GitCommit[] = [];
		let parseErrors = 0;

		for (const entry of entries) {
			const commit = parseGitLogEntry(entry);
			if (commit) {
				allCommits.push(commit);
			} else {
				parseErrors++;
			}
		}

		if (parseErrors > 0) {
			warnings.push(`Failed to parse ${parseErrors} git log entries`);
		}

		console.log(`✅ Successfully parsed ${allCommits.length} commits`);

		// Create developer and project objects
		const developer: Developer = {
			name: developerName,
			email: options.developerEmail,
			username: options.developerUsername,
			aliases: options.developerAliases,
		};

		const project: Project = {
			name: projectName,
			slug: projectName.toLowerCase().replace(/\s+/g, "-"),
		};

		// Filter commits for the specific developer
		const developerCommits = allCommits.filter((c) =>
			matchesDeveloper({ name: c.author, email: c.email }, developer)
		);
		console.log(
			`🎯 Found ${developerCommits.length} commits by ${developerName}`
		);
		// Matching is exact, so list the other authors: one of them may be the developer under
		// another spelling (pass it with --alias).
		const others = [
			...new Set(allCommits.filter((c) => !developerCommits.includes(c)).map((c) => c.author)),
		];
		if (others.length > 0) {
			console.log(`👥 Other authors (pass --alias for any that is you): ${others.join(", ")}`);
		}

		if (developerCommits.length === 0) {
			errors.push({
				type: "validation",
				message: `No commits found for developer ${developerName}`,
				context: { filePath, developerName },
				severity: "high",
			});
		}

		// Limit commits if necessary
		const commitsToProcess = developerCommits.slice(
			0,
			CONFIG.MAX_COMMITS_TO_ANALYZE
		);
		if (commitsToProcess.length < developerCommits.length) {
			warnings.push(
				`Limited analysis to ${CONFIG.MAX_COMMITS_TO_ANALYZE} most recent commits (found ${developerCommits.length})`
			);
		}

		// Create the contribution object - just the essential data for AI analysis
		const contribution: GitContribution = {
			developer,
			project,
			commits: commitsToProcess,
		};

		// Optionally save processed data
		if (options.saveToFile) {
			const outputFile = join(
				options.outputDir ?? CONFIG.PROCESSED_DATA_DIR,
				`${developer.name.toLowerCase().replace(/\s+/g, "-")}-${project.slug}-git-data.json`
			);
			await Bun.write(outputFile, JSON.stringify(contribution, null, 2));
			console.log(`💾 Saved processed data to: ${outputFile}`);
		}

		const processingTime = Date.now() - startTime;
		return {
			success: true,
			data: contribution,
			errors,
			warnings,
			metadata: {
				processingTime,
				recordsProcessed: commitsToProcess.length,
				recordsSkipped: allCommits.length - commitsToProcess.length,
			},
		};
	} catch (error) {
		const processingTime = Date.now() - startTime;
		errors.push({
			type: "processing",
			message: error instanceof Error ? error.message : String(error),
			context: { filePath, developerName, projectName },
			severity: "critical",
		});

		return {
			success: false,
			errors,
			warnings,
			metadata: {
				processingTime,
				recordsProcessed: 0,
				recordsSkipped: 0,
			},
		};
	}
}

// ===== CLI Interface =====

const USAGE = `Usage: bun run tools/extractGitData.ts <git-log-file> <developer-name> <project-name> [options]

Options:
  --email <email>           Developer email (matched against the commit author email)
  --username <username>     Developer username/handle
  --alias <alias>           Another spelling of the developer's name (repeatable)
  --save                    Save the parsed data to .tmp/processed/ (JSON)

Matching is exact (case, spaces and punctuation ignored): a teammate whose name merely contains
the developer's is not counted. The other authors are listed so you can add an --alias.

Example:
  bun run tools/extractGitData.ts ~/Projects/brainspace/data/git-logs/<file>.txt "Jacob Williams" "Project" --save`;

async function main() {
	const args = process.argv.slice(2);
	setupGracefulExit();

	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log(USAGE);
		process.exit(0);
	}
	if (args.length < 3) {
		console.error(USAGE);
		process.exit(1);
	}

	const [filePath, developerName, projectName] = args;
	const options: Parameters<typeof extractGitData>[3] = {};
	for (let i = 3; i < args.length; i++) {
		switch (args[i]) {
			case "--email":
				options.developerEmail = args[++i];
				break;
			case "--username":
				options.developerUsername = args[++i];
				break;
			case "--alias":
				(options.developerAliases ??= []).push(args[++i]!);
				break;
			case "--save":
				options.saveToFile = true;
				break;
			default:
				console.error(`Unknown option: ${args[i]}\n\n${USAGE}`);
				process.exit(1);
		}
	}

	const result = await extractGitData(filePath!, developerName!, projectName!, options);
	result.warnings.forEach((w) => console.log(`⚠️  ${w}`));
	if (!result.success || result.errors.length > 0) {
		console.error("\n❌ Git data extraction failed!");
		result.errors.forEach((error) => console.error(`   ${error.message}`));
		process.exit(1);
	}
	console.log(
		`\n✅ Processed ${result.metadata.recordsProcessed} commits in ${result.metadata.processingTime}ms`
	);
}

if (import.meta.main) {
	main();
}

export { extractGitData, parseGitLogEntry };
