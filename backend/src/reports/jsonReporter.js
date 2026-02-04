/**
 * JSON Report Generator
 * Generates structured JSON reports for programmatic use and integration
 */

/**
 * Generate structured JSON report from evaluation results
 * @param {Object} evaluation - Evaluation results from evaluateMetadataDetailed
 * @param {Object} metadata - Original metadata
 * @returns {Object} Structured JSON report
 */
export function generateJsonReport(evaluation, metadata) {
  const {
    overall_score,
    grade,
    categories,
    summary,
    schema_validation,
    rule_results,
    recommendations,
    top_improvements,
    evaluation_time_ms
  } = evaluation;
  
  // Group rule results by category
  const resultsByCategory = groupResultsByCategory(rule_results);
  
  // Calculate issue counts by severity
  const issuesBySeverity = countIssuesBySeverity(rule_results, recommendations);
  
  // Generate actionable items
  const actionItems = generateActionItems(recommendations, top_improvements);
  
  return {
    report_version: '1.0.0',
    generated_at: new Date().toISOString(),
    evaluation_time_ms,
    
    // Dataset identification
    dataset: {
      title: metadata.title || 'Untitled Dataset',
      identifier: metadata.doi || null,
      version: metadata.version || null
    },
    
    // Overall assessment
    assessment: {
      overall_score,
      grade: {
        letter: grade.grade,
        label: grade.label,
        description: grade.description
      },
      status: getAssessmentStatus(overall_score),
      compliance_level: getComplianceLevel(overall_score)
    },
    
    // Detailed scores
    scores: {
      overall: overall_score,
      categories: {
        identification: {
          score: categories.identification,
          status: getCategoryStatus(categories.identification)
        },
        description: {
          score: categories.description,
          status: getCategoryStatus(categories.description)
        },
        legal: {
          score: categories.legal,
          status: getCategoryStatus(categories.legal)
        },
        provenance: {
          score: categories.provenance,
          status: getCategoryStatus(categories.provenance)
        }
      }
    },
    
    // Validation results
    validation: {
      schema_valid: schema_validation.valid,
      schema_errors: schema_validation.errors || [],
      rules_evaluated: summary.total_rules,
      rules_passed: summary.passed,
      rules_failed: summary.failed,
      pass_rate: summary.pass_rate
    },
    
    // Issues summary
    issues: {
      total: summary.failed,
      by_severity: issuesBySeverity,
      by_category: Object.fromEntries(
        Object.entries(resultsByCategory).map(([cat, results]) => [
          cat,
          results.filter(r => !r.passed).length
        ])
      )
    },
    
    // Detailed results by category
    detailed_results: resultsByCategory,
    
    // Actionable recommendations
    recommendations: actionItems,
    
    // Quick reference for CI/CD integration
    ci_summary: {
      passed: overall_score >= 60,
      minimum_score_threshold: 60,
      blocking_issues: issuesBySeverity.critical,
      warnings: issuesBySeverity.important + issuesBySeverity.warning
    },
    
    // Metadata that was evaluated (summary)
    metadata_summary: {
      has_title: !!metadata.title,
      has_description: !!metadata.description,
      has_authors: Array.isArray(metadata.authors) && metadata.authors.length > 0,
      has_keywords: Array.isArray(metadata.keywords) && metadata.keywords.length > 0,
      has_license: !!metadata.license,
      has_publication_date: !!metadata.publication_date,
      has_methodology: !!metadata.methodology,
      has_doi: !!metadata.doi
    }
  };
}

/**
 * Group rule results by category
 */
function groupResultsByCategory(ruleResults) {
  const categories = {
    identification: [],
    description: [],
    legal: [],
    provenance: []
  };
  
  for (const result of ruleResults) {
    const cat = result.category || 'description';
    if (!categories[cat]) {
      categories[cat] = [];
    }
    categories[cat].push({
      rule_id: result.ruleId,
      rule_name: result.ruleName,
      passed: result.passed,
      message: result.message,
      value: result.value
    });
  }
  
  return categories;
}

