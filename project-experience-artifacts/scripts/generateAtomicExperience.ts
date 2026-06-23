#!/usr/bin/env bun

/**
 * Atomic Object LinkedIn Experience Synthesis Script
 * Combines per-project LinkedIn artifacts into a single cohesive LinkedIn Experience entry
 * organized by themes rather than individual projects.
 */

import { existsSync } from "fs";
import { readdir } from "fs/promises";
import { generateAIText } from "../lib/ai.js";
import { getCurrentProvider } from "../lib/aiConfig.js";
import { setupGracefulExit } from "../lib/cliUtils.js";

export interface AtomicExperienceOptions {
	developerName: string;
	linkedInSourcePaths: string[];
	roleContext: string;
	companyContext: string;
	experienceYears?: string;
	growthArc?: string;
	voiceSignature?: string;
	interactive?: boolean;
}

/**
 * Discover per-project LinkedIn files from linkedin-experience/ directory
 */
export async function discoverLinkedInFiles(): Promise<string[]> {
	const dir = "linkedin-experience";
	if (!existsSync(dir)) {
		return [];
	}

	const files = await readdir(dir);
	return files
		.filter(f =>
			f.endsWith(".md") &&
			!f.includes("atomic-object-experience") &&
			!f.includes("all-projects")
		)
		.sort()
		.map(f => `${dir}/${f}`);
}

/**
 * Extract just the actionable writing guidance from a full voice signature.
 * The full signature includes literary analysis that's useful for understanding
 * but too verbose for prompt injection — we just need the rules.
 */
function extractVoiceGuidance(fullSignature: string): string {
	const marker = '## Writing Guidance Summary';
	const idx = fullSignature.indexOf(marker);
	if (idx !== -1) {
		return fullSignature.slice(idx).trim();
	}
	// Fallback: if the signature doesn't have the expected section, use the last 30% as a heuristic
	const lines = fullSignature.split('\n');
	const startLine = Math.floor(lines.length * 0.7);
	return lines.slice(startLine).join('\n').trim();
}

/**
 * Extract just the bullet content from a per-project LinkedIn file,
 * stripping metadata headers and footers.
 */
function extractBulletContent(fileContent: string, filePath: string): string {
	const lines = fileContent.split('\n');

	// Extract project name from the first heading
	let projectName = filePath.split('/').pop()?.replace('-linkedin-experience.md', '') || 'Unknown';
	for (const line of lines) {
		if (line.startsWith('# ')) {
			projectName = line.replace('# ', '').replace(' - LinkedIn Experience', '').trim();
			break;
		}
	}

	// Primary strategy: grab lines that start with • (the actual bullets)
	const bullets: string[] = [];
	for (const line of lines) {
		const trimmed = line.trim();
		if (trimmed.startsWith('•')) {
			bullets.push(line);
		}
	}

	return `### ${projectName}\n${bullets.join('\n')}`;
}

/**
 * Load and combine per-project LinkedIn files
 */
async function loadLinkedInSources(paths: string[]): Promise<string[]> {
	const sources: string[] = [];

	for (const path of paths) {
		try {
			const content = await Bun.file(path).text();
			sources.push(extractBulletContent(content, path));
		} catch (error) {
			console.warn(`⚠️  Could not load: ${path}`);
		}
	}

	if (sources.length === 0) {
		throw new Error("No per-project LinkedIn files could be loaded");
	}

	console.log(`📊 Loaded ${sources.length} per-project LinkedIn artifacts`);
	return sources;
}

/**
 * Create the synthesis prompt
 */
