import { setTimeout } from "timers/promises";
import { generateAIText } from "../lib/ai.js";
import { setupGracefulExit } from "../lib/cliUtils.js";

// ====== Configuration ======
const CONFIG = {
	POSTS_PER_YEAR: 20,
	CONTENT_PREVIEW_LENGTH: 1500,
	CONCURRENT_REQUESTS: 8,
	RATE_LIMIT_DELAY: 1000,
	DATA_DIR: "data/posts-md/",
	OUTPUT_PREFIX: "enriched-style-summaries",
} as const;

// ====== Types ======
interface Post {
	id: number;
	title: string;
	content: string;
	date: string;
	author: string;
}

interface YearSummary {
	year: number;
	structurePattern: string;
	toneDescription: string;
	commonThemes: string[];
	perspective: string;
	style: string;
	devices: string[];
	technologies: string[];
	depth: string;
	audience: string;
}

interface Frontmatter {
	id?: string;
	title?: string;
	date?: string;
	author?: string;
	[key: string]: string | undefined;
}

interface ParseResult {
	frontmatter: Frontmatter;
	body: string;
}

// ====== Custom Errors ======
class FrontmatterError extends Error {
	constructor(message: string, filename?: string) {
		super(filename ? `${filename}: ${message}` : message);
		this.name = "FrontmatterError";
	}
}

class PostProcessingError extends Error {
	constructor(message: string, filename: string, cause?: Error) {
		super(`${filename}: ${message}`);
		this.name = "PostProcessingError";
		this.cause = cause;
	}
}

// ====== Utility Functions ======
function generateTimestampedFilename(
	prefix: string,
	extension: string
): string {
	const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
	return `${prefix}-${timestamp}.${extension}`;
}

function isValidDate(date: string): boolean {
	const parsed = new Date(date);
	return !isNaN(parsed.getTime()) && parsed.getFullYear() > 1900;
}

function getYearsFromPosts(posts: Post[]): number[] {
	const years = new Set<number>();
	posts.forEach((post) => {
		if (isValidDate(post.date)) {
			years.add(new Date(post.date).getFullYear());
		}
	});
	return Array.from(years).sort();
}

// ====== Markdown Parser ======
function parseFrontmatter(content: string, filename?: string): ParseResult {
	const lines = content.split("\n");

	if (lines[0] !== "---") {
		throw new FrontmatterError(
			"No frontmatter found - file must start with '---'",
			filename
		);
	}

	const endIndex = lines.findIndex(
		(line, index) => index > 0 && line === "---"
	);
	if (endIndex === -1) {
		throw new FrontmatterError(
			"Frontmatter not properly closed - missing closing '---'",
			filename
		);
	}

	const frontmatterLines = lines.slice(1, endIndex);
	const body = lines.slice(endIndex + 1).join("\n");
	const frontmatter: Frontmatter = {};

	for (const line of frontmatterLines) {
		const colonIndex = line.indexOf(":");
		if (colonIndex === -1) continue;

		const key = line.slice(0, colonIndex).trim();
		let value = line.slice(colonIndex + 1).trim();

		if (key && value) {
			// Remove quotes if present
			if (
				(value.startsWith('"') && value.endsWith('"')) ||
				(value.startsWith("'") && value.endsWith("'"))
			) {
				value = value.slice(1, -1);
			}
			frontmatter[key] = value;
		}
	}

	return { frontmatter, body };
}

// ====== Load Posts ======
async function loadPosts(authorName?: string): Promise<Post[]> {
	const posts: Post[] = [];
	const errors: string[] = [];

	try {
		const glob = new Bun.Glob("*.md");
		const files = await Array.fromAsync(glob.scan({ cwd: CONFIG.DATA_DIR }));

		console.log(`📁 Found ${files.length} markdown files`);

		for (const file of files) {
			try {
				const content = await Bun.file(`${CONFIG.DATA_DIR}${file}`).text();
				const { frontmatter, body } = parseFrontmatter(content, file);

				// Validate required fields
				if (!frontmatter.date || !isValidDate(frontmatter.date)) {
					throw new PostProcessingError("Invalid or missing date", file);
				}

				const post: Post = {
					id: frontmatter.id ? parseInt(frontmatter.id, 10) : 0,
					title: frontmatter.title || "Untitled",
					content: body,
					date: frontmatter.date,
					author: frontmatter.author || "Unknown",
				};

				// Validate parsed ID
				if (frontmatter.id && isNaN(post.id)) {
					console.warn(`⚠️  Invalid ID in ${file}: ${frontmatter.id}`);
					post.id = 0;
				}

				// Filter by author if specified
				if (authorName && post.author !== authorName) {
					continue;
				}

				posts.push(post);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				errors.push(`${file}: ${errorMsg}`);
				console.error(`❌ Error processing ${file}:`, errorMsg);
			}
		}

		if (errors.length > 0) {
			console.warn(
				`⚠️  ${errors.length} files failed to process out of ${files.length}`
			);
		}

		const authorMsg = authorName ? ` by ${authorName}` : "";
		console.log(`✅ Successfully loaded ${posts.length} posts${authorMsg}`);
		return posts;
	} catch (error) {
		throw new Error(`Failed to load posts from ${CONFIG.DATA_DIR}: ${error}`);
	}
}

