/**
 * Rules Index
 * Aggregates all quality rules for the metadata evaluation engine
 * 
 * Four Main Categories (displayed in UI):
 * - Identification: Title, authors, identifiers, version
 * - Description: Content description, keywords, methodology, formats
 * - Legal: Licensing and rights
 * - Provenance: Data origin, dates, access, and history
 */

import { identificationRules } from './identificationRules.js';
import { descriptionRules } from './descriptionRules.js';
import { licenseRules } from './licenseRules.js';
import { keywordRules } from './keywordRules.js';
import { provenanceRules } from './provenanceRules.js';
import { accessibilityRules } from './accessibilityRules.js';
import { interoperabilityRules } from './interoperabilityRules.js';
import { citationRules } from './citationRules.js';
import { reusabilityRules } from './reusabilityRules.js';

// Helper to detect and remove duplicate rules by checking similar functionality
function deduplicateRules(rules) {
  const seen = new Map();
  const deduplicated = [];
  
  for (const rule of rules) {
    // Create a signature based on what the rule checks
    const signature = `${rule.category}-${rule.name.toLowerCase().replace(/\s+/g, '-')}`;
    
    // Skip rule if we have a similar one with same or higher weight
    if (seen.has(signature)) {
      const existing = seen.get(signature);
      if (rule.weight > existing.weight) {
        // Replace with higher weight rule
        const idx = deduplicated.findIndex(r => r.id === existing.id);
        if (idx !== -1) deduplicated[idx] = rule;
        seen.set(signature, rule);
      }
      continue;
    }
    
    seen.set(signature, rule);
    deduplicated.push(rule);
  }
  
  return deduplicated;
}

// Combine all rules
const rawRules = [
  ...identificationRules,
  ...descriptionRules,
  ...licenseRules,
  ...keywordRules,
  ...provenanceRules,
  ...accessibilityRules,
  ...interoperabilityRules,
  ...citationRules,
  ...reusabilityRules
];

// All rules combined (deduplicated)
export const allRules = deduplicateRules(rawRules);

// Four main categories displayed in UI
const MAIN_CATEGORIES = ['identification', 'description', 'legal', 'provenance'];

// Category display configuration (4 main categories)
export const categoryConfig = {
  identification: { 
    name: 'Identification', 
    weight: 0.25, 
    color: '#3b82f6', 
    icon: '🏷️',
    description: 'Title, authors, publisher, version, DOI' 
  },
  description: { 
    name: 'Description', 
    weight: 0.25, 
    color: '#8b5cf6', 
    icon: '📝',
    description: 'Description quality, keywords, methodology, formats' 
  },
  legal: { 
    name: 'Legal', 
    weight: 0.25, 
    color: '#10b981',
    icon: '⚖️', 
    description: 'License validity, openness, contact information' 
  },
  provenance: { 
    name: 'Provenance', 
    weight: 0.25, 
    color: '#f59e0b', 
    icon: '📍',
    description: 'Dates, temporal/spatial coverage, funding, access' 
  }
};

// Rules organized by the 4 main categories
export const rulesByCategory = {
  identification: allRules.filter(r => r.category === 'identification'),
  description: allRules.filter(r => r.category === 'description'),
  legal: allRules.filter(r => r.category === 'legal'),
  provenance: allRules.filter(r => r.category === 'provenance')
};

// Get rules by category name
export function getRulesByCategory(category) {
  const categoryLower = category.toLowerCase();
  return rulesByCategory[categoryLower] || [];
}

// Get a specific rule by ID
export function getRuleById(ruleId) {
  return allRules.find(rule => rule.id === ruleId) || null;
}

// Get all unique categories (4 main)
export function getCategories() {
  return MAIN_CATEGORIES;
}

// Get rules summary for documentation
export function getRulesSummary() {
  return allRules.map(rule => ({
    id: rule.id,
    name: rule.name,
    description: rule.description,
    category: rule.category,
    weight: rule.weight,
    severity: rule.severity
  }));
}

// Calculate total possible weight
export function getTotalWeight() {
  return allRules.reduce((sum, rule) => sum + rule.weight, 0);
}

// Get category weights (sum of rule weights per category)
export function getCategoryWeights() {
  const categories = {};
  for (const cat of MAIN_CATEGORIES) {
    categories[cat] = 0;
  }
  for (const rule of allRules) {
    if (categories[rule.category] !== undefined) {
      categories[rule.category] += rule.weight;
    }
  }
  return categories;
}

// Get rules count by severity
export function getRulesBySeverity() {
  const severities = { critical: [], important: [], warning: [], suggestion: [] };
  for (const rule of allRules) {
    if (severities[rule.severity]) {
      severities[rule.severity].push(rule);
    }
  }
  return severities;
}

// Get statistics about the rules
export function getRulesStatistics() {
  const totalRules = allRules.length;
  const categoryWeights = getCategoryWeights();
  const totalWeight = getTotalWeight();
  const severityCounts = {
    critical: allRules.filter(r => r.severity === 'critical').length,
    important: allRules.filter(r => r.severity === 'important').length,
    warning: allRules.filter(r => r.severity === 'warning').length,
    suggestion: allRules.filter(r => r.severity === 'suggestion').length
  };
  const categoryCounts = {};
  for (const cat of MAIN_CATEGORIES) {
    categoryCounts[cat] = rulesByCategory[cat]?.length || 0;
  }
  
  return {
    totalRules,
    totalWeight,
    categoryCount: MAIN_CATEGORIES.length,
    categoryCounts,
    categoryWeights,
    severityCounts
  };
}

export default {
  allRules,
  rulesByCategory,
  categoryConfig,
  getRulesByCategory,
  getRuleById,
  getCategories,
  getRulesSummary,
  getTotalWeight,
  getCategoryWeights,
  getRulesBySeverity,
  getRulesStatistics
};
