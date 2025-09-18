/**
 * Simple AI abstraction - reads config and generates text
 */

import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { generateTextWithClaude, type ClaudeModel } from "./claude.js";
import { getCurrentProvider, getModelForTask } from "./aiConfig.js";

/**
 * Generate text using the configured AI provider
 * Returns null for local mode (prompt generation)
 */
export async function generateAIText(
  prompt: string,
  task: 'analysis' | 'bio' = 'analysis'
): Promise<string | null> {
  const provider = getCurrentProvider();
  
  // Local mode - return null so caller knows to generate prompt
  if (provider === 'local') {
    return null;
  }
  
  const model = getModelForTask(task);
  if (!model) {
    throw new Error(`No model configured for ${provider} ${task}`);
  }
  
  if (provider === 'claude') {
    const result = await generateTextWithClaude({
      prompt,
      model: model as ClaudeModel,
      temperature: 0.3,
      maxTokens: 3000,
    });
    return result.text;
  }
  
  if (provider === 'openai') {
    const result = await generateText({
      model: openai(model),
      prompt,
      temperature: 0.3,
      maxTokens: 3000,
    });
    return result.text;
  }
  
  throw new Error(`Unknown provider: ${provider}`);
}
