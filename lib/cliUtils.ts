/**
 * CLI Utilities
 * Centralized utilities for consistent CLI behavior across all scripts
 */

import { confirm, input, select } from "@inquirer/prompts";

/**
 * Sets up consistent SIGINT (Ctrl+C) handling for CLI scripts
 * Displays a friendly cancellation message and exits gracefully
 */
export function setupGracefulExit(): void {
	process.on("SIGINT", () => {
		console.log("\n👋 Operation cancelled by user");
		process.exit(0);
	});

	// Also handle SIGTERM for completeness
	process.on("SIGTERM", () => {
		console.log("\n👋 Operation terminated");
		process.exit(0);
	});
}

/**
 * Sets up stdin for interactive input
 * Call this for scripts that need to read user input
 */
export function setupInteractiveInput(): void {
	process.stdin.resume();
	process.stdin.setEncoding("utf8");
}

/**
 * Complete CLI setup for interactive scripts
 * Combines graceful exit handling and stdin setup
 */
export function setupCLI(): void {
	setupGracefulExit();
	setupInteractiveInput();
}

/**
 * Handle ExitPromptError gracefully - standard pattern for all prompts
 */
function handlePromptExit(error: unknown): never {
	if (error instanceof Error && error.name === "ExitPromptError") {
		console.log("\n👋 Operation cancelled by user");
		process.exit(0);
	}
	throw error;
}

/**
 * Wrapped input prompt with standardized SIGINT handling
 */
export async function promptInput(
	message: string,
	defaultValue?: string
): Promise<string> {
	try {
		return await input({
			message,
			default: defaultValue,
		});
	} catch (error) {
		handlePromptExit(error);
	}
}

/**
 * Wrapped confirm prompt with standardized SIGINT handling
 */
export async function promptConfirm(
	message: string,
	defaultValue?: boolean
): Promise<boolean> {
	try {
		return await confirm({
			message,
			default: defaultValue,
		});
	} catch (error) {
		handlePromptExit(error);
	}
}

/**
 * Wrapped select prompt with standardized SIGINT handling
 */
export async function promptSelect<T>(
	message: string,
	choices: Array<{ name: string; value: T; description?: string }>,
	defaultValue?: T
): Promise<T> {
	try {
		return await select({
			message,
			choices,
			default: defaultValue,
		});
	} catch (error) {
		handlePromptExit(error);
	}
}
