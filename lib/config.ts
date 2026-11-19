/**
 * Paths and limits used by the scripts.
 */

import { homedir } from "os";
import { isAbsolute, join, resolve } from "path";
import { fileURLToPath } from "url";

/**
 * Resolves the knowledge-base (brainspace) root: the durable source of truth this tooling reads
 * from and writes to. The repo itself owns no durable data (see the contract in
 * `brainspace/docs/reference/knowledge-base.md`). `BRAINSPACE_ROOT` overrides the default of
 * `~/Projects/brainspace`. An empty value counts as unset, and a leading `~` is expanded, so a
 * quoted `"~/…"` or a blank variable can never point the scripts at the current directory.
 */
export function resolveBrainspaceRoot(value = process.env.BRAINSPACE_ROOT): string {
	const raw = value?.trim();
	if (!raw) return join(homedir(), "Projects", "brainspace");
	if (raw === "~" || raw.startsWith("~/")) return join(homedir(), raw.slice(1));
	return isAbsolute(raw) ? raw : resolve(raw);
}

export const BRAINSPACE_ROOT = resolveBrainspaceRoot();

/**
 * The KB paths the scripts use. The full read/write contract, including the paths only skills
 * touch, is in AGENTS.md.
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

// Repo-local, re-derivable intermediates — NOT durable state (that lives in the KB). Anchored to
// the repo root, not the current directory, so a script run from elsewhere still writes here.
const REPO_ROOT = fileURLToPath(new URL("..", import.meta.url));

export const CONFIG = {
	// Raw blog-post download (getPosts.ts) that htmlToMarkdown.ts converts into KB.VOICE_SAMPLES.
	POSTS_DIR: join(REPO_ROOT, ".tmp", "posts"),
	// Parsed output of the --save flag (tools/extractGitData.ts, tools/processBacklog.ts).
	PROCESSED_DATA_DIR: join(REPO_ROOT, ".tmp", "processed"),
	MAX_COMMITS_TO_ANALYZE: 500,
} as const;
