import { generateAIText } from "../lib/ai.js";
import { setupGracefulExit } from "../lib/cliUtils.js";

// 🔧 Configuration constants
const CONFIG = {
	MIN_POSTS_REQUIRED: 10,
	MAX_POSTS_TO_ANALYZE: 30,
	CONTENT_PREVIEW_LENGTH: 3000, // Increased for more context to reduce hallucination
	POSTS_DIRECTORY: "data/posts-md/",
	RATE_LIMIT_DELAY: 100, // ms between API calls
	MODEL_MINI: "gpt-4o-mini",
	MODEL_FULL: "gpt-4o",
} as const;

// 🚨 Custom error types
class InsufficientPostsError extends Error {
	constructor(author: string, found: number, required: number) {
		super(
			`Not enough Atomic Spin blog posts by ${author} to analyze (found ${found}, required ${required})`
		);
		this.name = "InsufficientPostsError";
	}
}

class FrontmatterParseError extends Error {
	constructor(message: string, file?: string) {
		super(file ? `${message} in file ${file}` : message);
		this.name = "FrontmatterParseError";
	}
}

// 🧱 Define types with better type safety
interface Post {
	readonly id: number;
	readonly title: string;
	readonly content: string;
	readonly date: string;
	readonly author: string;
}

interface PostStyleMini {
	readonly title: string;
	readonly year: number;
	readonly tone: string;
	readonly communicationStyle: string;
	readonly perspective: string;
	readonly targetAudience: string;
	readonly primaryThemes: readonly string[];
	readonly keyRecommendations: readonly string[];
}

interface Frontmatter {
	readonly id?: string;
	readonly title?: string;
	readonly date?: string;
	readonly author?: string;
	readonly [key: string]: unknown;
}

// 🛡️ Input validation
function validateAuthorName(author: string): void {
	if (!author || typeof author !== "string") {
		throw new Error("Author name must be a non-empty string");
	}
	if (author.trim().length === 0) {
		throw new Error("Author name cannot be empty or whitespace only");
	}
	if (author.length > 100) {
		throw new Error("Author name is too long (max 100 characters)");
	}
}

// 🗂 Load posts from markdown files with better error handling
function parseFrontmatter(
	content: string,
	filename?: string
): { frontmatter: Frontmatter; body: string } {
	const lines = content.split("\n");
	if (lines[0] !== "---") {
		throw new FrontmatterParseError("No frontmatter found", filename);
	}

	const endIndex = lines.findIndex(
		(line, index) => index > 0 && line === "---"
	);
	if (endIndex === -1) {
		throw new FrontmatterParseError(
			"Frontmatter not properly closed",
			filename
		);
	}

	const frontmatterLines = lines.slice(1, endIndex);
	const body = lines.slice(endIndex + 1).join("\n");

	const frontmatter: Record<string, unknown> = {};
	for (const line of frontmatterLines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex > 0) {
			const key = line.substring(0, colonIndex).trim();
			let value = line.substring(colonIndex + 1).trim();
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			frontmatter[key] = value;
		}
	}

	return { frontmatter: frontmatter as Frontmatter, body };
}

async function loadPostsByAuthor(authorName: string): Promise<readonly Post[]> {
	validateAuthorName(authorName);

	// Check if posts directory exists
	const { existsSync } = await import("fs");
	if (!existsSync(CONFIG.POSTS_DIRECTORY)) {
		throw new Error(
			`
❌ Atomic Spin blog posts not found!

To use voice analysis, you need to download and prepare the blog posts first:

1. Download posts: bun run getPosts.ts
2. Convert to markdown: bun run htmlToMarkdown.ts all
3. Then run voice analysis again

Alternatively, choose "No" for voice analysis and use manual voice style selection.
		`.trim()
		);
	}

	const glob = new Bun.Glob("*.md");
	const files = await Array.fromAsync(
		glob.scan({ cwd: CONFIG.POSTS_DIRECTORY })
	);
	const posts: Post[] = [];
	let errorCount = 0;

	for (const file of files) {
		try {
			const content = await Bun.file(`${CONFIG.POSTS_DIRECTORY}${file}`).text();
			const { frontmatter, body } = parseFrontmatter(content, file);

			if (
				!frontmatter.author ||
				frontmatter.author.toLowerCase() !== authorName.toLowerCase()
			) {
				continue;
			}

			// Validate required fields
			if (!frontmatter.title || !frontmatter.date) {
				console.warn(
					`⚠️ Skipping ${file}: missing required fields (title or date)`
				);
				continue;
			}

			posts.push({
				id: parseInt(frontmatter.id ?? "0") || 0,
				title: frontmatter.title,
				date: frontmatter.date,
				content: body,
				author: frontmatter.author,
			});
		} catch (err) {
			errorCount++;
			console.error(
				`❌ Error reading ${file}:`,
				err instanceof Error ? err.message : String(err)
			);

			// Fail fast if too many errors
			if (errorCount > 10) {
				throw new Error(
					`Too many file reading errors (${errorCount}). Aborting.`
				);
			}
		}
	}

	if (errorCount > 0) {
		console.warn(
			`⚠️ Successfully processed ${posts.length} posts with ${errorCount} errors`
		);
	}

	return posts.sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
	);
}

