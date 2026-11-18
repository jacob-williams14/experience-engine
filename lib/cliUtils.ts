/**
 * CLI Utilities
 * Consistent Ctrl+C / SIGTERM handling for the scripts
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
