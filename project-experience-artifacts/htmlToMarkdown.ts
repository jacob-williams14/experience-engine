import * as cheerio from "cheerio";
import { mkdir } from "node:fs/promises";
import { join } from "path";
import { setupGracefulExit } from "./lib/cliUtils.js";

interface PostData {
	id: number;
	title: { rendered: string };
	content: { rendered: string };
	slug: string;
	date: string;
	link: string;
	author?: number;
	excerpt?: { rendered: string };
	yoast_head_json?: {
		author?: string;
	};
}

function htmlToMarkdown(html: string): string {
	const $ = cheerio.load(html);
	let markdown = "";

	function processElement(element: any): string {
		const $el = $(element);
		const tagName = element.tagName?.toLowerCase();

		switch (tagName) {
			case "h1":
				return `# ${$el.text().trim()}\n\n`;
			case "h2":
				return `## ${$el.text().trim()}\n\n`;
			case "h3":
				return `### ${$el.text().trim()}\n\n`;
			case "h4":
				return `#### ${$el.text().trim()}\n\n`;
			case "h5":
				return `##### ${$el.text().trim()}\n\n`;
			case "h6":
				return `###### ${$el.text().trim()}\n\n`;

			case "p":
				const pContent = processChildren($el);
				return pContent.trim() ? `${pContent.trim()}\n\n` : "";

			case "blockquote":
				const quoteContent = processChildren($el);
				return (
					quoteContent
						.trim()
						.split("\n")
						.filter((line) => line.trim())
						.map((line) => `> ${line.trim()}`)
						.join("\n") + "\n\n"
				);

			case "a":
				const href = $el.attr("href");
				const text = $el.text().trim();
				return href ? `[${text}](${href})` : text;

			case "strong":
			case "b":
				return `**${$el.text().trim()}**`;

			case "em":
			case "i":
				return `*${$el.text().trim()}*`;

			case "code":
				return `\`${$el.text().trim()}\``;

			case "pre":
				const codeContent = $el.find("code").length
					? $el.find("code").text()
					: $el.text();
				return `\`\`\`\n${codeContent.trim()}\n\`\`\`\n\n`;

			case "ul":
				let ulResult = "";
				$el.children("li").each((_, li) => {
					const liContent = processChildren($(li));
					ulResult += `- ${liContent.trim()}\n`;
				});
				return ulResult + "\n";

			case "ol":
				let olResult = "";
				$el.children("li").each((index, li) => {
					const liContent = processChildren($(li));
					olResult += `${index + 1}. ${liContent.trim()}\n`;
				});
				return olResult + "\n";

			case "hr":
				return "---\n\n";

			case "br":
				return "\n";

			case "img":
				const src = $el.attr("src");
				const alt = $el.attr("alt") || "";
				return src ? `![${alt}](${src})` : "";

			default:
				return processChildren($el);
		}
	}

	function processChildren($el: any): string {
		let result = "";
		$el.contents().each((_: any, child: any) => {
			if (child.type === "text") {
				result += $(child).text();
			} else if (child.type === "tag") {
				result += processElement(child);
			}
		});
		return result;
	}

	$("body")
		.contents()
		.each((_: any, child: any) => {
			if (child.type === "tag") {
				markdown += processElement(child);
			} else if (child.type === "text") {
				const text = $(child).text().trim();
				if (text) {
					markdown += text + "\n\n";
				}
			}
		});

	// If no body tag, process the root elements
	if (!markdown.trim()) {
		$.root()
			.contents()
			.each((_: any, child: any) => {
				if (child.type === "tag") {
					markdown += processElement(child);
				} else if (child.type === "text") {
					const text = $(child).text().trim();
					if (text) {
						markdown += text + "\n\n";
					}
				}
			});
	}

	// Clean up extra whitespace
	return markdown
		.replace(/\n{3,}/g, "\n\n") // Replace 3+ newlines with 2
		.replace(/[ \t]+\n/g, "\n") // Remove trailing whitespace
		.trim();
}

