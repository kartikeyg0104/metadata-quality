/**
 * Recommendation Generator
 * Generates actionable, prioritized recommendations based on rule evaluation results
 */

import { allRules } from '../rules/index.js';

/**
 * Severity weights for prioritization
 */
const SEVERITY_WEIGHTS = {
  critical: 4,
  important: 3,
  warning: 2,
  suggestion: 1
};

/**
 * Category display names
 */
const CATEGORY_NAMES = {
  identification: 'Identification & Attribution',
  description: 'Description & Discoverability',
  legal: 'Legal & Licensing',
  provenance: 'Provenance & Access'
};

/**
 * Generate recommendations from rule evaluation results
 * @param {Array} ruleResults - Array of rule evaluation results
 * @param {Object} options - Generation options
 * @returns {Object} Structured recommendations
 */
export function generateRecommendations(ruleResults, options = {}) {
  const { 
    maxRecommendations = 10,
    groupByCategory = true,
    includePassedRules = false 
  } = options;
  
  // Get failed rules
  const failedResults = ruleResults.filter(r => !r.passed);
  
  // Enrich with rule details
  const enrichedResults = failedResults.map(result => {
    const rule = allRules.find(r => r.id === result.ruleId);
    return {
      ...result,
      ruleName: rule?.name || result.ruleId,
      category: rule?.category || 'unknown',
      weight: rule?.weight || 0,
      severity: rule?.severity || 'suggestion',
      recommendation: rule?.recommendation || 'Review and improve this field.',
      priorityScore: calculatePriorityScore(rule)
    };
  });
  
  // Sort by priority
  enrichedResults.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Limit recommendations
  const topResults = enrichedResults.slice(0, maxRecommendations);
  
  // Generate structured output
  if (groupByCategory) {
    return generateGroupedRecommendations(topResults, enrichedResults);
  }
  
  return generateFlatRecommendations(topResults, enrichedResults);
}

/**
 * Calculate priority score for sorting
 */
function calculatePriorityScore(rule) {
  if (!rule) return 0;
  const severityWeight = SEVERITY_WEIGHTS[rule.severity] || 1;
  return (rule.weight || 0) * severityWeight;
}

/**
 * Generate recommendations grouped by category
 */
