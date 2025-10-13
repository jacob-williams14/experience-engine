/**
 * Simple Voice Analysis Helper
 * Integrates voice analysis with caching for bio generation
 */

import { analyzeAuthorStyle } from "../scripts/analyzeAuthorStyle.js";
import { generateAIText } from "./ai.js";
import {
	getCacheStatus,
	loadVoiceContext,
	saveVoiceContext,
} from "./voiceCache.js";

/**
 * Check for and use evolution analysis files to create better voice signatures
 */
async function tryEvolutionAnalysis(
	authorName: string
): Promise<string | null> {
	try {
		// Look for evolution analysis files
		const glob = new Bun.Glob("enriched-style-summaries-*.json");
		const files = await Array.fromAsync(glob.scan({ cwd: "." }));

		// Find the most recent file for this author
		const authorSlug = authorName.toLowerCase().replace(/\s+/g, "-");
		const authorFiles = files.filter((file) => file.includes(authorSlug));

		if (authorFiles.length === 0) {
			return null;
		}

		// Use the most recent file (they're timestamped)
		const latestFile = authorFiles.sort().pop()!;
		const evolutionData = await Bun.file(latestFile).json();

		if (!Array.isArray(evolutionData) || evolutionData.length === 0) {
			return null;
		}

		// Sort by year to show evolution
		const sortedData = evolutionData.sort((a, b) => a.year - b.year);

		// Create a comprehensive analysis of the evolution
		const evolutionSummary = sortedData
			.map(
				(year) => `**${year.year}:**
- Structure: ${year.structurePattern}
- Tone: ${year.toneDescription}
- Themes: ${year.commonThemes.join(", ")}
- Perspective: ${year.perspective}
- Style: ${year.style}
- Devices: ${year.devices.join(", ")}
- Depth: ${year.depth}
- Audience: ${year.audience}`
			)
			.join("\n\n");

		// Create a voice signature from the complete evolution data
		const prompt = `Based on this year-by-year writing style evolution analysis, create a comprehensive voice signature for ${authorName} that captures what makes their writing feel distinctly human and authentic:

${evolutionSummary}

Analyze this evolution and create a voice signature that:
1. Identifies the core consistent elements across all years
2. Incorporates the mature/sophisticated elements from recent years
3. Focuses on their natural sentence rhythms and flow patterns
4. Captures how they connect and develop ideas
5. Identifies their characteristic word choices and phrasing
6. Highlights what makes their voice distinctive and recognizable

The voice signature should help capture ${authorName}'s authentic communication style - whatever that naturally is - rather than generic or templated language. Focus on what makes their communication style distinctive and genuinely theirs.

Format as a clear, actionable description of their voice characteristics that can guide writing in their authentic style and voice.`;

		const voiceSignature = await generateAIText(prompt, "analysis");
		return voiceSignature;
	} catch (error) {
		console.log(
			`📝 No evolution analysis found for ${authorName}, using standard analysis`
		);
		return null;
	}
}

export interface VoiceResult {
	voiceSignature: string;
	fromCache: boolean;
	analysisDate: string;
	success: boolean;
}

/**
 * Get voice analysis for an author, using cache when appropriate
 */
export async function getVoiceAnalysis(
	authorName: string,
	forceRefresh: boolean = false
): Promise<VoiceResult> {
	// Check cache status
	const cacheStatus = await getCacheStatus(authorName);

	if (!forceRefresh && cacheStatus.exists && cacheStatus.isRecent) {
		console.log(
			`📋 Using cached voice signature for ${authorName} (${cacheStatus.ageInDays} days old)`
		);
		const cached = await loadVoiceContext(authorName);

		if (cached) {
			return {
				voiceSignature: cached.voiceSignature,
				fromCache: true,
				analysisDate: cached.lastUpdated,
				success: true,
			};
		}
	}

	if (cacheStatus.exists && !cacheStatus.isRecent) {
		console.log(
			`🔄 Voice signature is ${cacheStatus.ageInDays} days old, refreshing...`
		);
	}

	// Try evolution analysis first (more comprehensive)
	console.log(`🔍 Analyzing ${authorName}'s writing style...`);
	let voiceSignature = await tryEvolutionAnalysis(authorName);

	if (voiceSignature) {
		console.log("✅ Using evolution-based voice analysis");

		// Cache the result
		await saveVoiceContext(authorName, voiceSignature, []);

		return {
			voiceSignature,
			fromCache: false,
			analysisDate: new Date().toISOString(),
			success: true,
		};
	}

	// Fall back to standard analysis
	console.log("📝 Using standard blog post analysis");
	try {
		const standardSignature = await analyzeAuthorStyle(authorName);

		// Cache the result
		await saveVoiceContext(authorName, standardSignature, []);

		return {
			voiceSignature: standardSignature,
			fromCache: false,
			analysisDate: new Date().toISOString(),
			success: true,
		};
	} catch (err) {
		// If fresh analysis fails but we have cached data, use it as fallback
		if (cacheStatus.exists) {
			console.warn(
				`⚠️ Fresh analysis failed, falling back to cached voice signature`
			);
			const cached = await loadVoiceContext(authorName);

			if (cached) {
				return {
					voiceSignature: cached.voiceSignature,
					fromCache: true,
					analysisDate: cached.lastUpdated,
					success: true,
				};
			}
		}

		// Analysis failed and no cache available
		console.warn(
			`⚠️ Voice analysis failed: ${
				err instanceof Error ? err.message : String(err)
			}`
		);
		return {
			voiceSignature: "",
			fromCache: false,
			analysisDate: new Date().toISOString(),
			success: false,
		};
	}
}

/**
 * Check if voice analysis is available for an author
 */
export async function hasVoiceAnalysis(authorName: string): Promise<boolean> {
	const cacheStatus = await getCacheStatus(authorName);
	return cacheStatus.exists;
}
