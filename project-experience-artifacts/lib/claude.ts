/**
 * Claude/Anthropic AI SDK integration utility
 * Provides Claude-specific model configuration and text generation
 */

import Anthropic from '@anthropic-ai/sdk';

// Claude model configurations
export const CLAUDE_MODELS = {
  // Claude 4 - Latest and most capable
  OPUS_4: 'claude-opus-4-1',
  SONNET_4: 'claude-sonnet-4-0',
  
  // Claude 3.7 - Strong performance
  SONNET_3_7: 'claude-3-7-sonnet-latest',
  
  // Claude 3.5 - Balanced performance and capability  
  HAIKU_3_5: 'claude-3-5-haiku-latest',
  SONNET_3_5: 'claude-3-5-sonnet-latest',
  
  // Claude 3 - Legacy but reliable
  OPUS_3: 'claude-3-opus-latest',
  HAIKU_3: 'claude-3-haiku-20240307',
} as const;

export type ClaudeModel = typeof CLAUDE_MODELS[keyof typeof CLAUDE_MODELS];

// Initialize Claude client
let claudeClient: Anthropic | null = null;

export function getClaudeClient(): Anthropic {
  if (!claudeClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY environment variable is required. ' +
        'Please set it with your Anthropic API key.'
      );
    }
    claudeClient = new Anthropic({ apiKey });
  }
  return claudeClient;
}

// Claude-compatible text generation function
export interface ClaudeGenerateOptions {
  model?: ClaudeModel;
  prompt: string;
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

export async function generateTextWithClaude({
  model = CLAUDE_MODELS.SONNET_4,
  prompt,
  maxTokens = 3000,
  temperature = 0.3,
  systemMessage,
}: ClaudeGenerateOptions): Promise<{ text: string; usage?: any }> {
  const client = getClaudeClient();
  
  try {
    const messages: Anthropic.MessageParam[] = [
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage,
      messages,
    });

    // Extract text from response
    const text = response.content
      .filter((content) => content.type === 'text')
      .map((content) => (content as any).text)
      .join('');

    return {
      text,
      usage: response.usage,
    };
  } catch (error) {
    console.error('Claude API Error:', error);
    throw new Error(`Claude generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to estimate token count (rough approximation)
export function estimateTokenCount(text: string): number {
  // Rough estimation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

// Model recommendation based on task complexity
export function recommendClaudeModel(taskComplexity: 'simple' | 'moderate' | 'complex'): ClaudeModel {
  switch (taskComplexity) {
    case 'simple':
      return CLAUDE_MODELS.HAIKU_3_5;
    case 'moderate':
      return CLAUDE_MODELS.SONNET_3_5;
    case 'complex':
      return CLAUDE_MODELS.OPUS_3;
    default:
      return CLAUDE_MODELS.SONNET_3_5;
  }
}
