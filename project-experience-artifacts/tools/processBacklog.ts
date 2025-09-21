#!/usr/bin/env bun

/**
 * Backlog Processing Tool
 * Processes CSV backlog files and extracts structured developer contribution data
 */

import csv from "csv-parser";
import { createReadStream } from "fs";
import type {
	BacklogContribution,
	BacklogTask,
	Developer,
	ProcessingErrorData,
	ProcessingResult,
	Project,
} from "../lib/types.js";

// ===== CSV Row Interface =====
interface CSVRow {
	[key: string]: string;
}

// ===== Helper Functions =====

/**
 * Parse CSV file using proper csv-parser library
 */
function parseCSV(filePath: string): Promise<CSVRow[]> {
	return new Promise((resolve, reject) => {
		const rows: CSVRow[] = [];

		createReadStream(filePath)
			.pipe(csv())
			.on("data", (row: CSVRow) => {
				rows.push(row);
			})
			.on("end", () => {
				resolve(rows);
			})
			.on("error", (error) => {
				reject(error);
			});
	});
}

/**
 * Find likely assignee columns by looking for common patterns
 */
function findAssigneeColumns(headers: string[]): string[] {
	const assigneePatterns = [
		"assignee",
		"assigned",
		"members",
		"owner",
		"responsible",
	];

	return headers.filter((header) => {
		const headerLower = header.toLowerCase();
		return assigneePatterns.some((pattern) => headerLower.includes(pattern));
	});
}

/**
 * Check if a row is assigned to the developer by checking all possible assignee columns
 */
function isRowAssignedToDeveloper(
	row: CSVRow,
	assigneeColumns: string[],
	developerName: string,
	options: { developerEmail?: string; developerUsername?: string }
): boolean {
	// If no assignee columns found, include all rows
	if (assigneeColumns.length === 0) return true;

	// Check each potential assignee column
	for (const column of assigneeColumns) {
		const assigneeValue = row[column];
		if (!assigneeValue) continue;

		const assigneeLower = assigneeValue.toLowerCase();

		// Check developer name (with and without spaces)
		const nameMatch =
			assigneeLower.includes(developerName.toLowerCase()) ||
			assigneeLower.includes(developerName.toLowerCase().replace(/\s+/g, ""));

		// Check email if provided
		const emailMatch = options.developerEmail
			? assigneeLower.includes(options.developerEmail.toLowerCase())
			: false;

		// Check username if provided
		const usernameMatch = options.developerUsername
			? assigneeLower.includes(options.developerUsername.toLowerCase())
			: false;

		if (nameMatch || emailMatch || usernameMatch) {
			return true;
		}
	}

	return false;
}

