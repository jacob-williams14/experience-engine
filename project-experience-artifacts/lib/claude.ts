/**
 * Claude/Anthropic AI SDK integration utility
 * Provides Claude-specific model configuration and text generation
 */

import Anthropic from '@anthropic-ai/sdk';

// Claude model configurations
export const CLAUDE_MODELS = {
  // Claude 4 - Latest and most capable
  OPUS_4_1: 'claude-opus-4-1-20250805',
  OPUS_4_1_ALIAS: 'claude-opus-4-1',
  OPUS_4: 'claude-opus-4-20250514', 
  OPUS_4_ALIAS: 'claude-opus-4-0',
  SONNET_4: 'claude-sonnet-4-20250514',
  SONNET_4_ALIAS: 'claude-sonnet-4-0',
  
  // Claude 3.7 - Strong performance
  SONNET_3_7: 'claude-3-7-sonnet-20250219',
  SONNET_3_7_LATEST: 'claude-3-7-sonnet-latest',
  
  // Claude 3.5 - Balanced performance and capability  
  HAIKU_3_5: 'claude-3-5-haiku-20241022',
  HAIKU_3_5_LATEST: 'claude-3-5-haiku-latest',
  SONNET_3_5: 'claude-3-5-sonnet-20241022',
  SONNET_3_5_LATEST: 'claude-3-5-sonnet-latest',
  SONNET_3_5_OLD: 'claude-3-5-sonnet-20240620',
  
  // Claude 3 - Legacy but reliable
  OPUS_3: 'claude-3-opus-20240229',
  OPUS_3_LATEST: 'claude-3-opus-latest',
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
  model = CLAUDE_MODELS.SONNET_3_5_LATEST,
  prompt,
  maxTokens = 4000,
  temperature = 0.3,
  systemMessage,
}: ClaudeGenerateOptions): Promise<{ text: string; usage?: any }> {
  const client = getClaudeClient();
  
  console.log(`📡 Claude API: Sending request to ${model}...`);
  console.log(`📏 Prompt length: ${prompt.length} characters`);
  console.log(`⚙️ Max tokens: ${maxTokens}, Temperature: ${temperature}`);
  
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
    }).catch(async (err) => {
      if (err instanceof Anthropic.APIError) {
        console.error(`❌ Claude API Error: ${err.status} - ${err.name}`);
        console.error(`📄 Headers: ${JSON.stringify(err.headers)}`);
        console.error(`📝 Message: ${err.message}`);
        
        // Provide specific guidance based on error type
        if (err.status === 400) {
          throw new Error(`Claude API Bad Request (400): ${err.message}. Check if model '${model}' is valid and available.`);
        } else if (err.status === 401) {
          throw new Error(`Claude API Unauthorized (401): ${err.message}. Check your ANTHROPIC_API_KEY.`);
        } else if (err.status === 429) {
          throw new Error(`Claude API Rate Limited (429): ${err.message}. Please try again later.`);
        } else {
          throw new Error(`Claude API Error (${err.status}): ${err.message}`);
        }
      } else {
        console.error('Non-API Error:', err);
        throw err;
      }
    });

    console.log('✅ Claude API: Response received successfully');
    console.log(`📊 Usage: ${JSON.stringify(response.usage)}`);

    // Extract text from response
    const text = response.content
      .filter((content) => content.type === 'text')
      .map((content) => (content as any).text)
      .join('');

    console.log(`📝 Response length: ${text.length} characters`);

    return {
      text,
      usage: response.usage,
    };
  } catch (error) {
    // Handle any errors that weren't caught by the .catch() above
    if (error instanceof Error) {
      throw error; // Re-throw the error as-is
    }
    throw new Error(`Unexpected Claude generation error: ${error}`);
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
