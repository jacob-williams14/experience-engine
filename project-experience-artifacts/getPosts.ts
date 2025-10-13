import { setupGracefulExit } from "./lib/cliUtils.js";

const BASE_URL = "https://spin.atomicobject.com";
const PER_PAGE = 100;
const OUTPUT_DIR = "./data/posts";

interface WPPost {
	id: number;
	title: { rendered: string };
	content: { rendered: string };
	date: string;
	slug: string;
	// Add more fields as needed
}

async function fetchAllPosts(): Promise<WPPost[]> {
	const allPosts: WPPost[] = [];
	let page = 1;

	while (true) {
		const url = `${BASE_URL}/wp-json/wp/v2/posts?per_page=${PER_PAGE}&page=${page}`;
		console.log(`Fetching page ${page}...`);

		const res = await fetch(url);

		// WordPress returns 400 when requesting a page beyond available pages
		if (res.status === 400) {
			console.log(`Reached end of posts at page ${page}`);
			break;
		}

		if (!res.ok) {
			throw new Error(`Failed to fetch page ${page}: ${res.statusText}`);
		}

		const posts = (await res.json()) as WPPost[];
		if (posts.length === 0) break;

		allPosts.push(...posts);
		page++;
	}

	return allPosts;
}

async function ensureOutputDir() {
	try {
		await Bun.write(`${OUTPUT_DIR}/.gitkeep`, "");
	} catch {
		console.log(`Creating output directory: ${OUTPUT_DIR}`);
		const proc = Bun.spawn(["mkdir", "-p", OUTPUT_DIR]);
		await proc.exited;
	}
}

async function saveEachPost(posts: WPPost[]) {
	for (const post of posts) {
		try {
			const filename = `${OUTPUT_DIR}/post-${post.id}.json`;
			const json = JSON.stringify(post, null, 2);
			await Bun.write(filename, json);
			console.log(`Saved: ${filename}`);
		} catch (err) {
			console.error(`Failed to save post ${post.id}:`, err);
		}
	}
}

// ===== CLI Interface =====
async function main() {
	const args = process.argv.slice(2);

	// Setup graceful exit handling
	setupGracefulExit();

	// Handle help flag
	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log("📥 Atomic Spin Blog Posts Downloader");
		console.log("");
		console.log("Usage: bun run getPosts.ts");
		console.log("");
		console.log("Description:");
		console.log(
			"  Downloads ALL blog posts from spin.atomicobject.com for voice analysis"
		);
		console.log(
			"  This is a one-time setup step that creates a local database of posts"
		);
		console.log("  Posts are saved as JSON files in ./data/posts/ directory");
		console.log("");
		console.log("Options:");
		console.log("  --help, -h    Show this help message");
		console.log("");
		console.log("Next steps:");
		console.log("  1. Convert to markdown: bun run htmlToMarkdown.ts all");
		console.log(
			'  2. Analyze specific author: bun run scripts/analyzeAuthorStyle.ts "Author Name"'
		);
		console.log("");
		console.log("Note:");
		console.log(
			"  This downloads all posts once, then you can analyze any author locally."
		);
		console.log(
			"  The download may take several minutes but only needs to be done once."
		);
		process.exit(0);
	}

	try {
		console.log("📥 Starting Atomic Spin blog posts download...");
		console.log(`📁 Output directory: ${OUTPUT_DIR}`);
		console.log("");

		await ensureOutputDir();
		const posts = await fetchAllPosts();
		await saveEachPost(posts);

		console.log("");
		console.log(
			`✅ Successfully downloaded ${posts.length} posts to "${OUTPUT_DIR}/"`
		);
		console.log("");
		console.log("Next step: Convert to markdown format:");
		console.log("  bun run htmlToMarkdown.ts all");
	} catch (err) {
		console.error("❌ Error:", err);
		process.exit(1);
	}
}

// Run main function
if (import.meta.main) {
	main();
}
