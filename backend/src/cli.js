#!/usr/bin/env node

/**
 * Metadata Quality Platform - CLI Interface
 * Command-line tool for evaluating metadata quality
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, basename } from 'path';
import { evaluateMetadata, evaluateMetadataDetailed } from './evaluator.js';
import { generateHtmlReport } from './reports/htmlReporter.js';
import { generateJsonReport } from './reports/jsonReporter.js';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

/**
 * Print colored text
 */
function print(text, color = '') {
  console.log(color + text + colors.reset);
}

/**
 * Print the banner
 */
function printBanner() {
  print(`
╔═══════════════════════════════════════════════════════════╗
║         Metadata Quality Platform - CLI                   ║
║         Rule-based metadata quality evaluation            ║
╚═══════════════════════════════════════════════════════════╝
`, colors.cyan);
}

/**
 * Print usage information
 */
function printUsage() {
  print(`
${colors.bold}Usage:${colors.reset}
  node src/cli.js <file.json> [options]

${colors.bold}Options:${colors.reset}
  --detailed, -d     Show detailed rule results
  --html <file>      Generate HTML report
  --json <file>      Generate JSON report
  --quiet, -q        Only show score and grade
  --help, -h         Show this help message

${colors.bold}Examples:${colors.reset}
  node src/cli.js metadata.json
  node src/cli.js metadata.json --detailed
  node src/cli.js metadata.json --html report.html
  node src/cli.js metadata.json -d --json report.json
`);
}

/**
 * Get score color
 */
function getScoreColor(score) {
  if (score >= 90) return colors.green;
  if (score >= 70) return colors.yellow;
  if (score >= 50) return colors.yellow;
  return colors.red;
}

/**
 * Print evaluation results
 */
function printResults(result, detailed = false) {
  const scoreColor = getScoreColor(result.overall_score);
  
  // Overall score
  print(`
┌───────────────────────────────────────┐
│  Overall Score: ${scoreColor}${result.overall_score.toString().padStart(3)}${colors.reset} / 100  ${result.grade.label.padEnd(15)}│
└───────────────────────────────────────┘
`, colors.bold);

  // Category breakdown
  print('Category Scores:', colors.bold);
  const categories = [
    ['Identification', result.categories.identification],
    ['Description', result.categories.description],
    ['Legal', result.categories.legal],
    ['Provenance', result.categories.provenance]
  ];
  
  for (const [name, score] of categories) {
    const bar = '█'.repeat(Math.floor(score / 5)) + '░'.repeat(20 - Math.floor(score / 5));
    const color = getScoreColor(score);
    print(`  ${name.padEnd(15)} ${bar} ${color}${score}%${colors.reset}`);
  }
  
  // Summary
  print(`
Summary:`, colors.bold);
  print(`  Rules evaluated: ${result.summary.total_rules}`);
  print(`  Passed: ${colors.green}${result.summary.passed}${colors.reset}`);
  print(`  Failed: ${colors.red}${result.summary.failed}${colors.reset}`);
  print(`  Pass rate: ${result.summary.pass_rate}%`);
  
  // Recommendations
  if (result.recommendations && result.recommendations.length > 0) {
    print(`
Priority Recommendations:`, colors.bold);
    result.recommendations.slice(0, 5).forEach((rec, i) => {
      print(`  ${i + 1}. ${rec}`, colors.yellow);
    });
  }
  
  // Detailed results
  if (detailed && result.rule_results) {
    print(`
Detailed Rule Results:`, colors.bold);
    
    const passed = result.rule_results.filter(r => r.passed);
    const failed = result.rule_results.filter(r => !r.passed);
    
    if (failed.length > 0) {
      print(`
  ${colors.red}Failed Rules:${colors.reset}`);
      for (const rule of failed) {
        print(`    ✗ ${rule.ruleName}`, colors.red);
        print(`      ${rule.message}`, colors.gray);
      }
    }
    
    if (passed.length > 0) {
      print(`
  ${colors.green}Passed Rules:${colors.reset}`);
      for (const rule of passed) {
        print(`    ✓ ${rule.ruleName}`, colors.green);
      }
    }
  }
  
  print('');
}

/**
 * Main CLI function
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Parse arguments
  const options = {
    file: null,
    detailed: false,
    htmlOutput: null,
    jsonOutput: null,
    quiet: false,
    help: false
  };
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--detailed' || arg === '-d') {
      options.detailed = true;
    } else if (arg === '--quiet' || arg === '-q') {
      options.quiet = true;
    } else if (arg === '--html' && args[i + 1]) {
      options.htmlOutput = args[++i];
    } else if (arg === '--json' && args[i + 1]) {
      options.jsonOutput = args[++i];
    } else if (!arg.startsWith('-') && !options.file) {
      options.file = arg;
    }
  }
  
  // Show help
  if (options.help || !options.file) {
    printBanner();
    printUsage();
    process.exit(options.help ? 0 : 1);
  }
  
  // Resolve file path
  const filePath = resolve(options.file);
  
  // Check file exists
  if (!existsSync(filePath)) {
    print(`Error: File not found: ${filePath}`, colors.red);
    process.exit(1);
  }
  
  // Read and parse file
  let metadata;
  try {
    const content = readFileSync(filePath, 'utf-8');
    metadata = JSON.parse(content);
  } catch (error) {
    print(`Error: Failed to parse JSON file: ${error.message}`, colors.red);
    process.exit(1);
  }
  
  if (!options.quiet) {
    printBanner();
    print(`Evaluating: ${basename(filePath)}`, colors.gray);
  }
  
  // Evaluate metadata
  const result = options.detailed || options.htmlOutput || options.jsonOutput
    ? evaluateMetadataDetailed(metadata)
    : evaluateMetadata(metadata, { includeRuleDetails: options.detailed });
  
  // Print results
  if (options.quiet) {
    print(`${result.overall_score} (${result.grade.letter} - ${result.grade.label})`);
  } else {
    printResults(result, options.detailed);
  }
  
  // Generate HTML report
  if (options.htmlOutput) {
    try {
      const html = generateHtmlReport(result, metadata);
      const htmlPath = resolve(options.htmlOutput);
      writeFileSync(htmlPath, html, 'utf-8');
      print(`HTML report saved: ${htmlPath}`, colors.green);
    } catch (error) {
      print(`Error generating HTML report: ${error.message}`, colors.red);
    }
  }
  
  // Generate JSON report
  if (options.jsonOutput) {
    try {
      const report = generateJsonReport(result, metadata);
      const jsonPath = resolve(options.jsonOutput);
      writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf-8');
      print(`JSON report saved: ${jsonPath}`, colors.green);
    } catch (error) {
      print(`Error generating JSON report: ${error.message}`, colors.red);
    }
  }
  
  // Exit with appropriate code
  process.exit(result.overall_score >= 60 ? 0 : 1);
}

// Run
main().catch(error => {
  print(`Error: ${error.message}`, colors.red);
  process.exit(1);
});
