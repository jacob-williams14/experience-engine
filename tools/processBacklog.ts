#!/usr/bin/env bun

/**
 * Backlog Processing Tool
 * Processes CSV backlog files and extracts the rows assigned to one developer.
 */

import csv from "csv-parser";
import { createReadStream } from "fs";
import { join } from "path";
import { setupGracefulExit } from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import { matchesDeveloper, parseAssignees } from "../lib/identity.js";
import type {
	BacklogContribution,
	BacklogTask,
	Developer,
	ProcessingResult,
	Project,
} from "../lib/types.js";

const ASSIGNEE_PATTERNS = ["assignee", "assigned", "members", "owner", "responsible"];

function parseCSV(filePath: string): Promise<BacklogTask[]> {
	return new Promise((resolve, reject) => {
		const rows: BacklogTask[] = [];
		createReadStream(filePath)
			.on("error", reject)
			.pipe(csv())
			.on("data", (row: BacklogTask) => rows.push(row))
			.on("end", () => resolve(rows))
			.on("error", reject);
	});
}

/**
 * Columns that name who did the work: the one given with --column, else any whose header contains
 * an assignee-like word. Id columns ("Assignee Id") are skipped: they hold opaque ids, not names.
 */
function findAssigneeColumns(headers: string[], explicit?: string): string[] {
	if (explicit) return headers.filter((h) => h === explicit);
	return headers.filter((header) => {
		const lower = header.toLowerCase();
		return (
			ASSIGNEE_PATTERNS.some((p) => lower.includes(p)) && !/\bids?$/.test(lower)
		);
	});
}

function failure(message: string, startTime: number): ProcessingResult<BacklogContribution> {
	return {
		success: false,
		errors: [{ type: "processing", message, severity: "critical" }],
		warnings: [],
		metadata: { processingTime: Date.now() - startTime, recordsProcessed: 0, recordsSkipped: 0 },
	};
}

async function processBacklog(
	filePath: string,
	developerName: string,
	projectName: string,
	options: {
		developerEmail?: string;
		developerUsername?: string;
		developerAliases?: string[];
		assigneeColumn?: string;
		saveToFile?: boolean;
		outputDir?: string;
	} = {}
): Promise<ProcessingResult<BacklogContribution>> {
	const startTime = Date.now();

	try {
		console.log(`📊 Processing backlog: ${filePath}`);
		console.log(`🔍 Filtering for developer: ${developerName}`);

		const csvRows = await parseCSV(filePath);
		const headers = csvRows.length > 0 ? Object.keys(csvRows[0]!) : [];
		console.log(`📄 Parsed ${csvRows.length} CSV records`);
		console.log(`🔍 Available columns: ${headers.join(", ")}`);

		// Without an assignee column there is no way to tell whose work a row is. Keeping every
		// row would credit the whole team's tickets to the developer, so stop and ask instead.
		const assigneeColumns = findAssigneeColumns(headers, options.assigneeColumn);
		if (assigneeColumns.length === 0) {
			return failure(
				options.assigneeColumn
					? `Column "${options.assigneeColumn}" is not in this CSV`
					: `No assignee column found (looked for: ${ASSIGNEE_PATTERNS.join(", ")}). ` +
							"Name the column that says who did the work with --column <header>.",
				startTime
			);
		}
		console.log(`🎯 Assignee columns: ${assigneeColumns.join(", ")}`);

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

		const tasks = csvRows.filter((row) =>
			assigneeColumns.some((column) =>
				parseAssignees(row[column] ?? "").some((who) => matchesDeveloper(who, developer))
			)
		);
		console.log(`🎯 Found ${tasks.length} rows assigned to ${developerName}`);

		const data: BacklogContribution = {
			developer,
			project,
			tasks,
			metadata: { totalRows: tasks.length, assigneeColumns, allColumns: headers },
		};

		if (options.saveToFile) {
			const outputFile = join(
				options.outputDir ?? CONFIG.PROCESSED_DATA_DIR,
				`${developerName.toLowerCase().replace(/\s+/g, "-")}-${project.slug}-backlog-data.json`
			);
			await Bun.write(outputFile, JSON.stringify(data, null, 2));
			console.log(`💾 Saved processed data to: ${outputFile}`);
		}

		return {
			success: true,
			data,
			errors: [],
			warnings: [],
			metadata: {
				processingTime: Date.now() - startTime,
				recordsProcessed: tasks.length,
				recordsSkipped: csvRows.length - tasks.length,
			},
		};
	} catch (error) {
		return failure(
			`Failed to process backlog: ${error instanceof Error ? error.message : String(error)}`,
			startTime
		);
	}
}

// ===== CLI Interface =====

const USAGE = `Usage: bun run tools/processBacklog.ts <backlog-file.csv> <developer-name> <project-name> [options]

Options:
  --email <email>        Developer email for matching
  --username <user>      Developer username for matching
  --alias <alias>        Another spelling of the developer's name (repeatable)
  --column <header>      The column that says who did the work (default: detect it)
  --save                 Save the matched rows to .tmp/processed/ (JSON)

Matching is exact per person in a cell (case, spaces and punctuation ignored).

Example:
  bun run tools/processBacklog.ts ~/Projects/brainspace/data/backlogs/<file>.csv "Jacob Williams" "Project" --save`;

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
	const options: Parameters<typeof processBacklog>[3] = {};
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
			case "--column":
				options.assigneeColumn = args[++i];
				break;
			case "--save":
				options.saveToFile = true;
				break;
			default:
				console.error(`Unknown option: ${args[i]}\n\n${USAGE}`);
				process.exit(1);
		}
	}

	const result = await processBacklog(filePath!, developerName!, projectName!, options);
	if (!result.success) {
		console.error("\n❌ Processing failed:");
		result.errors.forEach((error) => console.error(`   ${error.message}`));
		process.exit(1);
	}
	console.log(`\n✅ ${result.data!.metadata.totalRows} rows matched`);
}

if (import.meta.main) {
	main();
}

export { processBacklog };
