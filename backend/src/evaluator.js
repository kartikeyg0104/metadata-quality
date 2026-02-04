/**
 * Metadata Evaluator
 * Core evaluation engine that orchestrates schema validation, rule evaluation, 
 * scoring, and recommendation generation
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { allRules, getRulesSummary } from './rules/index.js';
import { calculateScoreSummary } from './scoring/scoreCalculator.js';
import { generateRecommendations, generateSimpleRecommendations } from './recommendations/generator.js';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load JSON Schema
const schemaPath = join(__dirname, 'schema', 'metadata.schema.json');
const metadataSchema = JSON.parse(readFileSync(schemaPath, 'utf-8'));

// Initialize AJV validator
const ajv = new Ajv({ allErrors: true, verbose: true });
addFormats(ajv);
const validateSchema = ajv.compile(metadataSchema);

/**
 * Normalize metadata to handle variations in input
 * @param {Object} rawMetadata - Raw metadata input
 * @returns {Object} Normalized metadata
 */
export function normalizeMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    return {};
  }
  
  const normalized = { ...rawMetadata };
  
  // Normalize string fields (trim whitespace)
  const stringFields = [
    'title', 'description', 'license', 'publisher', 
    'methodology', 'funding', 'spatial_coverage', 
    'version', 'doi', 'access_url', 'contact_email'
  ];
  
  for (const field of stringFields) {
    if (typeof normalized[field] === 'string') {
      normalized[field] = normalized[field].trim();
      if (normalized[field] === '') {
        normalized[field] = undefined;
      }
    }
  }
  
  // Normalize arrays (remove empty strings)
  const arrayFields = ['authors', 'keywords', 'data_format', 'citations', 'related_datasets'];
  
  for (const field of arrayFields) {
    if (Array.isArray(normalized[field])) {
      normalized[field] = normalized[field]
        .map(item => typeof item === 'string' ? item.trim() : item)
        .filter(item => item !== '' && item !== null && item !== undefined);
      
      if (normalized[field].length === 0) {
        normalized[field] = undefined;
      }
    }
  }
  
  // Normalize publication date
  if (normalized.publication_date) {
    // Handle various date formats
    const dateStr = String(normalized.publication_date).trim();
    // Try to parse and standardize
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      normalized.publication_date = date.toISOString().split('T')[0];
    }
  }
  
  return normalized;
}

/**
 * Validate metadata against JSON Schema
 * @param {Object} metadata - Metadata to validate
 * @returns {Object} Validation result
 */
export function validateMetadataSchema(metadata) {
  const valid = validateSchema(metadata);
  
  if (valid) {
    return {
      valid: true,
      errors: []
    };
  }
  
  const errors = (validateSchema.errors || []).map(err => ({
    field: err.instancePath.replace(/^\//, '') || err.params?.missingProperty || 'root',
    message: err.message,
    keyword: err.keyword,
    params: err.params
  }));
  
  return {
    valid: false,
    errors
  };
}

/**
 * Run all quality rules against metadata
 * @param {Object} metadata - Normalized metadata
 * @returns {Array} Array of rule evaluation results
 */
export function evaluateRules(metadata) {
  const results = [];
  
  for (const rule of allRules) {
    try {
      const checkResult = rule.check(metadata);
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        passed: checkResult.passed,
        value: checkResult.value,
        message: checkResult.message
      });
    } catch (error) {
      // Rule execution failed - treat as not passed
      results.push({
        ruleId: rule.id,
        ruleName: rule.name,
        category: rule.category,
        passed: false,
        value: null,
        message: `Rule evaluation error: ${error.message}`
      });
    }
  }
  
  return results;
}

/**
 * Full metadata evaluation pipeline
 * @param {Object} rawMetadata - Raw metadata input
 * @param {Object} options - Evaluation options
 * @returns {Object} Complete evaluation result
 */
