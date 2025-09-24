/**
 * CLI Utilities
 * Centralized utilities for consistent CLI behavior across all scripts
 */

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
