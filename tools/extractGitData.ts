#!/usr/bin/env bun

/**
 * Git Data Extraction Tool
 * Parses a git log and keeps the commits authored by one developer.
 */

import { join } from "path";
import {
	IDENTITY_FLAGS,
	parseParserArgs,
	projectFor,
	report,
	setupGracefulExit,
} from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import { noMatch, partitionByDeveloper } from "../lib/identity.js";
import type { Developer, GitCommit, GitContribution, ProcessingResult } from "../lib/types.js";

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


async function extractGitData(
	filePath: string,
	developer: Developer,
	projectName: string,
	options: { saveToFile?: boolean; outputDir?: string } = {}
): Promise<ProcessingResult<GitContribution>> {
	console.log(`📊 Processing git log: ${filePath}`);
	let text: string;
	try {
		text = await Bun.file(filePath).text();
	} catch (error) {
		return { success: false, error: `Cannot read ${filePath}: ${(error as Error).message}` };
	}

	const warnings: string[] = [];
	const entries = text.split(/(?=^commit )/gm).filter((entry) => entry.trim());
	const allCommits = entries.map(parseGitLogEntry).filter((c): c is GitCommit => c !== null);
	if (allCommits.length < entries.length) {
		warnings.push(`Failed to parse ${entries.length - allCommits.length} git log entries`);
	}
	console.log(`✅ Parsed ${allCommits.length} of ${entries.length} commits`);

	const { mine, others } = partitionByDeveloper(
		allCommits,
		(c) => [{ name: c.author, email: c.email }],
		developer
	);
	if (mine.length === 0) return { success: false, error: noMatch("commits", developer, others) };
	console.log(`🎯 Found ${mine.length} commits by ${developer.name}`);
	// Matching is exact, so one of the other authors may be the developer under another spelling.
	if (others.length > 0) {
		console.log(`👥 Other authors (pass --alias for any that is you): ${others.join(", ")}`);
	}

	const commits = mine.slice(0, CONFIG.MAX_COMMITS_TO_ANALYZE);
	if (commits.length < mine.length) {
		warnings.push(
			`Limited analysis to ${CONFIG.MAX_COMMITS_TO_ANALYZE} most recent commits (found ${mine.length})`
		);
	}

	const { project, stem } = projectFor(developer, projectName);
	const data: GitContribution = { developer, project, commits };
	if (options.saveToFile) {
		const outputFile = join(options.outputDir ?? CONFIG.PROCESSED_DATA_DIR, `${stem}-git-data.json`);
		await Bun.write(outputFile, JSON.stringify(data, null, 2));
		console.log(`💾 Saved processed data to: ${outputFile}`);
	}
	return { success: true, data, warnings };
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
	setupGracefulExit();
	const { filePath, developer, projectName, flags } = parseParserArgs(
		process.argv.slice(2),
		USAGE,
		IDENTITY_FLAGS
	);
	const result = await extractGitData(filePath, developer, projectName, {
		saveToFile: flags["--save"],
	});
	report(result, `${result.success ? result.data.commits.length : 0} commits extracted`);
}

if (import.meta.main) {
	main();
}

export { extractGitData };