function createSynthesisPrompt(
	projectBullets: string[],
	options: AtomicExperienceOptions,
	voiceSignature?: string
): string {
	const roleLens: Record<string, string> = {
		'senior-engineer': 'Senior Software Engineer — emphasize technical depth and independent delivery across domains.',
		'staff-engineer': 'Staff Engineer — emphasize architectural thinking, cross-project patterns, and technical influence.',
		'principal-engineer': 'Principal Engineer — emphasize technical vision and shaping engineering direction across the org.',
		'eng-manager': 'Engineering Manager — emphasize team leadership, delivery outcomes, and growing engineers.',
		'tech-lead': 'Technical Lead — emphasize both hands-on technical work and leadership growth.',
		'full-stack': 'Full-Stack Developer — emphasize breadth across the stack and rapid context switching.',
	};

	const companyLens: Record<string, string> = {
		'big-tech': 'For big tech: lean toward scale, system design, and technical rigor.',
		'startup': 'For startups: lean toward speed, ownership, and wearing multiple hats.',
		'enterprise': 'For enterprise: lean toward reliability, integration complexity, and business value.',
		'mid-startup': 'For mid-stage startups: lean toward scaling systems and engineering maturity.',
		'general': 'General: balance technical depth with business impact and adaptability.',
	};

	const combinedBullets = projectBullets.join('\n\n');

	const growthArc = options.growthArc
		? `\nGROWTH ARC: ${options.growthArc}`
		: '';

	const experienceYears = options.experienceYears
		? `\nTENURE: ${options.experienceYears} at Atomic Object`
		: '';

	return `You are writing a single LinkedIn Experience entry for ${options.developerName} at Atomic Object, a custom software consultancy.

${options.developerName} has worked across multiple client projects at this consultancy. Below are per-project bullet points that capture the highlights of each engagement. Your job is to SYNTHESIZE these into one cohesive LinkedIn Experience description — NOT a project-by-project list.
${experienceYears}${growthArc}

STRUCTURE:
1. A 1-2 sentence summary with personality. It should convey who they are and what drives them — not restate what the bullets will cover. Don't summarize the domains or say "different challenges." Show attitude or perspective instead.
2. 4 bullet points organized by THEME, not by project. Pick from themes like: technical leadership, cross-domain adaptability, system design, growth trajectory. Only 4 — force yourself to cut the weakest one.

BREVITY IS NON-NEGOTIABLE:
- Each bullet is ONE concise sentence. No compound sentences joined by em-dashes, semicolons, or "and."
- No lists within a bullet. ONE specific example beats three generic ones.
- If a bullet has a comma-separated list of more than two items, it's too long. Cut it. (This limit applies to the SENTENCE only, not the tech-stack tag below.)
- This is LinkedIn. People scan in 5 seconds. Dense, punchy, specific.

KEYWORDS — REQUIRED, REPRODUCIBLE:
- End EVERY bullet with a parenthetical tech-stack tag listing the concrete technologies from that bullet's source material, e.g. "(React Native, Expo, Stripe, EAS Build)".
- Pull ONLY from the source bullets — never invent a technology that isn't there. If a source bullet names no specific tech, use the closest accurate category present (e.g. "(REST API design)") rather than fabricating a stack.
- Keep the tag to the 2-5 most recruiter-relevant terms; these are search keywords, so prefer named frameworks/languages/services (React Native, TypeScript, .NET, Laravel, PostgreSQL, Contentful, CI/CD) over generic words.
- The tag lives OUTSIDE the one-sentence prose and does not count against the brevity rules above.

BALANCE PROFESSIONAL VOCABULARY WITH HUMAN VOICE:
- Use industry-standard terms that recruiters search for (React Native, CI/CD, API design, system design, technical lead, full-stack). These are keywords — keep them.
- But frame work in terms of PROBLEMS SOLVED and OUTCOMES, not feature lists or implementation details.
- BAD (too jargony): "Implemented schema validation and dynamic parsing for nested content structures with OPIS integration"
- BAD (too casual): "Figured out how to let editors publish stuff without breaking the site"
- GOOD: "Designed the content architecture for a global learning platform, solving complex nested content modeling challenges that let non-technical teams publish across multiple languages"
- The sweet spot: professional vocabulary + clear problem + human outcome. A recruiter should understand what you did AND find you in a keyword search.
- Lead with WHAT WAS HARD or WHAT WAS UNUSUAL, then describe the outcome.
- Every bullet should make the STAKES clear — who benefits, what was at risk.

ROLE LENS: ${roleLens[options.roleContext] || roleLens['tech-lead']}
COMPANY LENS: ${companyLens[options.companyContext] || companyLens['general']}

WHAT MAKES THIS COMPELLING:
- The consultancy breadth IS the differentiator — make it central, not incidental
- Show that they can ramp up fast in unfamiliar domains and deliver
- The growth from IC to tech lead across these projects tells a story — surface it
- Name the actual domains (healthcare, courts, education, retail) — that specificity beats generic "diverse industries" every time
- At least one bullet should be a HOOK — a specific, hard problem that makes a recruiter think "I need to talk to this person." Describe it in terms anyone could understand.
- Signal scale or impact where the source material supports it, but in plain language ("systems real people depend on," "apps that went to the App Store," "tools used across an entire state court system").
- Avoid generic collaboration bullets ("worked with designers to translate requirements into components") — every developer does this. If collaboration is mentioned, it should describe a SPECIFIC outcome that required unusual cross-functional work.

CLIENT CONFIDENTIALITY:
- Do NOT name specific clients, companies, or products from the source material
- Describe projects by their DOMAIN and the WORK done, not by client name
- Example: instead of "Biggby Coffee's mobile ordering app" write "a greenfield mobile ordering app for a national coffee chain"
- Instead of "Michigan's MiCOURT ecosystem" write "a state judicial information system"
- The only company name that should appear is Atomic Object

WHAT TO AVOID:
- Listing projects sequentially (this is a synthesis, not a list)
- Repeating the same action verb patterns across bullets
- Generic consultancy language ("delivered solutions for diverse clients")
- Inventing metrics, numbers, or narrative details not present in the source material (e.g., don't add COVID pivots, user counts, or timeline details that aren't in the bullets)
- Any commentary, notes, or disclaimers

PER-PROJECT SOURCE MATERIAL:
${combinedBullets}
${voiceSignature ? `
VOICE & TONE — OVERRIDE ALL PREVIOUS STYLE GUIDANCE:
Write this in ${options.developerName}'s authentic voice. It should sound like THEM, not like corporate LinkedIn copy.

${extractVoiceGuidance(voiceSignature)}

Write naturally in this voice. Shorter sentences are fine. Conversational is fine. It should sound like a real person, not a template.
` : ''}
Return the summary paragraph followed by the bullet points (using • symbols). No headers, no metadata, no notes.`;
}

