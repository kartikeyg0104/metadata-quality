/**
 * Score Calculator
 * Calculates weighted quality scores from rule evaluation results
 */

import { allRules, getCategories, getCategoryWeights, getTotalWeight } from '../rules/index.js';

/**
 * Calculate scores from rule evaluation results
 * @param {Array} ruleResults - Array of rule evaluation results
 * @returns {Object} Score breakdown including overall and category scores
 */
export function calculateScores(ruleResults) {
  const totalWeight = getTotalWeight();
  const categoryWeights = getCategoryWeights();
  const categories = getCategories();
  
  // Initialize category scores
  const categoryScores = {};
  const categoryEarned = {};
  const categoryMax = {};
  
  for (const cat of categories) {
    categoryScores[cat] = 0;
    categoryEarned[cat] = 0;
    categoryMax[cat] = categoryWeights[cat] || 0;
  }
  
  // Calculate earned points for each category
  let totalEarned = 0;
  
  for (const result of ruleResults) {
    const rule = allRules.find(r => r.id === result.ruleId);
    if (!rule) continue;
    
    const weight = rule.weight;
    const category = rule.category;
    
    // Normalize category names (some rules use 'description' for keywords)
    const normalizedCategory = normalizeCategory(category);
    
    if (result.passed) {
      totalEarned += weight;
      categoryEarned[normalizedCategory] = (categoryEarned[normalizedCategory] || 0) + weight;
    }
  }
  
  // Calculate percentage scores
  const overallScore = totalWeight > 0 
    ? Math.round((totalEarned / totalWeight) * 100) 
    : 0;
  
  for (const cat of categories) {
    const max = categoryMax[cat];
    const earned = categoryEarned[cat] || 0;
    categoryScores[cat] = max > 0 ? Math.round((earned / max) * 100) : 100;
  }
  
  return {
    overall_score: overallScore,
    categories: categoryScores,
    details: {
      total_weight: totalWeight,
      total_earned: totalEarned,
      category_weights: categoryWeights,
      category_earned: categoryEarned
    }
  };
}

/**
 * Normalize category names to standard categories
 * All rules now map to 4 main categories: identification, description, legal, provenance
 */
function normalizeCategory(category) {
  const cat = category.toLowerCase();
  const mainCategories = ['identification', 'description', 'legal', 'provenance'];
  
  if (mainCategories.includes(cat)) {
    return cat;
  }
  
  // Legacy mapping for any old category names (shouldn't be needed now)
  const mapping = {
    'accessibility': 'provenance',
    'interoperability': 'description', 
    'citation': 'identification',
    'reusability': 'description'
  };
  
  return mapping[cat] || 'description';
}

/**
 * Get score grade based on overall score
 * @param {number} score - Overall quality score (0-100)
 * @returns {Object} Grade information
 */
export function getScoreGrade(score) {
  if (score >= 90) {
    return {
      grade: 'A',
      label: 'Excellent',
      description: 'Metadata quality is excellent and meets or exceeds all standards.',
      color: '#22c55e' // green
    };
  } else if (score >= 80) {
    return {
      grade: 'B',
      label: 'Good',
      description: 'Metadata quality is good with minor improvements recommended.',
      color: '#84cc16' // lime
    };
  } else if (score >= 70) {
    return {
      grade: 'C',
      label: 'Acceptable',
      description: 'Metadata quality is acceptable but could benefit from improvements.',
      color: '#eab308' // yellow
    };
  } else if (score >= 60) {
    return {
      grade: 'D',
      label: 'Needs Improvement',
      description: 'Metadata quality needs improvement to meet recommended standards.',
      color: '#f97316' // orange
    };
  } else {
    return {
      grade: 'F',
      label: 'Poor',
      description: 'Metadata quality is poor and requires significant improvements.',
      color: '#ef4444' // red
    };
  }
}

/**
 * Calculate category-specific recommendations priority
 * @param {Object} categoryScores - Score for each category
 * @returns {Array} Categories sorted by priority (lowest score first)
 */
export function getCategoryPriority(categoryScores) {
  return Object.entries(categoryScores)
    .map(([category, score]) => ({ category, score }))
    .sort((a, b) => a.score - b.score);
}

/**
 * Calculate improvement potential
 * @param {Array} ruleResults - Array of rule evaluation results
 * @returns {Array} Rules that if fixed would have the most impact
 */
export function getImprovementPotential(ruleResults) {
  const failedRules = ruleResults.filter(r => !r.passed);
  
  return failedRules
    .map(result => {
      const rule = allRules.find(r => r.id === result.ruleId);
      return {
        ruleId: result.ruleId,
        name: rule?.name || result.ruleId,
        weight: rule?.weight || 0,
        severity: rule?.severity || 'suggestion',
        message: result.message,
        recommendation: rule?.recommendation || 'Review and improve this field.'
      };
    })
    .sort((a, b) => {
      // Sort by severity first, then by weight
      const severityOrder = { critical: 0, important: 1, warning: 2, suggestion: 3 };
      const sevDiff = (severityOrder[a.severity] || 3) - (severityOrder[b.severity] || 3);
      if (sevDiff !== 0) return sevDiff;
      return b.weight - a.weight;
    });
}

/**
 * Calculate score summary with all metrics
 * @param {Array} ruleResults - Array of rule evaluation results
 * @returns {Object} Complete score summary
 */
export function calculateScoreSummary(ruleResults) {
  const scores = calculateScores(ruleResults);
  const grade = getScoreGrade(scores.overall_score);
  const priority = getCategoryPriority(scores.categories);
  const improvements = getImprovementPotential(ruleResults);
  
  const passedCount = ruleResults.filter(r => r.passed).length;
  const failedCount = ruleResults.filter(r => !r.passed).length;
  
  return {
    ...scores,
    grade,
    summary: {
      total_rules: ruleResults.length,
      passed: passedCount,
      failed: failedCount,
      pass_rate: Math.round((passedCount / ruleResults.length) * 100)
    },
    category_priority: priority,
    top_improvements: improvements.slice(0, 5)
  };
}

export default {
  calculateScores,
  getScoreGrade,
  getCategoryPriority,
  getImprovementPotential,
  calculateScoreSummary
};
