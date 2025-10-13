/**
 * Simple AI abstraction - reads config and generates text
 */

import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getCurrentProvider, getModelForTask } from "./aiConfig.js";
import { generateTextWithClaude, type ClaudeModel } from "./claude.js";

/**
 * Generate text using the configured AI provider
 * Returns null for local mode (prompt generation)
 */
// Task configuration presets
const TASK_CONFIGS = {
	detailed: { temperature: 0.3, maxTokens: 4000 },
	creative: { temperature: 0.7, maxTokens: 6000 },
	concise: { temperature: 0.2, maxTokens: 3000 },
} as const;

export async function generateAIText(
	prompt: string,
	task: "detailed" | "creative" | "concise" = "detailed"
): Promise<string | null> {
	const provider = getCurrentProvider();

	// Local mode - return null so caller knows to generate prompt
	if (provider === "local") {
		return null;
	}

	const model = getModelForTask(task);
	if (!model) {
		throw new Error(`No model configured for ${provider} ${task}`);
	}

	const taskConfig = TASK_CONFIGS[task];

	if (provider === "claude") {
		const result = await generateTextWithClaude({
			prompt,
			model: model as ClaudeModel,
			temperature: taskConfig.temperature,
			maxTokens: taskConfig.maxTokens,
		});
		return result.text;
	}

	if (provider === "openai") {
		const result = await generateText({
			model: openai(model),
			prompt,
			temperature: taskConfig.temperature,
			maxTokens: taskConfig.maxTokens,
		});
		return result.text;
	}

	throw new Error(`Unknown provider: ${provider}`);
}
