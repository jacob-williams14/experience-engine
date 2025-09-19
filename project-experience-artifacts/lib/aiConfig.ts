/**
 * AI Configuration Management
 * Simple persistent storage for AI provider preferences
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { CLAUDE_MODELS } from "./claude.js";

export type AIProvider = "openai" | "claude" | "local";

export interface AIConfig {
	provider: AIProvider;
	lastUpdated: string;
	models: {
		openai?: {
			default: string;
			analysis: string;
			bio: string;
		};
		claude?: {
			default: string;
			analysis: string;
			bio: string;
		};
	};
}

const CONFIG_FILE_NAME = ".ai-config.json";
const DEFAULT_CONFIG: AIConfig = {
	provider: "local",
	lastUpdated: new Date().toISOString(),
	models: {
		openai: {
			default: "gpt-4o-mini",
			analysis: "gpt-4o",
			bio: "gpt-4o",
		},
		claude: {
			default: CLAUDE_MODELS.SONNET_3_5_LATEST,
			analysis: CLAUDE_MODELS.SONNET_4,
			bio: CLAUDE_MODELS.SONNET_4,
		},
	},
};

/**
 * Get the path to the AI config file
 */
function getConfigPath(): string {
	return join(process.cwd(), CONFIG_FILE_NAME);
}

/**
 * Load AI configuration from disk
 */
export function loadAIConfig(): AIConfig {
	const configPath = getConfigPath();

	if (!existsSync(configPath)) {
		return DEFAULT_CONFIG;
	}

	try {
		const configData = readFileSync(configPath, "utf-8");
		const config = JSON.parse(configData) as AIConfig;

		// Ensure config has all required fields (migration safety)
		return {
			...DEFAULT_CONFIG,
			...config,
			models: {
				...DEFAULT_CONFIG.models,
				...config.models,
			},
		};
	} catch (error) {
		console.warn("⚠️  Failed to load AI config, using defaults:", error);
		return DEFAULT_CONFIG;
	}
}

/**
 * Save AI configuration to disk
 */
export function saveAIConfig(config: Partial<AIConfig>): void {
	const currentConfig = loadAIConfig();
	const newConfig: AIConfig = {
		...currentConfig,
		...config,
		lastUpdated: new Date().toISOString(),
		models: {
			...currentConfig.models,
			...config.models,
		},
	};

	try {
		const configPath = getConfigPath();
		writeFileSync(configPath, JSON.stringify(newConfig, null, 2), "utf-8");
	} catch (error) {
		throw new Error(`Failed to save AI config: ${error}`);
	}
}

/**
 * Get the currently configured AI provider
 */
export function getCurrentProvider(): AIProvider {
	return loadAIConfig().provider;
}

/**
 * Set the AI provider
 */
export function setAIProvider(provider: AIProvider): void {
	saveAIConfig({ provider });
}

/**
 * Get model name for a specific task using current provider
 */
export function getModelForTask(
	task: "default" | "analysis" | "bio"
): string | null {
	const config = loadAIConfig();
	const provider = config.provider;

	if (provider === "local") {
		return null; // Local mode doesn't use models
	}

	const models = config.models[provider];
	if (!models) {
		throw new Error(`No model configuration found for provider: ${provider}`);
	}

	return models[task];
}

/**
 * Check if current provider is properly configured (has API key)
 */
export function isProviderConfigured(provider?: AIProvider): boolean {
	const targetProvider = provider || getCurrentProvider();

	switch (targetProvider) {
		case "openai":
			return !!process.env.OPENAI_API_KEY;
		case "claude":
			return !!process.env.ANTHROPIC_API_KEY;
		case "local":
			return true; // Local mode doesn't need API keys
		default:
			return false;
	}
}

/**
 * Get configuration status summary
 */
export function getConfigStatus(): {
	currentProvider: AIProvider;
	isConfigured: boolean;
	availableProviders: AIProvider[];
	configPath: string;
} {
	const currentProvider = getCurrentProvider();
	const availableProviders: AIProvider[] = ["local"];

	if (process.env.OPENAI_API_KEY) {
		availableProviders.push("openai");
	}

	if (process.env.ANTHROPIC_API_KEY) {
		availableProviders.push("claude");
	}

	return {
		currentProvider,
		isConfigured: isProviderConfigured(),
		availableProviders,
		configPath: getConfigPath(),
	};
}