// ====== Group Posts by Year ======
function groupByYear(posts: Post[]): Record<number, Post[]> {
	const grouped: Record<number, Post[]> = {};

	for (const post of posts) {
		if (!isValidDate(post.date)) {
			console.warn(`⚠️  Skipping post with invalid date: ${post.id}`);
			continue;
		}

		const year = new Date(post.date).getFullYear();
		if (!grouped[year]) {
			grouped[year] = [];
		}
		grouped[year].push(post);
	}

	return grouped;
}

// ====== Prompt Builder ======
function buildPrompt(year: number, posts: Post[]): string {
	const examples = posts
		.slice(0, CONFIG.POSTS_PER_YEAR)
		.map((post, index) => {
			const preview = post.content.slice(0, CONFIG.CONTENT_PREVIEW_LENGTH);
			return `Post ${index + 1}:\nTitle: ${post.title}\nAuthor: ${
				post.author
			}\nContent:\n${preview}`;
		})
		.join("\n\n");

	return `You are a writing analyst studying blog posts from the year ${year}.

Here are ${Math.min(posts.length, CONFIG.POSTS_PER_YEAR)} posts:

${examples}

Please analyze these posts and respond with the following information:
1. Writing perspective: first/second/third person?
2. Tone: formal, casual, narrative, reflective, etc.
3. Communication style: tutorial, narrative, persuasive?
4. Language devices: metaphors, humor, emojis, questions?
5. Common technologies/frameworks mentioned
6. Technical depth: light, medium, deep?
7. Audience: beginner, devs, consultants?
8. Blog structure pattern
9. Common themes

Respond in JSON format exactly like this:
{
  "year": ${year},
  "structurePattern": "...",
  "toneDescription": "...",
  "commonThemes": ["..."],
  "perspective": "...",
  "style": "...",
  "devices": ["..."],
  "technologies": ["..."],
  "depth": "...",
  "audience": "..."
}`;
}

// ====== Rate Limited Analysis ======
async function analyzeYearWithRetry(
	year: number,
	posts: Post[],
	retries = 3
): Promise<YearSummary | null> {
	const prompt = buildPrompt(year, posts);

	for (let attempt = 1; attempt <= retries; attempt++) {
		try {
			console.log(`🔍 Analyzing ${year}... (attempt ${attempt})`);

			const response = await generateAIText(prompt, "analysis");

			if (response === null) {
				throw new Error(
					"AI provider is set to 'local' mode - style analysis requires an AI provider"
				);
			}

			let jsonText = response.trim();

			// Handle markdown code blocks
			if (jsonText.startsWith("```json")) {
				jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
			} else if (jsonText.startsWith("```")) {
				jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
			}

			let parsed: YearSummary;

			try {
				parsed = JSON.parse(jsonText) as YearSummary;
			} catch (parseError) {
				throw new Error(`Invalid JSON response: ${parseError}`);
			}

			// Validate response structure
			if (!parsed.year || typeof parsed.year !== "number") {
				throw new Error("Response missing valid year field");
			}

			console.log(`✅ Year ${year} analyzed successfully`);
			return parsed;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			console.error(`❌ Attempt ${attempt} failed for ${year}: ${errorMsg}`);

			if (attempt < retries) {
				console.log(`⏳ Retrying in ${CONFIG.RATE_LIMIT_DELAY}ms...`);
				await setTimeout(CONFIG.RATE_LIMIT_DELAY);
			}
		}
	}

	console.error(`💥 All attempts failed for year ${year}`);
	return null;
}

// ====== Batch Processing with Rate Limiting ======
async function processYearsInBatches(
	years: number[],
	postsByYear: Record<number, Post[]>
): Promise<YearSummary[]> {
	const summaries: YearSummary[] = [];

	for (let i = 0; i < years.length; i += CONFIG.CONCURRENT_REQUESTS) {
		const batch = years.slice(i, i + CONFIG.CONCURRENT_REQUESTS);

		console.log(
			`📦 Processing batch ${
				Math.floor(i / CONFIG.CONCURRENT_REQUESTS) + 1
			}: years ${batch.join(", ")}`
		);

		const batchPromises = batch.map(async (year) => {
			const postsThisYear = postsByYear[year]?.slice(0, CONFIG.POSTS_PER_YEAR);
			if (!postsThisYear || postsThisYear.length === 0) {
				console.log(`⚠️  No posts for ${year}`);
				return null;
			}

			return analyzeYearWithRetry(year, postsThisYear);
		});

		const batchResults = await Promise.all(batchPromises);

		for (const result of batchResults) {
			if (result) {
				summaries.push(result);
			}
		}

		// Rate limiting between batches
		if (i + CONFIG.CONCURRENT_REQUESTS < years.length) {
			console.log(
				`⏳ Waiting ${CONFIG.RATE_LIMIT_DELAY}ms before next batch...`
			);
			await setTimeout(CONFIG.RATE_LIMIT_DELAY);
		}
	}

	return summaries;
}