export function evaluateMetadata(rawMetadata, options = {}) {
  const startTime = Date.now();
  const { includeRuleDetails = false, maxRecommendations = 10 } = options;
  
  // Step 1: Normalize metadata
  const metadata = normalizeMetadata(rawMetadata);
  
  // Step 2: Schema validation
  const schemaValidation = validateMetadataSchema(metadata);
  
  // Step 3: Run quality rules
  const ruleResults = evaluateRules(metadata);
  
  // Step 4: Calculate scores
  const scores = calculateScoreSummary(ruleResults);
  
  // Step 5: Generate recommendations
  const recommendations = generateSimpleRecommendations(ruleResults, maxRecommendations);
  
  // Build response
  const result = {
    overall_score: scores.overall_score,
    grade: scores.grade,
    categories: scores.categories,
    schema_validation: {
      valid: schemaValidation.valid,
      error_count: schemaValidation.errors.length,
      errors: schemaValidation.errors
    },
    summary: scores.summary,
    recommendations,
    evaluation_time_ms: Date.now() - startTime
  };
  
  // Optionally include detailed rule results
  if (includeRuleDetails) {
    result.rule_results = ruleResults;
    result.category_priority = scores.category_priority;
    result.top_improvements = scores.top_improvements;
  }
  
  return result;
}

/**
 * Get detailed evaluation with all information
 * @param {Object} rawMetadata - Raw metadata input
 * @returns {Object} Detailed evaluation result
 */
export function evaluateMetadataDetailed(rawMetadata) {
  const startTime = Date.now();
  
  // Step 1: Normalize metadata
  const metadata = normalizeMetadata(rawMetadata);
  
  // Step 2: Schema validation
  const schemaValidation = validateMetadataSchema(metadata);
  
  // Step 3: Run quality rules
  const ruleResults = evaluateRules(metadata);
  
  // Step 4: Calculate scores
  const scores = calculateScoreSummary(ruleResults);
  
  // Step 5: Generate detailed recommendations
  const detailedRecommendations = generateRecommendations(ruleResults, {
    maxRecommendations: 15,
    groupByCategory: true
  });
  
  return {
    overall_score: scores.overall_score,
    grade: scores.grade,
    categories: scores.categories,
    schema_validation: schemaValidation,
    summary: scores.summary,
    rule_results: ruleResults,
    category_priority: scores.category_priority,
    recommendations: detailedRecommendations,
    top_improvements: scores.top_improvements,
    quick_wins: detailedRecommendations.priorityActions?.slice(0, 3) || [],
    normalized_metadata: metadata,
    evaluation_time_ms: Date.now() - startTime
  };
}

/**
 * Get the metadata schema
 * @returns {Object} JSON Schema
 */
export function getSchema() {
  return metadataSchema;
}

/**
 * Get all rules with their metadata
 * @returns {Array} Rules summary
 */
export function getRules() {
  return getRulesSummary();
}

/**
 * Batch evaluate multiple metadata records
 * @param {Array} metadataRecords - Array of metadata objects
 * @returns {Array} Array of evaluation results
 */
export function batchEvaluate(metadataRecords) {
  return metadataRecords.map((record, index) => ({
    index,
    ...evaluateMetadata(record)
  }));
}

/**
 * ML-Enhanced evaluation
 * Combines rule-based evaluation with ML predictions for better accuracy
 * @param {Object} rawMetadata - Raw metadata input
 * @returns {Object} Enhanced evaluation with ML insights
 */
export async function evaluateWithML(rawMetadata) {
  // First, do the regular rule-based evaluation
  const ruleBasedResult = evaluateMetadataDetailed(rawMetadata);
  
  // Import ML module dynamically to avoid circular dependencies
  let mlResult = null;
  try {
    const ml = await import('./ml/index.js');
    mlResult = await ml.enhancedEvaluation(ruleBasedResult.normalized_metadata, ruleBasedResult);
  } catch (error) {
    console.error('ML enhancement error:', error.message);
  }
  
  return {
    ...ruleBasedResult,
    ml_enhanced: mlResult !== null,
    ml_analysis: mlResult ? {
      text_quality: mlResult.textAnalysis?.overallTextQuality || null,
      ml_predicted_score: mlResult.mlPrediction?.predictedScore || null,
      ml_confidence: mlResult.mlPrediction?.confidence || null,
      combined_score: mlResult.combinedScore,
      insights: mlResult.insights || [],
      suggested_keywords: mlResult.textAnalysis?.suggestedKeywords || [],
      text_metrics: {
        title: mlResult.textAnalysis?.fields?.title || null,
        description: mlResult.textAnalysis?.fields?.description || null,
        keywords: mlResult.textAnalysis?.fields?.keywords || null
      }
    } : null
  };
}

export default {
  normalizeMetadata,
  validateMetadataSchema,
  evaluateRules,
  evaluateMetadata,
  evaluateMetadataDetailed,
  evaluateWithML,
  getSchema,
  getRules,
  batchEvaluate
};

