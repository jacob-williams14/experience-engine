/**
 * Configuration constants. Only values actually used by the surviving code.
 */

import { homedir } from "os";
import { join } from "path";

/**
 * Knowledge-base (brainspace) root — the durable source of truth this tooling reads from and writes
 * to. The repo itself owns no durable data (see the contract in
 * `brainspace/docs/knowledge-base.md`). Override the location with `BRAINSPACE_ROOT`;
 * defaults to `~/Projects/brainspace`.
 */
export const BRAINSPACE_ROOT =
	process.env.BRAINSPACE_ROOT ?? join(homedir(), "Projects", "brainspace");

/**
 * Resolved KB zone paths. Reads come from `data/**` + the worklog; writes go to `artifacts/**`.
 */
export const KB = {
	ROOT: BRAINSPACE_ROOT,
	// reads
	GIT_LOGS: join(BRAINSPACE_ROOT, "data", "git-logs"),
	BACKLOGS: join(BRAINSPACE_ROOT, "data", "backlogs"),
	VOICE_SAMPLES: join(BRAINSPACE_ROOT, "data", "voice-samples"),
	WORKLOG: join(BRAINSPACE_ROOT, "career", "atomic", "worklog"),
	// writes
	PROJECT_SUMMARIES: join(BRAINSPACE_ROOT, "artifacts", "project-summaries"),
	CONTRIBUTIONS: join(BRAINSPACE_ROOT, "artifacts", "contributions"),
	LINKEDIN: join(BRAINSPACE_ROOT, "artifacts", "linkedin"),
	BIO: join(BRAINSPACE_ROOT, "artifacts", "bio"),
} as const;

export const CONFIG = {
	// Repo-local, re-derivable intermediates — NOT durable state (that lives in the KB).
	// Raw blog-post download (getPosts.ts) that htmlToMarkdown.ts converts into KB.VOICE_SAMPLES.
	POSTS_DIR: ".tmp/posts",
	// Processed git-data --save output (tools/extractGitData.ts).
	PROCESSED_DATA_DIR: ".tmp/processed",
	MAX_COMMITS_TO_ANALYZE: 500,
	COMMIT_MESSAGE_MAX_LENGTH: 200,
} as const;

// Type for configuration
export type ConfigType = typeof CONFIG;
