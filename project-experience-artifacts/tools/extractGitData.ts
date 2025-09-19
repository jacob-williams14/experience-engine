#!/usr/bin/env bun

/**
 * Git Data Extraction Tool
 * Processes git log files and extracts structured developer contribution data
 * Based on SpinBot's data processing patterns
 */

import { CONFIG } from "@/config";
import type {
	Developer,
	GitCommit,
	GitContribution,
	ProcessingErrorData,
	ProcessingResult,
	Project,
} from "@/types";

// ===== Configuration =====
const TOOL_CONFIG = {
	MAX_COMMIT_MESSAGE_LENGTH: CONFIG.COMMIT_MESSAGE_MAX_LENGTH,
	MAX_COMMITS_TO_PROCESS: CONFIG.MAX_COMMITS_TO_ANALYZE,
	OUTPUT_DIR: CONFIG.PROCESSED_DATA_DIR,
} as const;

// ===== Error Handling =====
class GitExtractionError extends Error {
	constructor(message: string, public context?: Record<string, unknown>) {
		super(message);
		this.name = "GitExtractionError";
	}
}

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
			date,
			message: message || "No commit message",
		};
	} catch (error) {
		console.warn(`Failed to parse git log entry: ${error}`);
		return null;
	}
}

/**
 * Filter commits by developer
 */
function filterCommitsByDeveloper(
	commits: GitCommit[],
	developer: Developer
): GitCommit[] {
	const namesToMatch = [
		developer.name.toLowerCase(),
		...(developer.aliases?.map((a) => a.toLowerCase()) || []),
		developer.username?.toLowerCase(),
		developer.email?.toLowerCase(),
	].filter(Boolean);

	return commits.filter((commit) => {
		const authorName = commit.author.toLowerCase();

		return namesToMatch.some(
			(name) => authorName.includes(name!) || name!.includes(authorName)
		);
	});
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
		const developerCommits = filterCommitsByDeveloper(allCommits, developer);
		console.log(
			`🎯 Found ${developerCommits.length} commits by ${developerName}`
		);

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
			TOOL_CONFIG.MAX_COMMITS_TO_PROCESS
		);
		if (commitsToProcess.length < developerCommits.length) {
			warnings.push(
				`Limited analysis to ${TOOL_CONFIG.MAX_COMMITS_TO_PROCESS} most recent commits (found ${developerCommits.length})`
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
			const outputFile = `${TOOL_CONFIG.OUTPUT_DIR}/${developer.name
				.toLowerCase()
				.replace(/\s+/g, "-")}-${project.slug}-git-data.json`;
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

async function main() {
	const args = process.argv.slice(2);

	if (args.length < 3) {
		console.error(
			"Usage: bun run tools/extractGitData.ts <git-log-file> <developer-name> <project-name> [options]"
		);
		console.error("");
		console.error("Options:");
		console.error("  --email <email>           Developer email address");
		console.error("  --username <username>     Developer username/handle");
		console.error(
			"  --alias <alias>           Additional name alias (can be used multiple times)"
		);
		console.error(
			"  --save                    Save processed data to JSON file"
		);
		console.error("");
		console.error("Example:");
		console.error(
			'  bun run tools/extractGitData.ts compass-git-log.txt "Jacob Williams" "Compass Platform" --email jacob@example.com --save'
		);
		process.exit(1);
	}

	const [filePath, developerName, projectName] = args;

	// Parse options
	const options: Parameters<typeof extractGitData>[3] = {};
	for (let i = 3; i < args.length; i++) {
		const flag = args[i];

		switch (flag) {
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
			case "--save":
				options.saveToFile = true;
				break;
		}
	}

	try {
		const result = await extractGitData(
			filePath!,
			developerName!,
			projectName!,
			options
		);

		if (result.success) {
			console.log("\n✅ Git data extraction completed successfully!");
			console.log(
				`📊 Processed ${result.metadata.recordsProcessed} commits in ${result.metadata.processingTime}ms`
			);

			if (result.warnings.length > 0) {
				console.log("\n⚠️  Warnings:");
				result.warnings.forEach((warning) => console.log(`   ${warning}`));
			}
		} else {
			console.error("\n❌ Git data extraction failed!");
			result.errors.forEach((error) => console.error(`   ${error.message}`));
			process.exit(1);
		}
	} catch (error) {
		console.error("💥 Fatal error:", error);
		process.exit(1);
	}
}

// Run if this file is executed directly
if (import.meta.main) {
	main();
}

export { extractGitData };
