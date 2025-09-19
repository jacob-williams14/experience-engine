#!/usr/bin/env bun

/**
 * AI Configuration Script
 * Interactive setup for AI provider preferences
 */

import { confirm, select } from "@inquirer/prompts";
import {
	getConfigStatus,
	loadAIConfig,
	setAIProvider,
	type AIProvider,
} from "../lib/aiConfig.js";

/**
 * Display current configuration status
 */
function displayStatus() {
	const status = getConfigStatus();

	console.log("\n🤖 AI Configuration Status");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(
		`Current Provider: ${status.currentProvider} ${
			status.isConfigured ? "✅" : "❌"
		}`
	);
	console.log(`Available Providers: ${status.availableProviders.join(", ")}`);
	console.log(`Config File: ${status.configPath}`);

	if (!status.isConfigured && status.currentProvider !== "local") {
		console.log(
			`\n⚠️  ${status.currentProvider.toUpperCase()} is selected but not configured!`
		);
		if (status.currentProvider === "openai") {
			console.log("   Set OPENAI_API_KEY environment variable");
		} else if (status.currentProvider === "claude") {
			console.log("   Set ANTHROPIC_API_KEY environment variable");
		}
	}
}

/**
 * Interactive provider selection
 */
async function selectProvider(): Promise<void> {
	const status = getConfigStatus();

	console.log("\n🔧 Configure AI Provider");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	// Build choices array with only available providers
	const choices = [
		{
			name: "local - Generate prompts for copy/paste (no API key needed) ✅",
			value: "local" as AIProvider,
			description: "Always available - generates prompts for manual copy/paste",
		},
	];

	if (status.availableProviders.includes("openai")) {
		choices.push({
			name: "openai - Use OpenAI GPT models (API key detected) ✅",
			value: "openai" as AIProvider,
			description: "Automatic processing with GPT models",
		});
	}

	if (status.availableProviders.includes("claude")) {
		choices.push({
			name: "claude - Use Anthropic Claude models (API key detected) ✅",
			value: "claude" as AIProvider,
			description: "Automatic processing with Claude models",
		});
	}

	// Show info about unavailable providers
	const unavailableProviders = [];
	if (!status.availableProviders.includes("openai")) {
		unavailableProviders.push("OpenAI (set OPENAI_API_KEY)");
	}
	if (!status.availableProviders.includes("claude")) {
		unavailableProviders.push("Claude (set ANTHROPIC_API_KEY)");
	}

	if (unavailableProviders.length > 0) {
		console.log(
			`\n📝 Note: Additional providers available with API keys: ${unavailableProviders.join(
				", "
			)}`
		);
	}

	const selectedProvider = await select({
		message: "Select AI provider:",
		choices,
		default: status.currentProvider,
	});

	// Confirm the selection if it's different from current
	if (selectedProvider !== status.currentProvider) {
		const confirmed = await confirm({
			message: `Switch to ${selectedProvider.toUpperCase()} provider?`,
			default: true,
		});

		if (!confirmed) {
			console.log("❌ Configuration cancelled");
			return;
		}
	}

	try {
		setAIProvider(selectedProvider);
		console.log("\n✅ Configuration saved successfully!");

		// Show next steps
		if (selectedProvider === "local") {
			console.log("\n🎯 Local mode selected:");
			console.log("   • Scripts will generate prompts for copy/paste");
			console.log("   • Prompts saved to locally-generated-prompts/ directory");
		} else {
			console.log(`\n🚀 ${selectedProvider.toUpperCase()} mode selected:`);
			console.log("   • Scripts will automatically use AI for analysis");
			console.log(
				`   • Using ${
					selectedProvider === "openai" ? "GPT" : "Claude"
				} models for processing`
			);
		}
	} catch (error) {
		console.error("❌ Failed to save configuration:", error);
	}
}

/**
 * Show model configuration
 */
function showModels() {
	const config = loadAIConfig();

	console.log("\n🎛️  Model Configuration");
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	Object.entries(config.models).forEach(([provider, models]) => {
		if (models) {
			console.log(`\n${provider.toUpperCase()}:`);
			console.log(`  • Default:  ${models.default}`);
			console.log(`  • Analysis: ${models.analysis}`);
			console.log(`  • Bio:      ${models.bio}`);
		}
	});
}

/**
 * Reset configuration to defaults
 */
function resetConfig() {
	console.log("\n🔄 Resetting to default configuration...");

	try {
		setAIProvider("local");
		console.log("✅ Configuration reset to defaults (local mode)");
	} catch (error) {
		console.error("❌ Failed to reset configuration:", error);
	}
}

/**
 * Main CLI interface
 */
async function main() {
	const args = process.argv.slice(2);
	const command = args[0];

	console.log("🤖 Project Experience Artifacts - AI Configuration");

	switch (command) {
		case "status":
			displayStatus();
			break;

		case "set":
			const provider = args[1] as AIProvider;
			if (!provider || !["local", "openai", "claude"].includes(provider)) {
				console.error("Usage: configureAI set <local|openai|claude>");
				process.exit(1);
			}

			console.log(`Setting provider to: ${provider}`);
			try {
				setAIProvider(provider);
				console.log("✅ Configuration saved!");
				displayStatus();
			} catch (error) {
				console.error("❌ Failed to save configuration:", error);
				process.exit(1);
			}
			break;

		case "models":
			showModels();
			break;

		case "reset":
			resetConfig();
			displayStatus();
			break;

		case "interactive":
		case undefined:
			displayStatus();
			await selectProvider();
			console.log("");
			displayStatus();
			break;

		default:
			console.log("\nUsage: bun run scripts/configureAI.ts [command]");
			console.log("");
			console.log("Commands:");
			console.log("  (none)              Interactive configuration");
			console.log("  status              Show current configuration");
			console.log(
				"  set <provider>      Set AI provider (local|openai|claude)"
			);
			console.log("  models              Show model configuration");
			console.log("  reset               Reset to default configuration");
			console.log("");
			console.log("Examples:");
			console.log("  bun run scripts/configureAI.ts");
			console.log("  bun run scripts/configureAI.ts status");
			console.log("  bun run scripts/configureAI.ts set claude");
			break;
	}
}

if (import.meta.main) {
	main().catch(console.error);
}
