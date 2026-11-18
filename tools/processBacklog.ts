#!/usr/bin/env bun

/**
 * Backlog Processing Tool
 * Parses a CSV backlog and keeps the rows assigned to one developer.
 */

import csv from "csv-parser";
import { createReadStream } from "fs";
import { join } from "path";
import {
	IDENTITY_FLAGS,
	parseParserArgs,
	projectFor,
	report,
	setupGracefulExit,
} from "../lib/cliUtils.js";
import { CONFIG } from "../lib/config.js";
import { noMatch, parseAssignees, partitionByDeveloper } from "../lib/identity.js";
import type {
	BacklogContribution,
	BacklogTask,
	Developer,
	ProcessingResult,
} from "../lib/types.js";

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
 * The column that says who did the work: the one given with --column (any case), else the single
 * header with an assignee-like word that isn't excluded above. More than one candidate is an
 * error: picking one, or OR-ing them, could credit a teammate named in the other.
 */
function findAssigneeColumn(headers: string[], explicit?: string): string | { error: string } {
	if (explicit) {
		const found = headers.find((h) => h.toLowerCase() === explicit.toLowerCase());
		return found ?? { error: `Column "${explicit}" is not in this CSV` };
	}
	const candidates = headers.filter((header) => {
		const lower = header.toLowerCase();
		return ASSIGNEE_PATTERNS.some((p) => lower.includes(p)) && !NOT_THE_DOER.test(lower);
	});
	if (candidates.length === 1) return candidates[0]!;
	return {
		error:
			(candidates.length === 0
				? `No assignee column found (looked for: ${ASSIGNEE_PATTERNS.join(", ")}). `
				: `Several possible assignee columns: ${candidates.join(", ")}. `) +
			"Name the column that says who did the work with --column <header>.",
	};
}

async function processBacklog(
	filePath: string,
	developer: Developer,
	projectName: string,
	options: { assigneeColumn?: string; saveToFile?: boolean; outputDir?: string } = {}
): Promise<ProcessingResult<BacklogContribution>> {
	console.log(`📊 Processing backlog: ${filePath}`);
	let rows: BacklogTask[];
	try {
		rows = await parseCSV(filePath);
	} catch (error) {
		return { success: false, error: `Cannot read ${filePath}: ${(error as Error).message}` };
	}
	const headers = rows.length > 0 ? Object.keys(rows[0]!) : [];
	console.log(`📄 Parsed ${rows.length} CSV records; columns: ${headers.join(", ")}`);

	const column = findAssigneeColumn(headers, options.assigneeColumn);
	if (typeof column !== "string") return { success: false, error: column.error };
	console.log(`🎯 Assignee column: ${column}`);

	const { mine, others } = partitionByDeveloper(
		rows,
		(row) => parseAssignees(row[column] ?? ""),
		developer
	);
	if (mine.length === 0) return { success: false, error: noMatch("rows", developer, others) };
	console.log(`🎯 Found ${mine.length} rows assigned to ${developer.name}`);

	const { project, stem } = projectFor(developer, projectName);
	const data: BacklogContribution = {
		developer,
		project,
		tasks: mine,
		metadata: { assigneeColumns: [column], allColumns: headers },
	};
	if (options.saveToFile) {
		const outputFile = join(
			options.outputDir ?? CONFIG.PROCESSED_DATA_DIR,
			`${stem}-backlog-data.json`
		);
		await Bun.write(outputFile, JSON.stringify(data, null, 2));
		console.log(`💾 Saved processed data to: ${outputFile}`);
	}
	return { success: true, data, warnings: [] };
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
	const { filePath, developer, projectName, flags } = parseParserArgs(
		process.argv.slice(2),
		USAGE,
		{ ...IDENTITY_FLAGS, "--column": "value" } as const
	);
	const result = await processBacklog(filePath, developer, projectName, {
		assigneeColumn: flags["--column"],
		saveToFile: flags["--save"],
	});
	report(result, `${result.success ? result.data.tasks.length : 0} rows matched`);
}

if (import.meta.main) {
	main();
}

export { processBacklog };
