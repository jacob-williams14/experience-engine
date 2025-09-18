#!/usr/bin/env bun

/**
 * Main Project Summary Generator
 * Interactive pipeline: git log → processed data → professional summary
 */

import { analyzeProject } from "./scripts/analyzeProject.js";

/**
 * Prompt user for input
 */
function prompt(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const displayDefault = defaultValue ? ` [${defaultValue}]` : '';
    process.stdout.write(`${question}${displayDefault}: `);
    
    process.stdin.once('data', (data) => {
      const input = data.toString().trim();
      resolve(input || defaultValue || '');
    });
  });
}

/**
 * Interactive mode - prompt user for all inputs
 */
async function runInteractive() {
  console.log('🚀 Project Experience Artifacts Generator');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 We\'ll gather detailed inputs to produce a high-quality, professional summary.');
  console.log('ℹ️  Tip: Use short but descriptive sentences (not just keywords). Include scope, outcomes, metrics, and constraints.');
  console.log('');
  
  // Show current AI configuration
  console.log('🔧 Current AI Configuration:');
  console.log('   Use "bun run configure-ai" to change AI provider (openai/claude/local)');
  console.log('');
  
  // Required inputs
  console.log('📋 Required Information:');
  const gitLogFile = await prompt('Git log file path', 'original-artifacts/root_compass_git_log.txt');
  const developerName = await prompt('Developer full name');
  const projectName = await prompt('Project name (descriptive)');
  
  console.log('');
  console.log('🎯 Optional - Git Filtering (improves commit attribution):');
  const developerEmail = await prompt('Developer email (optional)');
  const developerUsername = await prompt('Developer username/handle (optional)');
  
  console.log('');
  console.log('📖 Optional - Rich Context (significantly improves quality):');
  const careerContext = await prompt(
    'Career context (optional - full paragraph)',
    'e.g., "Jacob is a mid-level developer with strong technical expertise who is transitioning into technical leadership roles. Please emphasize emerging leadership capabilities, architectural contributions, and mentoring activities while highlighting technical competence and growth trajectory."'
  );
  const projectContext = await prompt(
    'Project overview (optional)',
    'e.g., "Enterprise learning platform migrating to Contentful; focus on i18n, API integration, and CI stability."'
  );
  const role = await prompt(
    'Your role (optional)',
    'e.g., "Software Developer responsible for i18n, Contentful integration, and test infrastructure"'
  );
  const duration = await prompt('Project duration (optional)', 'e.g., "July 2022 - November 2022"');
  const outputDir = await prompt(
    'Output directory (optional)', 
    'project-experience-summaries'
  );
  
  console.log('');
  console.log('⚙️  Optional - Advanced Guidance');
  console.log('   You can steer the analysis with plain-language directives. Examples:');
  console.log('   - Emphasize internationalization and Contentful architecture; deemphasize generic UI polish.');
  console.log('   - Target audience: hiring managers (senior backend focus); tone: concise and metrics-driven.');
  console.log('   - Highlight problem-solving around CI flakiness and schema validation; quantify impact where possible.');
  console.log('   - Exclude sensitive details and proprietary names; generalize where needed.');
  console.log('   - Prefer bullet density over prose in Skills and Achievements.');
  const additionalInstructions = await prompt('Additional analysis instructions (optional)');
  
  return {
    gitLogFile,
    developerName,
    projectName,
    analysisOptions: {
      careerContext: careerContext || undefined,
      projectContext: projectContext || undefined,
      role: role || undefined,
      duration: duration || undefined,
      outputDir: outputDir || undefined,
      additionalInstructions: additionalInstructions || undefined,
      developerEmail: developerEmail || undefined,
      developerUsername: developerUsername || undefined,
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  
  // Enable stdin for interactive input
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  
  let config;
  
  if (args.length === 0) {
    // Interactive mode - no arguments provided
    config = await runInteractive();
  } else if (args.length >= 3) {
    // Command line mode - arguments provided
    const [gitLogFile, developerName, projectName] = args;
    
    // Parse options
    const analysisOptions: Parameters<typeof analyzeProject>[3] = {};
    
    for (let i = 3; i < args.length; i += 2) {
      const flag = args[i];
      const value = args[i + 1];
      
      switch (flag) {
        case '--email':
          analysisOptions.developerEmail = value;
          break;
        case '--username':
          analysisOptions.developerUsername = value;
          break;
        case '--career-context':
          analysisOptions.careerContext = value;
          break;
        case '--project-context':
          analysisOptions.projectContext = value;
          break;
        case '--role':
          analysisOptions.role = value;
          break;
        case '--duration':
          analysisOptions.duration = value;
          break;
        case '--output-dir':
          analysisOptions.outputDir = value;
          break;
        case '--instructions':
          analysisOptions.additionalInstructions = value;
          break;
      }
    }
    
    config = {
      gitLogFile: gitLogFile!,
      developerName: developerName!,
      projectName: projectName!,
      analysisOptions,
    };
  } else {
    console.log('🚀 Project Experience Artifacts Generator');
    console.log('');
    console.log('Usage options:');
    console.log('  1. Interactive mode: bun run generateProjectSummary.ts');
    console.log('  2. Command line:     bun run generateProjectSummary.ts <git-log> <developer> <project> [options]');
    console.log('');
    console.log('Examples:');
    console.log('  # Interactive (recommended):');
    console.log('  bun run generateProjectSummary.ts');
    console.log('');
    console.log('  # Command line mode:');
    console.log('  bun run generateProjectSummary.ts original-artifacts/compass.txt "Jacob Williams" "Compass Platform"');
    console.log('');
    console.log('  # With additional context:');
    console.log('  bun run generateProjectSummary.ts git-log.txt "Developer" "Project" --email dev@example.com --career-context "Senior developer"');
    process.exit(1);
  }


  // Close stdin after gathering input
  process.stdin.pause();
  
  console.log('');
  console.log('🚀 Starting Project Experience Artifacts Generation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📁 Git Log: ${config.gitLogFile}`);
  console.log(`👤 Developer: ${config.developerName}`);
  console.log(`🏗️ Project: ${config.projectName}`);
  console.log('');

  try {
    // Generate project summary (includes git extraction)
    console.log('🤖 Generating professional project summary...');
    await analyzeProject(
      config.gitLogFile,
      config.developerName, 
      config.projectName, 
      config.analysisOptions
    );
    
    console.log('');
    console.log('🎉 SUCCESS! Project summary generated successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📄 Find your professional project summary in:`);
    const finalOutputDir = config.analysisOptions.outputDir || 'project-experience-summaries';
    console.log(`   ${finalOutputDir}/${config.projectName.toLowerCase().replace(/\s+/g, '-')}-project-summary.md`);
    
  } catch (error) {
    console.error('💥 Pipeline failed:', error);
    process.exit(1);
  }
}

if (import.meta.main) {
  main();
}

export { main };