function generateGroupedRecommendations(topResults, allFailedResults) {
  const byCategory = {};
  
  for (const result of allFailedResults) {
    const cat = result.category;
    if (!byCategory[cat]) {
      byCategory[cat] = {
        category: cat,
        displayName: CATEGORY_NAMES[cat] || cat,
        items: [],
        totalIssues: 0,
        criticalCount: 0,
        importantCount: 0
      };
    }
    
    byCategory[cat].items.push({
      rule: result.ruleName,
      severity: result.severity,
      issue: result.message,
      recommendation: result.recommendation,
      weight: result.weight,
      isPriority: topResults.some(r => r.ruleId === result.ruleId)
    });
    
    byCategory[cat].totalIssues++;
    if (result.severity === 'critical') byCategory[cat].criticalCount++;
    if (result.severity === 'important') byCategory[cat].importantCount++;
  }
  
  // Sort categories by severity count
  const sortedCategories = Object.values(byCategory).sort((a, b) => {
    const aUrgency = a.criticalCount * 4 + a.importantCount * 2;
    const bUrgency = b.criticalCount * 4 + b.importantCount * 2;
    return bUrgency - aUrgency;
  });
  
  // Sort items within each category
  for (const cat of sortedCategories) {
    cat.items.sort((a, b) => {
      const severityDiff = (SEVERITY_WEIGHTS[b.severity] || 0) - (SEVERITY_WEIGHTS[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      return (b.weight || 0) - (a.weight || 0);
    });
  }
  
  return {
    type: 'grouped',
    categories: sortedCategories,
    summary: generateSummary(allFailedResults),
    priorityActions: topResults.map(r => ({
      action: r.recommendation,
      impact: `+${r.weight} points`,
      severity: r.severity,
      category: r.category
    }))
  };
}

/**
 * Generate flat list of recommendations
 */
function generateFlatRecommendations(topResults, allFailedResults) {
  return {
    type: 'flat',
    recommendations: topResults.map((r, index) => ({
      priority: index + 1,
      rule: r.ruleName,
      category: r.category,
      severity: r.severity,
      issue: r.message,
      action: r.recommendation,
      potentialGain: r.weight
    })),
    summary: generateSummary(allFailedResults),
    totalIssues: allFailedResults.length
  };
}

/**
 * Generate summary text
 */
function generateSummary(failedResults) {
  const criticalCount = failedResults.filter(r => r.severity === 'critical').length;
  const importantCount = failedResults.filter(r => r.severity === 'important').length;
  const warningCount = failedResults.filter(r => r.severity === 'warning').length;
  const suggestionCount = failedResults.filter(r => r.severity === 'suggestion').length;
  
  const parts = [];
  if (criticalCount > 0) parts.push(`${criticalCount} critical`);
  if (importantCount > 0) parts.push(`${importantCount} important`);
  if (warningCount > 0) parts.push(`${warningCount} warning${warningCount > 1 ? 's' : ''}`);
  if (suggestionCount > 0) parts.push(`${suggestionCount} suggestion${suggestionCount > 1 ? 's' : ''}`);
  
  if (parts.length === 0) {
    return 'No issues found. Metadata quality is excellent!';
  }
  
  return `Found ${failedResults.length} issue${failedResults.length > 1 ? 's' : ''}: ${parts.join(', ')}.`;
}

/**
 * Generate human-readable recommendation strings
 * @param {Array} ruleResults - Array of rule evaluation results
 * @param {number} limit - Maximum number of recommendations
 * @returns {Array<string>} Array of recommendation strings
 */
export function generateSimpleRecommendations(ruleResults, limit = 5) {
  const failedResults = ruleResults.filter(r => !r.passed);
  
  const enrichedResults = failedResults.map(result => {
    const rule = allRules.find(r => r.id === result.ruleId);
    return {
      ...result,
      weight: rule?.weight || 0,
      severity: rule?.severity || 'suggestion',
      recommendation: rule?.recommendation || 'Review and improve this field.'
    };
  });
  
  // Sort by priority
  enrichedResults.sort((a, b) => {
    const severityDiff = (SEVERITY_WEIGHTS[b.severity] || 0) - (SEVERITY_WEIGHTS[a.severity] || 0);
    if (severityDiff !== 0) return severityDiff;
    return (b.weight || 0) - (a.weight || 0);
  });
  
  return enrichedResults
    .slice(0, limit)
    .map(r => r.recommendation);
}

/**
 * Generate quick wins - easy improvements with high impact
 * @param {Array} ruleResults - Array of rule evaluation results
 * @returns {Array} Quick win recommendations
 */
export function generateQuickWins(ruleResults) {
  const failedResults = ruleResults.filter(r => !r.passed);
  
  // Quick wins are warnings/suggestions that are easy to fix
  const quickWinRules = [
    'keywords-presence',
    'keywords-minimum-count',
    'publisher-presence',
    'version-present',
    'data-format-specified',
    'contact-for-licensing'
  ];
  
  return failedResults
    .filter(r => quickWinRules.includes(r.ruleId))
    .map(result => {
      const rule = allRules.find(r => r.id === result.ruleId);
      return {
        action: rule?.recommendation || 'Fix this issue',
        impact: `Low effort, +${rule?.weight || 0} points`,
        ruleId: result.ruleId
      };
    });
}

/**
 * Generate improvement roadmap
 * @param {Array} ruleResults - Array of rule evaluation results
 * @returns {Object} Phased improvement roadmap
 */
export function generateImprovementRoadmap(ruleResults) {
  const failedResults = ruleResults.filter(r => !r.passed);
  
  const enrichedResults = failedResults.map(result => {
    const rule = allRules.find(r => r.id === result.ruleId);
    return {
      ruleId: result.ruleId,
      ruleName: rule?.name || result.ruleId,
      category: rule?.category || 'unknown',
      weight: rule?.weight || 0,
      severity: rule?.severity || 'suggestion',
      recommendation: rule?.recommendation || 'Review and improve this field.'
    };
  });
  
  return {
    phase1_critical: {
      name: 'Critical Fixes',
      description: 'Address these issues first to meet minimum quality standards',
      items: enrichedResults.filter(r => r.severity === 'critical')
    },
    phase2_important: {
      name: 'Important Improvements',
      description: 'These improvements significantly enhance metadata quality',
      items: enrichedResults.filter(r => r.severity === 'important')
    },
    phase3_polish: {
      name: 'Quality Polish',
      description: 'Optional improvements for excellent metadata quality',
      items: enrichedResults.filter(r => ['warning', 'suggestion'].includes(r.severity))
    }
  };
}

export default {
  generateRecommendations,
  generateSimpleRecommendations,
  generateQuickWins,
  generateImprovementRoadmap
};