async function convertPostToMarkdown(postFile: string): Promise<void> {
	try {
		const postPath = join("data/posts", postFile);
		const postData: PostData = JSON.parse(await Bun.file(postPath).text());

		const htmlContent = postData.content.rendered;
		const markdownContent = htmlToMarkdown(htmlContent);

		// Extract author name from yoast_head_json or fallback
		const authorName = postData.yoast_head_json?.author || "Unknown Author";

		// Create markdown with frontmatter
		const frontmatter = `---
title: "${postData.title.rendered.replace(/"/g, '\\"')}"
slug: "${postData.slug}"
date: "${postData.date}"
author: "${authorName.replace(/"/g, '\\"')}"
id: ${postData.id}
permalink: "${postData.link}"
---

`;

		const fullMarkdown = frontmatter + markdownContent;

		// Create data/posts-md directory if it doesn't exist
		const markdownDir = "data/posts-md";
		await mkdir(markdownDir, { recursive: true });

		// Write to markdown file in posts-md directory
		const markdownFile = postFile.replace(".json", ".md");
		const markdownPath = join(markdownDir, markdownFile);

		await Bun.write(markdownPath, fullMarkdown);
		console.log(`Converted ${postFile} to ${markdownDir}/${markdownFile}`);
	} catch (error) {
		console.error(`Error converting ${postFile}:`, error);
	}
}

// ===== CLI Interface =====
async function main() {
	const args = process.argv.slice(2);

	// Setup graceful exit handling
	setupGracefulExit();

	// Handle help flag
	if (args.includes("--help") || args.includes("-h") || args[0] === "help") {
		console.log("🔄 HTML to Markdown Converter");
		console.log("");
		console.log("Usage: bun run htmlToMarkdown.ts <command>");
		console.log("");
		console.log("Commands:");
		console.log(
			"  all                   Convert all JSON files in data/posts/"
		);
		console.log("  <post-file.json>      Convert a specific post file");
		console.log("");
		console.log("Options:");
		console.log("  --help, -h           Show this help message");
		console.log("");
		console.log("Description:");
		console.log(
			"  Converts downloaded blog post JSON files to markdown format"
		);
		console.log("  with proper frontmatter for voice analysis processing");
		console.log("");
		console.log("Examples:");
		console.log("  bun run htmlToMarkdown.ts all");
		console.log("  bun run htmlToMarkdown.ts post-162179.json");
		console.log("");
		console.log("Prerequisites:");
		console.log("  Run 'bun run getPosts.ts' first to download the blog posts");
		console.log("");
		console.log("Output:");
		console.log("  Markdown files are saved to data/posts-md/ directory");
		process.exit(0);
	}

	if (args.length === 0) {
		console.log("❌ No command provided");
		console.log("");
		console.log("Usage: bun run htmlToMarkdown.ts <command>");
		console.log('Commands: "all" or <post-file.json>');
		console.log("");
		console.log('Use "bun run htmlToMarkdown.ts --help" for more information');
		process.exit(1);
	}

	try {
		if (args[0] === "all") {
			// Convert all JSON files in posts directory
			console.log("🔄 Converting all blog posts to markdown...");
			console.log("📁 Source: data/posts/");
			console.log("📁 Output: data/posts-md/");
			console.log("");

			const postsDir = new Bun.Glob("*.json").scan("data/posts");
			const files = [];
			for await (const file of postsDir) {
				files.push(file);
			}

			if (files.length === 0) {
				console.log("⚠️  No JSON files found in data/posts/");
				console.log(
					"   Run 'bun run getPosts.ts' first to download blog posts"
				);
				process.exit(1);
			}

			console.log(`📝 Converting ${files.length} posts...`);
			await Promise.all(
				files.map((file: string) => convertPostToMarkdown(file))
			);

			console.log("");
			console.log(
				`✅ Successfully converted ${files.length} posts to markdown!`
			);
			console.log("📁 Markdown files saved to: data/posts-md/");
			console.log("");
			console.log(
				"Next step: Voice analysis is now available in biography generation"
			);
		} else {
			// Convert single file
			const filename = args[0];
			if (!filename) {
				console.error("❌ No filename provided");
				process.exit(1);
			}

			console.log(`🔄 Converting single post: ${filename}`);
			await convertPostToMarkdown(filename);
			console.log("✅ Conversion completed!");
		}
	} catch (err) {
		console.error("❌ Conversion failed:", err);
		process.exit(1);
	}
}

// Run main function
if (import.meta.main) {
	main();
}