/**
 * Main synthesis function
 */
export async function generateAtomicExperience(options: AtomicExperienceOptions): Promise<void> {
	try {
		setupGracefulExit();

		if (!options.developerName) {
			throw new Error('Developer name is required');
		}

		if (!options.linkedInSourcePaths || options.linkedInSourcePaths.length === 0) {
			throw new Error('At least one per-project LinkedIn file is required');
		}

		console.log('\n🔄 Synthesizing LinkedIn Experience entry...');
		console.log(`👤 Developer: ${options.developerName}`);
		console.log(`📄 Source files: ${options.linkedInSourcePaths.length}`);

		// Load per-project content
		const projectBullets = await loadLinkedInSources(options.linkedInSourcePaths);

		// Load voice signature if available
		let voiceSignature = options.voiceSignature;
		if (!voiceSignature) {
			try {
				const { getVoiceAnalysis } = await import("../lib/voiceHelper.js");
				const voiceResult = await getVoiceAnalysis(options.developerName);
				if (voiceResult.success) {
					voiceSignature = voiceResult.voiceSignature;
					console.log(`🎤 Voice signature ${voiceResult.fromCache ? 'loaded from cache' : 'analyzed'}`);
				}
			} catch {
				console.log('📝 No voice signature available, using default tone');
			}
		}

		// Build synthesis prompt
		const prompt = createSynthesisPrompt(projectBullets, options, voiceSignature);

		console.log('\n🤖 Generating synthesized LinkedIn Experience entry...');

		const result = await generateAIText(prompt, "creative");

		const outputSlug = options.developerName.toLowerCase().replace(/\s+/g, '-');

		if (result === null) {
			// === LOCAL MODE ===
			console.log('\n🎯 Local mode: Generated Synthesis Prompt');
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			console.log(prompt);
			console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
			console.log('\n📋 Copy the above prompt and paste it into your AI tool!');

			const promptFilePath = `locally-generated-prompts/${outputSlug}-atomic-experience-prompt.md`;
			await Bun.write(promptFilePath, prompt);
			console.log(`✅ Prompt saved to: ${promptFilePath}`);
			return;
		}

		// === AI MODE ===
		// Strip any trailing AI commentary
		const synthesizedContent = result
			.replace(/\n\s*Note:.*$/s, '')
			.replace(/\n\s*\*Note:.*$/s, '')
			.trim();

		const outputPath = `linkedin-experience/${outputSlug}-atomic-object-experience.md`;

		const formattedOutput = `# ${options.developerName} — Atomic Object LinkedIn Experience

**Generated:** ${new Date().toISOString().split('T')[0]}
**Role Lens:** ${options.roleContext} | **Company Lens:** ${options.companyContext}
**Sources:** ${options.linkedInSourcePaths.map(p => p.split('/').pop()).join(', ')}

---

${synthesizedContent}

---

*AI Provider: ${getCurrentProvider()}*`;

		await Bun.write(outputPath, formattedOutput);

		console.log('\n✅ Synthesized LinkedIn Experience entry generated!');
		console.log(`📁 Saved to: ${outputPath}`);

		console.log('\n📋 Generated Content:');
		console.log('─'.repeat(60));
		console.log(synthesizedContent);
		console.log('─'.repeat(60));

		if (options.interactive) {
			console.log('\n🔗 Next Steps:');
			console.log('   • Review and personalize the content');
			console.log('   • Copy into your LinkedIn Experience section for Atomic Object');
			console.log('   • Add your title and employment dates');
		}

	} catch (error) {
		console.error('\n❌ Error generating synthesized LinkedIn Experience:');
		if (error instanceof Error) {
			console.error(`   ${error.message}`);
		} else {
			console.error('   Unknown error occurred');
		}
		throw error;
	}
}