// 🛡️ Safe JSON parsing with validation
function parseAIResponse(
	text: string,
	postTitle: string
): PostStyleMini | null {
	try {
		// Clean up the response text to handle markdown code blocks
		let cleanText = text.trim();

		// Remove markdown code blocks if present
		if (cleanText.startsWith("```json")) {
			cleanText = cleanText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
		} else if (cleanText.startsWith("```")) {
			cleanText = cleanText.replace(/^```\s*/, "").replace(/\s*```$/, "");
		}

		const parsed = JSON.parse(cleanText);

		// Basic validation of required fields
		if (
			!parsed.title ||
			!parsed.year ||
			!parsed.tone ||
			!parsed.communicationStyle
		) {
			console.warn(
				`⚠️ Invalid AI response for "${postTitle}": missing required fields`
			);
			return null;
		}

		return parsed as PostStyleMini;
	} catch (err) {
		console.error(
			`⚠️ Failed to parse AI response for "${postTitle}":`,
			err instanceof Error ? err.message : String(err)
		);
		return null;
	}
}

// 🕐 Rate limiting utility
function delay(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

// ✏️ Mini style extraction prompt (per post)
function miniStylePrompt(post: Post): string {
	// Escape potential JSON injection in post data
	const escapeForJson = (str: string): string =>
		str.replace(/"/g, '\\"').replace(/\n/g, "\\n");

	return `
You are an expert in analyzing writing style, tone, and rhetorical strategies in technical blog posts.

Your task: Carefully read the following blog post by a software consultant or engineer. Based on the content, extract and return a single, valid JSON object (no markdown, no code blocks, no backticks, no extra commentary) that accurately summarizes the author's writing style, tone, rhetorical devices, and key ideas. Do not invent information—base your analysis strictly on the provided content.

---

Title: ${escapeForJson(post.title)}
Author: ${escapeForJson(post.author)}
Date: ${post.date}
Content:
"""
${post.content.slice(0, CONFIG.CONTENT_PREVIEW_LENGTH)}
"""

Instructions:
- Output ONLY the JSON object shown below, with all fields filled in based on your analysis of the post.
- Do NOT include any markdown, code block formatting, or explanatory text.
- Use arrays for list fields, and be as specific as possible.
- If a field is not present in the post, use an empty array or a reasonable null/empty value, but do not omit the field.

{
  "title": "${escapeForJson(post.title)}",
  "author": "${escapeForJson(post.author)}",
  "year": ${new Date(post.date).getFullYear()},
  "perspective": "<first-person | second-person | third-person | mixed>",
  "tone": "<describe the tone, e.g., reflective, enthusiastic, critical, etc.>",
  "communicationStyle": "<e.g., tutorial, narrative, persuasive, conversational, etc.>",
  "technicalDepth": "<basic | moderate | deep | advanced>",
  "targetAudience": "<describe the intended audience>",
  "languageDevices": [/* e.g., questions, lists, metaphors, humor, etc. */],
  "technologiesMentioned": [/* e.g., React, AWS, etc. */],
  "primaryThemes": [/* main topics or themes */],
  "keyRecommendations": [/* actionable advice or recommendations, if any */],
  "implicitValues": [/* e.g., pragmatism, innovation, collaboration, etc. */],
  "rhetoricalStrategies": [/* e.g., direct address, analogy, storytelling, etc. */],
  "authorExpertise": "<describe the author's expertise as inferred from the post>",
  "toneAnalysis": {
    "overallMood": "<e.g., encouraging, skeptical, excited, etc.>",
    "emotionalResonance": [/* e.g., reassurance, excitement, caution, etc. */],
    "voiceCharacteristics": [/* e.g., approachable, authoritative, witty, etc. */],
    "rhythmAndFlow": "<describe the structure or flow, e.g., step-by-step, anecdotal, etc.>",
    "engagementStrategies": [/* e.g., questions, calls to action, humor, etc. */],
    "levelOfFormality": "<casual | semi-formal | formal>",
    "confidenceLevel": "<measured | high | tentative | etc.>"
  },
  "intent": "<summarize the author's main intent in this post>"
}
`;
}

// 🤖 Reflective summary prompt for all extracted styles
function authorStyleReflectionPrompt(
	author: string,
	styles: readonly PostStyleMini[]
): string {
	const examples = styles
		.map(
			(s, i) =>
				`Post ${i + 1}:\nTitle: ${s.title}\nYear: ${s.year}\nTone: ${
					s.tone
				}\nPerspective: ${s.perspective}\nCommunication Style: ${
					s.communicationStyle
				}\nThemes: ${s.primaryThemes.join(
					", "
				)}\nRecommendations: ${s.keyRecommendations.slice(0, 3).join("; ")}`
		)
		.join("\n\n");

	return `
You are an expert voice coach helping to capture someone's authentic writing voice for content generation. Your task is to create a voice signature that captures what makes ${author}'s communication style distinctly human, conversational, and personally authentic.

Your goal: Create a voice signature that would help someone else write content that sounds genuinely like ${author} - not just professional, but with their personality, conversational patterns, and human warmth intact.

Instructions:
- **CRITICAL: Only include patterns and phrases that are actually present in the provided post summaries**
- Do NOT invent or assume specific phrases - if you can't find clear examples, describe the pattern instead
- Focus on what makes ${author}'s voice feel personal and conversational rather than corporate
- Identify actual language patterns and conversational habits from the content, not generic examples
- Capture their personality markers: humor, vulnerability, enthusiasm, specific ways they connect with readers
- Note how they balance professional expertise with human relatability
- Highlight what makes their writing feel like having a conversation with a trusted colleague
- When describing rhetorical patterns, reference actual examples from the posts or describe the pattern without inventing quotes
- Describe their "voice personality" based on evidence from their actual writing
- Focus on actionable characteristics grounded in their actual communication style

Create a voice signature that captures both their professional credibility AND their personal, conversational warmth. The result should help generate content that sounds like ${author} talking to a friend over coffee about their work, not like a corporate communication.

Post Summaries:
${examples}
`;
}

// 🧮 Token counting utilities
interface TokenUsage {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
}

interface ModelUsage {
	[modelName: string]: TokenUsage;
}

class TokenCounter {
	private usage: ModelUsage = {};

	addUsage(
		modelName: string,
		promptTokens: number,
		completionTokens: number
	): void {
		if (!this.usage[modelName]) {
			this.usage[modelName] = {
				promptTokens: 0,
				completionTokens: 0,
				totalTokens: 0,
			};
		}

		this.usage[modelName].promptTokens += promptTokens;
		this.usage[modelName].completionTokens += completionTokens;
		this.usage[modelName].totalTokens += promptTokens + completionTokens;
	}

	getUsage(): ModelUsage {
		return { ...this.usage };
	}

	getTotalUsage(): TokenUsage {
		const total = {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
		};

		for (const modelUsage of Object.values(this.usage)) {
			total.promptTokens += modelUsage.promptTokens;
			total.completionTokens += modelUsage.completionTokens;
			total.totalTokens += modelUsage.totalTokens;
		}

		return total;
	}

	private getModelCostPerMillion(modelName: string): {
		input: number;
		output: number;
	} {
		// OpenAI pricing as of 2024 (from official pricing chart)
		const pricing: Record<string, { input: number; output: number }> = {
			"gpt-4o-mini": { input: 0.15, output: 0.6 },
			"gpt-4o": { input: 5.0, output: 15.0 },
			"gpt-4.1-mini": { input: 0.4, output: 1.6 }, // Updated from pricing chart
			"gpt-4.1": { input: 2.0, output: 8.0 }, // Updated from pricing chart
			"gpt-4.1-nano": { input: 0.1, output: 0.4 }, // Added nano model
		};

		return pricing[modelName] || { input: 0.15, output: 0.6 }; // Default to gpt-4o-mini pricing
	}

	printUsage(): void {
		console.log("\n📊 Token Usage Summary:");

		let totalCost = 0;

		// Print usage for each model
		for (const [modelName, modelUsage] of Object.entries(this.usage)) {
			console.log(`\n   ${modelName}:`);
			console.log(
				`     Prompt tokens: ${modelUsage.promptTokens.toLocaleString()}`
			);
			console.log(
				`     Completion tokens: ${modelUsage.completionTokens.toLocaleString()}`
			);
			console.log(
				`     Total tokens: ${modelUsage.totalTokens.toLocaleString()}`
			);

			const pricing = this.getModelCostPerMillion(modelName);
			const promptCost = (modelUsage.promptTokens / 1000000) * pricing.input;
			const completionCost =
				(modelUsage.completionTokens / 1000000) * pricing.output;
			const modelCost = promptCost + completionCost;
			totalCost += modelCost;

			console.log(`     Model cost: $${modelCost.toFixed(4)}`);
		}

		// Print total usage across all models
		const total = this.getTotalUsage();
		console.log(`\n   Total across all models:`);
		console.log(`     Prompt tokens: ${total.promptTokens.toLocaleString()}`);
		console.log(
			`     Completion tokens: ${total.completionTokens.toLocaleString()}`
		);
		console.log(`     Total tokens: ${total.totalTokens.toLocaleString()}`);
		console.log(`     Total estimated cost: $${totalCost.toFixed(4)}`);
	}
}

// 🧠 Main function with comprehensive error handling
async function analyzeAuthorStyle(author: string): Promise<string> {
	try {
		console.log(`🔍 Loading Atomic Spin blog posts by ${author}...`);
		const posts = await loadPostsByAuthor(author);

		if (posts.length < CONFIG.MIN_POSTS_REQUIRED) {
			throw new InsufficientPostsError(
				author,
				posts.length,
				CONFIG.MIN_POSTS_REQUIRED
			);
		}

		console.log(
			`📝 Processing ${posts.length} Atomic Spin blog posts by ${author}...`
		);

		const postsToAnalyze = posts
			.slice()
			.sort(() => Math.random() - 0.5)
			.slice(0, CONFIG.MAX_POSTS_TO_ANALYZE);

		console.log(
			`🎯 Analyzing ${postsToAnalyze.length} randomly selected Atomic Spin posts...`
		);

		// Process posts with rate limiting
		const stylePromises = postsToAnalyze.map(async (post, index) => {
			// Add delay between requests to respect rate limits
			if (index > 0) {
				await delay(CONFIG.RATE_LIMIT_DELAY);
			}

			const prompt = miniStylePrompt(post);
			try {
				const result = await generateAIText(prompt, "detailed");

				if (result === null) {
					console.error(
						`⚠️ AI provider is set to 'local' mode - voice analysis requires an AI provider`
					);
					return null;
				}

				const summary = parseAIResponse(result, post.title);
				if (summary) {
					console.log(`✅ Analyzed: "${post.title}"`);
				}
				return summary;
			} catch (err) {
				console.error(
					`⚠️ Error analyzing "${post.title}":`,
					err instanceof Error ? err.message : String(err)
				);
				return null;
			}
		});

		const styleResults = await Promise.all(stylePromises);
		const styleChunks = styleResults.filter(
			(result): result is PostStyleMini => result !== null
		);

		if (styleChunks.length === 0) {
			throw new Error("No posts could be successfully analyzed");
		}

		console.log(`🤔 Reflecting on ${styleChunks.length} style summaries...`);
		const reflectionPrompt = authorStyleReflectionPrompt(author, styleChunks);

		const finalResult = await generateAIText(reflectionPrompt, "detailed");

		if (finalResult === null) {
			throw new Error(
				"AI provider is set to 'local' mode - voice analysis requires an AI provider"
			);
		}

		console.log("\n🧠 Author Style Reflection:\n");
		console.log(finalResult.trim());

		// Return the result for programmatic use
		return finalResult.trim();
	} catch (err) {
		if (err instanceof InsufficientPostsError) {
			console.error(`❌ ${err.message}`);
			process.exit(1);
		} else if (err instanceof FrontmatterParseError) {
			console.error(`❌ Frontmatter parsing error: ${err.message}`);
			process.exit(1);
		} else {
			console.error(
				`❌ Unexpected error:`,
				err instanceof Error ? err.message : String(err)
			);
			process.exit(1);
		}
	}
}

// Export the function for programmatic use
export { analyzeAuthorStyle };

// CLI usage when run directly
if (import.meta.main) {
	// Setup graceful exit handling
	setupGracefulExit();

	const authorName = process.argv[2];
	if (!authorName) {
		console.error("❌ Please provide an author name as an argument");
		console.error('Usage: bun run scripts/analyzeAuthorStyle.ts "Author Name"');
		console.error(
			"Note: Analyzes writing style from Atomic Spin blog posts only"
		);
		process.exit(1);
	}

	try {
		await analyzeAuthorStyle(authorName);
	} catch (err) {
		console.error(
			"❌ Fatal error:",
			err instanceof Error ? err.message : String(err)
		);
		process.exit(1);
	}
}
