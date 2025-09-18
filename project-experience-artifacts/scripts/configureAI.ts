#!/usr/bin/env bun

/**
 * AI Configuration Script
 * Interactive setup for AI provider preferences
 */

import { 
  getConfigStatus, 
  setAIProvider, 
  type AIProvider,
  saveAIConfig,
  loadAIConfig 
} from '../lib/aiConfig.js';

/**
 * Display current configuration status
 */
function displayStatus() {
  const status = getConfigStatus();
  
  console.log('\n🤖 AI Configuration Status');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Current Provider: ${status.currentProvider} ${status.isConfigured ? '✅' : '❌'}`);
  console.log(`Available Providers: ${status.availableProviders.join(', ')}`);
  console.log(`Config File: ${status.configPath}`);
  
  if (!status.isConfigured && status.currentProvider !== 'local') {
    console.log(`\n⚠️  ${status.currentProvider.toUpperCase()} is selected but not configured!`);
    if (status.currentProvider === 'openai') {
      console.log('   Set OPENAI_API_KEY environment variable');
    } else if (status.currentProvider === 'claude') {
      console.log('   Set ANTHROPIC_API_KEY environment variable');
    }
  }
}

/**
 * Interactive provider selection
 */
async function selectProvider(): Promise<void> {
  const status = getConfigStatus();
  
  console.log('\n🔧 Configure AI Provider');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Available options:');
  console.log('');
  
  // Always show local option
  console.log('1. local   - Generate prompts for copy/paste (no API key needed)');
  
  // Show API-based options if keys are available
  let optionNumber = 2;
  const providerOptions: AIProvider[] = ['local'];
  
  if (status.availableProviders.includes('openai')) {
    console.log(`${optionNumber}. openai  - Use OpenAI GPT models (API key detected ✅)`);
    providerOptions.push('openai');
    optionNumber++;
  } else {
    console.log('   openai  - Use OpenAI GPT models (❌ Set OPENAI_API_KEY)');
  }
  
  if (status.availableProviders.includes('claude')) {
    console.log(`${optionNumber}. claude  - Use Anthropic Claude models (API key detected ✅)`);
    providerOptions.push('claude');
    optionNumber++;
  } else {
    console.log('   claude  - Use Anthropic Claude models (❌ Set ANTHROPIC_API_KEY)');
  }
  
  console.log('');
  console.log('Enter your choice (1-' + (optionNumber - 1) + '):');
  
  // Simple input handling (Bun doesn't have readline built-in)
  const input = prompt('Selection:');
  const choice = parseInt(input || '0', 10);
  
  if (choice < 1 || choice > providerOptions.length) {
    console.log('❌ Invalid selection');
    return;
  }
  
  const selectedProvider = providerOptions[choice - 1];
  
  // Ensure we have a valid provider (this should never happen due to bounds checking above)
  if (!selectedProvider) {
    console.log('❌ Invalid provider selection');
    return;
  }
  
  // Confirm the selection
  console.log(`\n📝 Setting AI provider to: ${selectedProvider}`);
  
  try {
    setAIProvider(selectedProvider);
    console.log('✅ Configuration saved successfully!');
    
    // Show next steps
    if (selectedProvider === 'local') {
      console.log('\n🎯 Local mode selected:');
      console.log('   • Scripts will generate prompts for copy/paste');
      console.log('   • Use --generate-prompt flag or prompts will be saved to locally-generated-prompts/');
    } else {
      console.log(`\n🚀 ${selectedProvider.toUpperCase()} mode selected:`);
      console.log('   • Scripts will automatically use AI for analysis');
      console.log(`   • Using ${selectedProvider === 'openai' ? 'GPT' : 'Claude'} models for processing`);
    }
    
  } catch (error) {
    console.error('❌ Failed to save configuration:', error);
  }
}

/**
 * Show model configuration
 */
function showModels() {
  const config = loadAIConfig();
  
  console.log('\n🎛️  Model Configuration');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
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
  console.log('\n🔄 Resetting to default configuration...');
  
  try {
    setAIProvider('local');
    console.log('✅ Configuration reset to defaults (local mode)');
  } catch (error) {
    console.error('❌ Failed to reset configuration:', error);
  }
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  console.log('🤖 Project Experience Artifacts - AI Configuration');
  
  switch (command) {
    case 'status':
      displayStatus();
      break;
      
    case 'set':
      const provider = args[1] as AIProvider;
      if (!provider || !['local', 'openai', 'claude'].includes(provider)) {
        console.error('Usage: configureAI set <local|openai|claude>');
        process.exit(1);
      }
      
      console.log(`Setting provider to: ${provider}`);
      try {
        setAIProvider(provider);
        console.log('✅ Configuration saved!');
        displayStatus();
      } catch (error) {
        console.error('❌ Failed to save configuration:', error);
        process.exit(1);
      }
      break;
      
    case 'models':
      showModels();
      break;
      
    case 'reset':
      resetConfig();
      displayStatus();
      break;
      
    case 'interactive':
    case undefined:
      displayStatus();
      await selectProvider();
      console.log('');
      displayStatus();
      break;
      
    default:
      console.log('\nUsage: bun run scripts/configureAI.ts [command]');
      console.log('');
      console.log('Commands:');
      console.log('  (none)              Interactive configuration');
      console.log('  status              Show current configuration');
      console.log('  set <provider>      Set AI provider (local|openai|claude)');
      console.log('  models              Show model configuration');
      console.log('  reset               Reset to default configuration');
      console.log('');
      console.log('Examples:');
      console.log('  bun run scripts/configureAI.ts');
      console.log('  bun run scripts/configureAI.ts status');
      console.log('  bun run scripts/configureAI.ts set claude');
      break;
  }
}

if (import.meta.main) {
  main().catch(console.error);
}