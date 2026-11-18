/**
 * CLI Utilities
 * Shared argument parsing and Ctrl+C / SIGTERM handling for the scripts.
 */

import type { Developer, ProcessingResult, Project } from "./types.js";

export function setupGracefulExit(): void {
	process.on("SIGINT", () => {
		console.log("\n👋 Operation cancelled by user");
		process.exit(0);
	});
	process.on("SIGTERM", () => {
		console.log("\n👋 Operation terminated");
		process.exit(0);
	});
}

type FlagKind = "value" | "list" | "bool";
type FlagValue<K extends FlagKind> = K extends "list" ? string[] : K extends "bool" ? true : string;
type Flags<S extends Record<string, FlagKind>> = { [F in keyof S]?: FlagValue<S[F]> };

/** The flags every parser takes to identify the developer. */
export const IDENTITY_FLAGS = {
	"--email": "value",
	"--username": "value",
	"--alias": "list",
	"--save": "bool",
} as const;

/**
 * Parses `<file> <developer-name> <project-name> [--flag value …]` for the parser scripts.
 * Prints usage and exits on --help, too few arguments, an unknown flag, or a flag missing its value.
 */
export function parseParserArgs<S extends Record<string, FlagKind>>(
	args: string[],
	usage: string,
	spec: S
): { filePath: string; developer: Developer; projectName: string; flags: Flags<S> } {
	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log(usage);
		process.exit(0);
	}
	const fail = (why: string): never => {
		console.error(`${why}\n\n${usage}`);
		process.exit(1);
	};
	const [filePath, name, projectName] = args;
	if (!filePath || !name || !projectName) fail("Missing arguments.");

	const flags: Record<string, string | string[] | true> = {};
	for (let i = 3; i < args.length; i++) {
		const flag = args[i]!;
		const kind = spec[flag] ?? fail(`Unknown option: ${flag}`);
		if (kind === "bool") {
			flags[flag] = true;
			continue;
		}
		const value = args[++i];
		if (value === undefined || value.startsWith("--")) fail(`${flag} needs a value.`);
		if (kind === "list") ((flags[flag] ??= []) as string[]).push(value!);
		else flags[flag] = value!;
	}
	const f = flags as Flags<typeof IDENTITY_FLAGS>;
	const developer: Developer = {
		name: name!,
		email: f["--email"],
		username: f["--username"],
		aliases: f["--alias"],
	};
	return { filePath: filePath!, developer, projectName: projectName!, flags: flags as Flags<S> };
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The project record and the --save filename stem ("jacob-williams-my-project"). */
export function projectFor(developer: Developer, projectName: string): { project: Project; stem: string } {
	const project = { name: projectName, slug: slug(projectName) };
	return { project, stem: `${slug(developer.name)}-${project.slug}` };
}

/** Prints a parser's result and exits non-zero on failure. */
export function report(result: ProcessingResult<unknown>, done: string): void {
	if (!result.success) {
		console.error(`\n❌ ${result.error}`);
		process.exit(1);
	}
	for (const w of result.warnings) console.log(`⚠️  ${w}`);
	console.log(`\n✅ ${done}`);
}
