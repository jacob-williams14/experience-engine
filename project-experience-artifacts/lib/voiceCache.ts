/**
 * Simple voice analysis caching system
 * Stores voice analysis results to avoid re-running expensive AI analysis
 */

import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { join } from "path";

export interface VoiceAnalysisCache {
	authorName: string;
	voiceSignature: string;
	lastUpdated: string;
	sourcesAnalyzed: string[];
}

const CACHE_DIR = "voice-cache";
const CACHE_EXPIRY_MONTHS = 3;

/**
 * Get cache file path for an author
 */
function getCacheFilePath(authorName: string): string {
	const safeAuthorName = authorName.toLowerCase().replace(/[^a-z0-9]/g, "-");
	return join(CACHE_DIR, `${safeAuthorName}-voice.json`);
}

/**
 * Check if cache should be refreshed (older than 3 months)
 */
export function shouldRefreshCache(authorName: string): boolean {
	const cacheFile = getCacheFilePath(authorName);

	if (!existsSync(cacheFile)) {
		return true; // No cache exists
	}

	try {
		const stats = Bun.file(cacheFile).size;
		if (stats === 0) return true; // Empty cache file

		// Check file modification time
		const fileStats = require("fs").statSync(cacheFile);
		const ageInMonths =
			(Date.now() - fileStats.mtime.getTime()) / (1000 * 60 * 60 * 24 * 30);

		return ageInMonths > CACHE_EXPIRY_MONTHS;
	} catch {
		return true; // Error reading cache, refresh
	}
}

/**
 * Load cached voice analysis for an author
 */
export async function loadVoiceContext(
	authorName: string
): Promise<VoiceAnalysisCache | null> {
	const cacheFile = getCacheFilePath(authorName);

	if (!existsSync(cacheFile)) {
		return null;
	}

	try {
		const content = await readFile(cacheFile, "utf-8");
		const cached = JSON.parse(content) as VoiceAnalysisCache;

		// Validate cache structure
		if (!cached.authorName || !cached.voiceSignature || !cached.lastUpdated) {
			console.warn(
				`⚠️ Invalid cache structure for ${authorName}, will refresh`
			);
			return null;
		}

		return cached;
	} catch (err) {
		console.warn(
			`⚠️ Error reading voice cache for ${authorName}:`,
			err instanceof Error ? err.message : String(err)
		);
		return null;
	}
}

/**
 * Save voice analysis result to cache
 */
export async function saveVoiceContext(
	authorName: string,
	voiceSignature: string,
	sourcesAnalyzed: string[] = []
): Promise<void> {
	const cacheFile = getCacheFilePath(authorName);

	// Ensure cache directory exists
	if (!existsSync(CACHE_DIR)) {
		await mkdir(CACHE_DIR, { recursive: true });
	}

	const cacheData: VoiceAnalysisCache = {
		authorName,
		voiceSignature,
		lastUpdated: new Date().toISOString(),
		sourcesAnalyzed,
	};

	try {
		await writeFile(cacheFile, JSON.stringify(cacheData, null, 2), "utf-8");
		console.log(`💾 Voice signature cached for ${authorName}`);
	} catch (err) {
		console.error(
			`❌ Error saving voice cache for ${authorName}:`,
			err instanceof Error ? err.message : String(err)
		);
		throw err;
	}
}

/**
 * Check if cached voice analysis exists and is recent
 */
export async function getCacheStatus(authorName: string): Promise<{
	exists: boolean;
	isRecent: boolean;
	lastUpdated?: string;
	ageInDays?: number;
}> {
	const cached = await loadVoiceContext(authorName);

	if (!cached) {
		return { exists: false, isRecent: false };
	}

	const lastUpdated = new Date(cached.lastUpdated);
	const ageInDays =
		(Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
	const isRecent = ageInDays < CACHE_EXPIRY_MONTHS * 30;

	return {
		exists: true,
		isRecent,
		lastUpdated: cached.lastUpdated,
		ageInDays: Math.round(ageInDays),
	};
}