// ===== Main processing function =====
async function processBacklog(
	filePath: string,
	developerName: string,
	projectName: string,
	options: {
		developerEmail?: string;
		developerUsername?: string;
		saveToFile?: boolean;
	} = {}
): Promise<ProcessingResult<BacklogContribution>> {
	const startTime = Date.now();

	try {
		console.log(`📊 Processing backlog: ${filePath}`);
		console.log(`🔍 Filtering for developer: ${developerName}`);
		console.log(`📝 Project: ${projectName}`);

		// Read and parse CSV file
		const csvRows = await parseCSV(filePath);

		console.log(`📄 Parsed ${csvRows.length} CSV records`);

		// Show available columns
		const headers = csvRows.length > 0 ? Object.keys(csvRows[0]!) : [];
		console.log(`🔍 Available columns: ${headers.join(", ")}`);

		// Find potential assignee columns
		const assigneeColumns = findAssigneeColumns(headers);
		if (assigneeColumns.length > 0) {
			console.log(
				`🎯 Potential assignee columns: ${assigneeColumns.join(", ")}`
			);
		} else {
			console.log("⚠️  No assignee columns detected - will include all rows");
			console.log(
				"   💡 Looking for columns containing: assignee, assigned, members, owner, responsible"
			);
		}

		// Filter rows for this developer
		const developerRows: BacklogTask[] = [];
		const errors: ProcessingErrorData[] = [];

		for (const row of csvRows) {
			try {
				if (
					isRowAssignedToDeveloper(row, assigneeColumns, developerName, options)
				) {
					developerRows.push(row); // Just keep the raw CSV row
				}
			} catch (error) {
				errors.push({
					type: "processing",
					message: `Failed to process row: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
					severity: "medium",
					context: { rowIndex: developerRows.length },
				});
			}
		}

		console.log(
			`🎯 Found ${developerRows.length} rows assigned to ${developerName}`
		);

		// Create developer and project objects
		const developer: Developer = {
			name: developerName,
			email: options.developerEmail,
			username: options.developerUsername,
		};

		const project: Project = {
			name: projectName,
			slug: projectName.toLowerCase().replace(/\s+/g, "-"),
		};

		const backlogContribution: BacklogContribution = {
			developer,
			project,
			tasks: developerRows,
			metadata: {
				totalRows: developerRows.length,
				assigneeColumns,
				allColumns: headers,
			},
		};

		const processingTime = Date.now() - startTime;

		return {
			success: true,
			data: backlogContribution,
			errors,
			warnings: [],
			metadata: {
				processingTime,
				recordsProcessed: developerRows.length,
				recordsSkipped: csvRows.length - developerRows.length,
			},
		};
	} catch (error) {
		return {
			success: false,
			errors: [
				{
					type: "processing",
					message: `Failed to process backlog: ${
						error instanceof Error ? error.message : "Unknown error"
					}`,
					severity: "critical",
				},
			],
			warnings: [],
			metadata: {
				processingTime: Date.now() - startTime,
				recordsProcessed: 0,
				recordsSkipped: 0,
			},
		};
	}
}

// ===== CLI Interface =====
async function main() {
	const args = process.argv.slice(2);

	// Handle process signals gracefully
	process.on("SIGINT", () => {
		console.log("\n👋 Operation cancelled by user");
		process.exit(0);
	});

	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log("📊 Backlog Processing Tool");
		console.log("");
		console.log(
			"Usage: bun run tools/processBacklog.ts <backlog-file.csv> <developer-name> <project-name> [options]"
		);
		console.log("");
		console.log("Options:");
		console.log("  --email <email>      Developer email for matching");
		console.log("  --username <user>    Developer username for matching");
		console.log("");
		console.log("Description:");
		console.log(
			"  Processes CSV backlog files to extract developer-specific contributions"
		);
		console.log("");
		console.log("Examples:");
		console.log(
			'  bun run tools/processBacklog.ts datasources/biggby_backlog.csv "Jacob Williams" "Biggby"'
		);
		console.log(
			'  bun run tools/processBacklog.ts data.csv "Developer" "Project" --email "dev@example.com"'
		);
		process.exit(0);
	}

	if (args.length < 3) {
		console.error(
			"Usage: bun run tools/processBacklog.ts <backlog-file.csv> <developer-name> <project-name> [options]"
		);
		console.error("");
		console.error("Options:");
		console.error("  --email <email>      Developer email for matching");
		console.error("  --username <user>    Developer username for matching");
		console.error("");
		console.error("Example:");
		console.error(
			'  bun run tools/processBacklog.ts datasources/biggby_backlog.csv "Jacob Williams" "Biggby"'
		);
		console.error(
			'  bun run tools/processBacklog.ts backlog.csv "Jacob Williams" "Project" --email jacob@example.com'
		);
		process.exit(1);
	}

	const [filePath, developerName, projectName] = args;

	// Parse options
	const options: Parameters<typeof processBacklog>[3] = {};
	for (let i = 3; i < args.length; i += 2) {
		const flag = args[i];
		const value = args[i + 1];

		switch (flag) {
			case "--email":
				options.developerEmail = value;
				break;
			case "--username":
				options.developerUsername = value;
				break;
		}
	}

	try {
		const result = await processBacklog(
			filePath!,
			developerName!,
			projectName!,
			options
		);

		if (result.success) {
			const data = result.data!;
			console.log("\n✅ Processing completed successfully!");
			console.log(`📄 Total rows: ${data.metadata.totalRows}`);
			console.log(
				`🏷️ Available columns: ${data.metadata.allColumns.join(", ")}`
			);
			console.log(
				`🎯 Assignee columns used: ${data.metadata.assigneeColumns.join(", ")}`
			);
		} else {
			console.log("\n❌ Processing failed:");
			result.errors.forEach((error) => console.error(`   ${error.message}`));
		}
	} catch (error) {
		console.error("\n💥 Processing failed:", error);
		process.exit(1);
	}
}

if (import.meta.main) {
	main();
}

export { processBacklog };
