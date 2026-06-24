/**
 * Essential configuration constants for Project Experience Artifacts system
 * Only includes values that are actually used by the codebase
 */

export const CONFIG = {
	// File Paths (used by scripts)
	PROCESSED_DATA_DIR: "data/processed",
	PROJECT_SUMMARIES_DIR: "project-experience-summaries",

	// Git Processing (used by extractGitData.ts)
	MAX_COMMITS_TO_ANALYZE: 500,
	COMMIT_MESSAGE_MAX_LENGTH: 200,

	// AI Provider Settings (used by future retry logic)
	RATE_LIMIT_DELAY: 1000,
	MAX_RETRIES: 3,
} as const;

// Type for configuration
export type ConfigType = typeof CONFIG;
