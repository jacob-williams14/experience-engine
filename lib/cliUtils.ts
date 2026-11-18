/**
 * CLI Utilities
 * Shared argument parsing and Ctrl+C / SIGTERM handling for the scripts.
 */

import type { Developer, Project } from "./types.js";

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

/** Flags that take a value: "value" keeps the last, "list" collects each; "bool" takes none. */
export type FlagSpec = Record<string, "value" | "list" | "bool">;
export type Flags = Record<string, string | string[] | true | undefined>;

/**
 * Parses `<a> <b> <c> [--flag value …]` for the parser scripts. Prints usage and exits on --help,
 * too few positionals, an unknown flag, or a flag missing its value.
 */
export function parseArgs(
	args: string[],
	usage: string,
	spec: FlagSpec,
	positionals = 3
): { positional: string[]; flags: Flags } {
	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log(usage);
		process.exit(0);
	}
	const fail = (why: string): never => {
		console.error(`${why}\n\n${usage}`);
		process.exit(1);
	};
	if (args.length < positionals) fail("Missing arguments.");

	const flags: Flags = {};
	for (let i = positionals; i < args.length; i++) {
		const flag = args[i]!;
		const kind = spec[flag];
		if (!kind) fail(`Unknown option: ${flag}`);
		if (kind === "bool") {
			flags[flag] = true;
			continue;
		}
		const value = args[++i];
		if (value === undefined || value.startsWith("--")) fail(`${flag} needs a value.`);
		if (kind === "list") ((flags[flag] ??= []) as string[]).push(value!);
		else flags[flag] = value;
	}
	return { positional: args.slice(0, positionals), flags };
}

/** "Jacob Williams" + "My Project" → the developer, the project and the --save filename stem. */
export function subjects(
	developer: Developer,
	projectName: string
): { developer: Developer; project: Project; stem: string } {
	const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
	const project = { name: projectName, slug: slug(projectName) };
	return { developer, project, stem: `${slug(developer.name)}-${project.slug}` };
}
