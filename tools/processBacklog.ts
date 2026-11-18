#!/usr/bin/env bun

/**
 * Backlog Processing Tool
 * Processes CSV backlog files and extracts the rows assigned to one developer.
 */

import csv from "csv-parser";
import { createReadStream } from "fs";
import { join } from "path";
import { parseArgs, setupGracefulExit, subjects } from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import { matchesDeveloper, parseAssignees } from "../lib/identity.js";
import type { BacklogContribution, BacklogTask, ProcessingResult } from "../lib/types.js";

const ASSIGNEE_PATTERNS = ["assignee", "assigned", "members", "owner", "responsible"];

function parseCSV(filePath: string): Promise<BacklogTask[]> {
	return new Promise((resolve, reject) => {
		const rows: BacklogTask[] = [];
		createReadStream(filePath)
			.on("error", reject)
			// Excel's UTF-8 export starts with a BOM, which csv-parser leaves on the first header.
			.pipe(csv({ mapHeaders: ({ header }) => header.replace(/^\uFEFF/, "").trim() }))
			.on("data", (row: BacklogTask) => rows.push(row))
			.on("end", () => resolve(rows))
			.on("error", reject);
	});
}

// Headers that carry an assignee word but name someone else ("Assigned By", "Previous Owner") or
// hold opaque ids ("Assignee Id"). Crediting the person who assigned a ticket is the same error
// as crediting a teammate.
const NOT_THE_DOER = /\b(by|from|previous|prior|original|ids?)\b/;

/**
 * Columns that name who did the work: the one given with --column (any case), else any whose
 * header contains an assignee-like word and isn't one of the exclusions above.
 */
function findAssigneeColumns(headers: string[], explicit?: string): string[] {
	if (explicit) return headers.filter((h) => h.toLowerCase() === explicit.toLowerCase());
	return headers.filter((header) => {
		const lower = header.toLowerCase();
		return ASSIGNEE_PATTERNS.some((p) => lower.includes(p)) && !NOT_THE_DOER.test(lower);
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

		const { developer, project, stem } = subjects(
			{
				name: developerName,
				email: options.developerEmail,
				username: options.developerUsername,
				aliases: options.developerAliases,
			},
			projectName
		);

		const tasks: BacklogTask[] = [];
		const others = new Set<string>();
		for (const row of csvRows) {
			const cells = assigneeColumns.map((column) => row[column] ?? "");
			const people = cells.flatMap(parseAssignees);
			if (people.some((who) => matchesDeveloper(who, developer))) tasks.push(row);
			else cells.filter(Boolean).forEach((cell) => others.add(cell));
		}
		console.log(`🎯 Found ${tasks.length} rows assigned to ${developerName}`);
		// Matching is exact, so an empty result usually means another spelling: show the
		// assignees that were seen, and fail rather than hand back an empty backlog.
		if (tasks.length === 0) {
			const seen = [...others].slice(0, 20).join(" · ") || "(every cell was empty)";
			return failure(
				`No rows assigned to ${developerName}. Assignees seen: ${seen}. ` +
					"Pass --alias / --username / --email for the spelling that is the developer.",
				startTime
			);
		}

		const data: BacklogContribution = {
			developer,
			project,
			tasks,
			metadata: { totalRows: tasks.length, assigneeColumns, allColumns: headers },
		};

		if (options.saveToFile) {
			const outputFile = join(
				options.outputDir ?? CONFIG.PROCESSED_DATA_DIR,
				`${stem}-backlog-data.json`
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
	setupGracefulExit();
	const { positional, flags } = parseArgs(process.argv.slice(2), USAGE, {
		"--email": "value",
		"--username": "value",
		"--alias": "list",
		"--column": "value",
		"--save": "bool",
	});
	const [filePath, developerName, projectName] = positional as [string, string, string];

	const result = await processBacklog(filePath, developerName, projectName, {
		developerEmail: flags["--email"] as string | undefined,
		developerUsername: flags["--username"] as string | undefined,
		developerAliases: flags["--alias"] as string[] | undefined,
		assigneeColumn: flags["--column"] as string | undefined,
		saveToFile: flags["--save"] === true,
	});
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
