/**
 * Types shared by the deterministic parsers (tools/extractGitData.ts, tools/processBacklog.ts).
 */

export interface Developer {
	name: string;
	email?: string;
	username?: string;
	aliases?: string[]; // other spellings of the developer's name or handle
}

export interface Project {
	name: string;
	slug: string; // URL-safe version of name
}

export interface GitCommit {
	hash: string;
	author: string;
	email: string;
	date: string;
	message: string;
}

export interface GitContribution {
	developer: Developer;
	project: Project;
	commits: GitCommit[];
}

// A raw CSV row: the summarizing agent interprets the columns rather than the parser forcing a shape.
export type BacklogTask = Record<string, string>;

export interface BacklogContribution {
	developer: Developer;
	project: Project;
	tasks: BacklogTask[]; // raw CSV rows assigned to the developer
	metadata: {
		totalRows: number;
		assigneeColumns: string[]; // which columns were used for filtering
		allColumns: string[]; // all columns in the CSV
	};
}

export interface ProcessingResult<T> {
	success: boolean;
	data?: T;
	errors: ProcessingErrorData[];
	warnings: string[];
	metadata: {
		processingTime: number;
		recordsProcessed: number;
		recordsSkipped: number;
	};
}

export interface ProcessingErrorData {
	type: "validation" | "processing";
	message: string;
	context?: Record<string, unknown>;
	severity: "low" | "medium" | "high" | "critical";
}