// ====== Main Analysis Function ======
async function analyze(authorName?: string): Promise<void> {
	try {
		const authorMsg = authorName ? ` for ${authorName}` : "";
		console.log(`🚀 Starting blog style analysis${authorMsg}...`);

		const posts = await loadPosts(authorName);
		if (posts.length === 0) {
			const msg = authorName
				? `No posts found for author "${authorName}"`
				: "No posts loaded";
			throw new Error(`${msg} - cannot proceed with analysis`);
		}

		const postsByYear = groupByYear(posts);
		const years = getYearsFromPosts(posts);

		console.log(
			`📊 Found posts spanning ${years.length} years: ${years[0]} - ${
				years[years.length - 1]
			}`
		);

		const summaries = await processYearsInBatches(years, postsByYear);

		if (summaries.length === 0) {
			throw new Error("No successful analyses - cannot generate output");
		}

		// Save results
		const authorSuffix = authorName
			? `-${authorName.toLowerCase().replace(/\s+/g, "-")}`
			: "";
		const outputFile = generateTimestampedFilename(
			`${CONFIG.OUTPUT_PREFIX}${authorSuffix}`,
			"json"
		);
		await Bun.write(outputFile, JSON.stringify(summaries, null, 2));
		console.log(`💾 Analysis complete. Results saved to: ${outputFile}`);

		// Generate evolution summary
		await generateEvolutionSummary(summaries);
	} catch (error) {
		console.error(
			"💥 Analysis failed:",
			error instanceof Error ? error.message : String(error)
		);
		process.exit(1);
	}
}

// ====== Evolution Summary ======
async function generateEvolutionSummary(
	summaries: YearSummary[]
): Promise<void> {
	if (summaries.length < 2) {
		console.log(
			"📝 Skipping evolution summary - need at least 2 years of data"
		);
		return;
	}

	try {
		console.log("🧠 Generating evolution summary...");

		const evolutionPrompt = `You are an expert writing analyst. Given the following year-by-year summaries of blog post styles, analyze and compare how the writing evolved over time.

${summaries
	.map((summary) =>
		[
			`Year: ${summary.year}`,
			`Structure: ${summary.structurePattern}`,
			`Tone: ${summary.toneDescription}`,
			`Perspective: ${summary.perspective}`,
			`Style: ${summary.style}`,
			`Devices: ${summary.devices.join(", ")}`,
			`Technologies: ${summary.technologies.join(", ")}`,
			`Themes: ${summary.commonThemes.join(", ")}`,
			`Depth: ${summary.depth}`,
			`Audience: ${summary.audience}`,
		].join("\n")
	)
	.join("\n\n")}

Instructions:
- Write a detailed, structured analysis of how the blog's tone, audience, structure, and technologies have changed over the years.
- Highlight major trends, shifts, and turning points, referencing specific years and features.
- Use bullet points or sections for clarity.
- Identify any recurring patterns or notable one-off changes.
- Conclude with a concise summary of the overall evolution and its implications for the blog's direction or audience.`;

		const result = await generateAIText(evolutionPrompt, "analysis");

		if (result === null) {
			console.warn(
				"⚠️ AI provider is set to 'local' mode - skipping evolution summary"
			);
			return;
		}

		console.log("\n🧠 Evolution Summary:");
		console.log("=".repeat(50));
		console.log(result);
		console.log("=".repeat(50));
	} catch (error) {
		console.error(
			"❌ Failed to generate evolution summary:",
			error instanceof Error ? error.message : String(error)
		);
	}
}

// ====== Execute ======
if (import.meta.main) {
	// Setup graceful exit handling
	setupGracefulExit();

	const args = process.argv.slice(2);
	const authorName = args[0];

	if (args.includes("--help") || args.includes("-h")) {
		console.log("📊 Blog Style Analysis Over Time");
		console.log("");
		console.log("Usage: bun run scripts/analyzeStyleOverTime.ts [author-name]");
		console.log("");
		console.log("Arguments:");
		console.log(
			'  author-name    Filter posts by specific author (e.g., "Jacob Williams")'
		);
		console.log("");
		console.log("Options:");
		console.log("  --help, -h     Show this help message");
		console.log("");
		console.log("Description:");
		console.log(
			"  Analyzes writing style evolution year-by-year from blog posts"
		);
		console.log(
			"  Generates detailed insights about tone, structure, and themes"
		);
		console.log("");
		console.log("Examples:");
		console.log("  bun run scripts/analyzeStyleOverTime.ts");
		console.log('  bun run scripts/analyzeStyleOverTime.ts "Jacob Williams"');
		console.log("");
		console.log("Output:");
		console.log("  Creates timestamped JSON file with year-by-year analysis");
		console.log("  Displays evolution summary in console");
		process.exit(0);
	}

	analyze(authorName);
}
