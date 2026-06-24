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

	console.log(`🔧 Attempting to save voice cache to: ${cacheFile}`);

	try {
		// Ensure cache directory exists with better error handling
		if (!existsSync(CACHE_DIR)) {
			console.log(`📁 Creating cache directory: ${CACHE_DIR}`);
			await mkdir(CACHE_DIR, { recursive: true });
			console.log(`✅ Cache directory created successfully`);
		} else {
			console.log(`📁 Cache directory already exists: ${CACHE_DIR}`);
		}

		// Validate input data
		if (!authorName || !voiceSignature) {
			throw new Error(`Invalid input: authorName='${authorName}', voiceSignature length=${voiceSignature?.length || 0}`);
		}

		const cacheData: VoiceAnalysisCache = {
			authorName,
			voiceSignature,
			lastUpdated: new Date().toISOString(),
			sourcesAnalyzed,
		};

		// Convert to JSON with error handling
		let jsonData: string;
		try {
			jsonData = JSON.stringify(cacheData, null, 2);
			console.log(`📄 JSON data prepared (${jsonData.length} characters)`);
		} catch (jsonErr) {
			throw new Error(`Failed to serialize cache data: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`);
		}

		// Write file with detailed error handling
		await writeFile(cacheFile, jsonData, "utf-8");
		console.log(`💾 Voice signature cached successfully for ${authorName}`);
		console.log(`📍 Cache file location: ${cacheFile}`);

		// Verify the file was written correctly
		if (existsSync(cacheFile)) {
			const stats = require("fs").statSync(cacheFile);
			console.log(`✅ Cache file verified (${stats.size} bytes)`);
		} else {
			console.warn(`⚠️ Cache file was not created despite successful write operation`);
		}

	} catch (err) {
		const errorMessage = err instanceof Error ? err.message : String(err);
		console.error(`❌ Error saving voice cache for ${authorName}:`);
		console.error(`   File path: ${cacheFile}`);
		console.error(`   Error details: ${errorMessage}`);
		console.error(`   Working directory: ${process.cwd()}`);
		console.error(`   Cache directory exists: ${existsSync(CACHE_DIR)}`);
		
		// Log additional debugging info
		if (err instanceof Error && 'code' in err) {
			console.error(`   Error code: ${(err as any).code}`);
		}
		if (err instanceof Error && 'path' in err) {
			console.error(`   Error path: ${(err as any).path}`);
		}
		
		throw new Error(`Failed to save voice cache: ${errorMessage}`);
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