/**
 * Count issues by severity
 */
function countIssuesBySeverity(ruleResults, recommendations) {
  const counts = {
    critical: 0,
    important: 0,
    warning: 0,
    suggestion: 0
  };
  
  if (recommendations?.categories) {
    for (const cat of recommendations.categories) {
      for (const item of cat.items) {
        if (counts.hasOwnProperty(item.severity)) {
          counts[item.severity]++;
        }
      }
    }
  }
  
  return counts;
}

/**
 * Generate action items from recommendations
 */
function generateActionItems(recommendations, topImprovements) {
  const items = [];
  
  // Priority actions
  if (recommendations?.priorityActions) {
    for (const action of recommendations.priorityActions.slice(0, 5)) {
      items.push({
        priority: items.length + 1,
        severity: action.severity,
        category: action.category,
        action: action.action,
        potential_impact: action.impact
      });
    }
  }
  
  // Fill with top improvements if needed
  if (items.length < 5 && topImprovements) {
    for (const improvement of topImprovements) {
      if (items.length >= 5) break;
      if (!items.some(i => i.action === improvement.recommendation)) {
        items.push({
          priority: items.length + 1,
          severity: improvement.severity,
          category: improvement.name,
          action: improvement.recommendation,
          potential_impact: `+${improvement.weight} points`
        });
      }
    }
  }
  
  return items;
}

/**
 * Get assessment status string
 */
function getAssessmentStatus(score) {
  if (score >= 90) return 'excellent';
  if (score >= 80) return 'good';
  if (score >= 70) return 'acceptable';
  if (score >= 60) return 'needs_improvement';
  return 'poor';
}

/**
 * Get compliance level
 */
function getComplianceLevel(score) {
  if (score >= 90) return 'full';
  if (score >= 70) return 'partial';
  if (score >= 50) return 'minimal';
  return 'non_compliant';
}

/**
 * Get category status
 */
function getCategoryStatus(score) {
  if (score >= 80) return 'good';
  if (score >= 60) return 'acceptable';
  if (score >= 40) return 'needs_work';
  return 'critical';
}

/**
 * Generate minimal report for API responses
 * @param {Object} evaluation - Evaluation results
 * @returns {Object} Minimal report
 */
export function generateMinimalReport(evaluation) {
  return {
    score: evaluation.overall_score,
    grade: evaluation.grade.letter,
    passed: evaluation.summary.passed,
    failed: evaluation.summary.failed,
    top_recommendations: evaluation.top_improvements?.slice(0, 3).map(i => i.recommendation) || []
  };
}

/**
 * Generate compliance report for auditing
 * @param {Object} evaluation - Evaluation results
 * @param {Object} metadata - Original metadata
 * @returns {Object} Compliance-focused report
 */
export function generateComplianceReport(evaluation, metadata) {
  const fullReport = generateJsonReport(evaluation, metadata);
  
  return {
    report_type: 'compliance',
    generated_at: fullReport.generated_at,
    dataset_identifier: fullReport.dataset.identifier || fullReport.dataset.title,
    
    compliance: {
      overall_status: fullReport.assessment.compliance_level,
      passed: fullReport.ci_summary.passed,
      score: fullReport.assessment.overall_score
    },
    
    checklist: {
      required_fields: {
        title: fullReport.metadata_summary.has_title,
        description: fullReport.metadata_summary.has_description,
        license: fullReport.metadata_summary.has_license
      },
      recommended_fields: {
        authors: fullReport.metadata_summary.has_authors,
        keywords: fullReport.metadata_summary.has_keywords,
        publication_date: fullReport.metadata_summary.has_publication_date,
        methodology: fullReport.metadata_summary.has_methodology
      },
      optional_fields: {
        doi: fullReport.metadata_summary.has_doi
      }
    },
    
    blocking_issues: fullReport.issues.by_severity.critical,
    action_required: fullReport.issues.by_severity.critical > 0 || fullReport.assessment.overall_score < 60
  };
}

export default {
  generateJsonReport,
  generateMinimalReport,
  generateComplianceReport
};
