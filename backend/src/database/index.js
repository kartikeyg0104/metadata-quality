/**
 * Database Layer - SQLite persistence for evaluation history and analytics
 */

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize database
const dbPath = process.env.DB_PATH || path.join(__dirname, '../../data/metadata-quality.db');
const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');

/**
 * Initialize database schema
 */
export function initializeDatabase() {
  db.exec(`
    -- Evaluations table
    CREATE TABLE IF NOT EXISTS evaluations (
      id TEXT PRIMARY KEY,
      dataset_name TEXT,
      metadata TEXT NOT NULL,
      overall_score INTEGER NOT NULL,
      grade TEXT NOT NULL,
      grade_label TEXT,
      categories TEXT NOT NULL,
      recommendations TEXT,
      rule_results TEXT,
      standard_profile TEXT DEFAULT 'default',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      session_id TEXT,
      tags TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
    CREATE INDEX IF NOT EXISTS idx_evaluations_score ON evaluations(overall_score);
    CREATE INDEX IF NOT EXISTS idx_evaluations_session ON evaluations(session_id);
    CREATE INDEX IF NOT EXISTS idx_evaluations_dataset ON evaluations(dataset_name);

    -- Rule configurations table
    CREATE TABLE IF NOT EXISTS rule_configs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      rules TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    INSERT OR IGNORE INTO rule_configs (id, name, description, rules)
    VALUES ('default', 'Default Configuration', 'Standard rule weights', '{}');

    -- Batch jobs table
    CREATE TABLE IF NOT EXISTS batch_jobs (
      id TEXT PRIMARY KEY,
      status TEXT DEFAULT 'pending',
      total_items INTEGER DEFAULT 0,
      completed_items INTEGER DEFAULT 0,
      results TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME
    );

    -- Standard profiles table
    CREATE TABLE IF NOT EXISTS standard_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      schema_definition TEXT NOT NULL,
      required_fields TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/**
 * Save an evaluation result
 */
export function saveEvaluation(evaluation, metadata, options = {}) {
  const id = uuidv4();
  const stmt = db.prepare(`
    INSERT INTO evaluations (
      id, dataset_name, metadata, overall_score, grade, grade_label,
      categories, recommendations, rule_results, standard_profile, session_id, tags
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    options.datasetName || metadata.title || 'Untitled Dataset',
    JSON.stringify(metadata),
    evaluation.overall_score,
    evaluation.grade?.grade || evaluation.grade?.letter || 'N/A',
    evaluation.grade?.label || '',
    JSON.stringify(evaluation.categories),
    JSON.stringify(evaluation.recommendations || []),
    JSON.stringify(evaluation.rule_results || []),
    options.standardProfile || 'default',
    options.sessionId || null,
    JSON.stringify(options.tags || [])
  );

  return { id, ...evaluation };
}

/**
 * Get evaluation by ID
 */
export function getEvaluation(id) {
  const stmt = db.prepare('SELECT * FROM evaluations WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  return parseEvaluationRow(row);
}

/**
 * Get evaluation history with pagination
 */
export function getEvaluationHistory(options = {}) {
  const {
    limit = 50,
    offset = 0,
    orderBy = 'created_at',
    order = 'DESC',
    minScore,
    maxScore,
    grade,
    datasetName,
    sessionId,
    startDate,
    endDate
  } = options;

  let query = 'SELECT * FROM evaluations WHERE 1=1';
  const params = [];

  if (minScore !== undefined) {
    query += ' AND overall_score >= ?';
    params.push(minScore);
  }
  if (maxScore !== undefined) {
    query += ' AND overall_score <= ?';
    params.push(maxScore);
  }
  if (grade) {
    query += ' AND grade = ?';
    params.push(grade);
  }
  if (datasetName) {
    query += ' AND dataset_name LIKE ?';
    params.push(`%${datasetName}%`);
  }
  if (sessionId) {
    query += ' AND session_id = ?';
    params.push(sessionId);
  }
  if (startDate) {
    query += ' AND created_at >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND created_at <= ?';
    params.push(endDate);
  }

  // Get total count
  const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
  const countStmt = db.prepare(countQuery);
  const totalCount = countStmt.get(...params).count;

  // Add ordering and pagination
  const validOrderColumns = ['created_at', 'overall_score', 'dataset_name', 'grade'];
  const safeOrderBy = validOrderColumns.includes(orderBy) ? orderBy : 'created_at';
  const safeOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  
  query += ` ORDER BY ${safeOrderBy} ${safeOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  const stmt = db.prepare(query);
  const rows = stmt.all(...params);

  return {
    evaluations: rows.map(parseEvaluationRow),
    pagination: {
      total: totalCount,
      limit,
      offset,
      hasMore: offset + rows.length < totalCount
    }
  };
}

/**
 * Get analytics data
 */
export function getAnalytics(options = {}) {
  const { days = 30 } = options;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Overall statistics
  const overallStats = db.prepare(`
    SELECT 
      COUNT(*) as total_evaluations,
      ROUND(AVG(overall_score), 1) as avg_score,
      MIN(overall_score) as min_score,
      MAX(overall_score) as max_score,
      SUM(CASE WHEN grade IN ('A', 'B') THEN 1 ELSE 0 END) as high_quality_count,
      SUM(CASE WHEN grade IN ('D', 'F') THEN 1 ELSE 0 END) as low_quality_count
    FROM evaluations
    WHERE created_at >= ?
  `).get(startDate.toISOString());

  // Score distribution
  const scoreDistribution = db.prepare(`
    SELECT 
      CASE 
        WHEN overall_score >= 90 THEN '90-100'
        WHEN overall_score >= 80 THEN '80-89'
        WHEN overall_score >= 70 THEN '70-79'
        WHEN overall_score >= 60 THEN '60-69'
        WHEN overall_score >= 50 THEN '50-59'
        ELSE '0-49'
      END as range,
      COUNT(*) as count
    FROM evaluations
    WHERE created_at >= ?
    GROUP BY range
    ORDER BY range DESC
  `).all(startDate.toISOString());

  // Grade distribution
  const gradeDistribution = db.prepare(`
    SELECT grade, COUNT(*) as count
    FROM evaluations
    WHERE created_at >= ?
    GROUP BY grade
    ORDER BY 
      CASE grade 
        WHEN 'A' THEN 1 
        WHEN 'B' THEN 2 
        WHEN 'C' THEN 3 
        WHEN 'D' THEN 4 
        WHEN 'F' THEN 5 
        ELSE 6 
      END
  `).all(startDate.toISOString());

  // Category averages
  const categoryAverages = calculateCategoryAverages(startDate);

  // Daily trend
  const dailyTrend = db.prepare(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as evaluations,
      ROUND(AVG(overall_score), 1) as avg_score
    FROM evaluations
    WHERE created_at >= ?
    GROUP BY DATE(created_at)
    ORDER BY date
  `).all(startDate.toISOString());

  // Most common failed rules
  const commonIssues = getCommonFailedRules(startDate, 10);

  return {
    period: { days, startDate: startDate.toISOString() },
    overall: overallStats,
    scoreDistribution,
    gradeDistribution,
    categoryAverages,
    dailyTrend,
    commonIssues
  };
}

function calculateCategoryAverages(startDate) {
  const rows = db.prepare(`
    SELECT categories FROM evaluations WHERE created_at >= ?
  `).all(startDate.toISOString());

  const totals = {};
  let count = 0;

  for (const row of rows) {
    try {
      const categories = JSON.parse(row.categories);
      for (const [key, value] of Object.entries(categories)) {
        totals[key] = (totals[key] || 0) + value;
      }
      count++;
    } catch (e) { }
  }

  if (count === 0) return totals;

  const averages = {};
  for (const [key, total] of Object.entries(totals)) {
    averages[key] = Math.round(total / count);
  }
  return averages;
}

function getCommonFailedRules(startDate, limit = 10) {
  const rows = db.prepare(`
    SELECT rule_results FROM evaluations WHERE created_at >= ?
  `).all(startDate.toISOString());

  const failureCounts = {};

  for (const row of rows) {
    try {
      const results = JSON.parse(row.rule_results);
      for (const result of results) {
        if (!result.passed) {
          const key = result.rule_id || result.id || result.name;
          if (key) {
            failureCounts[key] = (failureCounts[key] || 0) + 1;
          }
        }
      }
    } catch (e) { }
  }

  return Object.entries(failureCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([rule, count]) => ({ rule, count }));
}

/**
 * Delete an evaluation
 */
export function deleteEvaluation(id) {
  const stmt = db.prepare('DELETE FROM evaluations WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

/**
 * Compare two evaluations
 */
export function compareEvaluations(id1, id2) {
  const eval1 = getEvaluation(id1);
  const eval2 = getEvaluation(id2);

  if (!eval1 || !eval2) return null;

  const scoreDiff = eval2.overall_score - eval1.overall_score;
  const categoryDiffs = {};
  
  for (const [key, value] of Object.entries(eval2.categories)) {
    categoryDiffs[key] = value - (eval1.categories[key] || 0);
  }

  const ruleChanges = [];
  const rules1 = new Map(eval1.rule_results.map(r => [r.id || r.name, r]));
  const rules2 = new Map(eval2.rule_results.map(r => [r.id || r.name, r]));

  for (const [ruleId, rule2] of rules2) {
    const rule1 = rules1.get(ruleId);
    if (rule1 && rule1.passed !== rule2.passed) {
      ruleChanges.push({
        rule: ruleId,
        before: rule1.passed,
        after: rule2.passed,
        improvement: rule2.passed && !rule1.passed
      });
    }
  }

  return {
    evaluation1: eval1,
    evaluation2: eval2,
    comparison: {
      scoreDiff,
      scoreImproved: scoreDiff > 0,
      categoryDiffs,
      ruleChanges,
      recommendationsResolved: eval1.recommendations.filter(r => !eval2.recommendations.includes(r)),
      newRecommendations: eval2.recommendations.filter(r => !eval1.recommendations.includes(r))
    }
  };
}

/**
 * Get dataset history
 */
export function getDatasetHistory(datasetName) {
  const stmt = db.prepare(`
    SELECT * FROM evaluations 
    WHERE dataset_name = ? 
    ORDER BY created_at DESC
  `);
  return stmt.all(datasetName).map(parseEvaluationRow);
}

/**
 * Batch operations
 */
export function createBatchJob(totalItems) {
  const id = uuidv4();
  db.prepare(`INSERT INTO batch_jobs (id, status, total_items) VALUES (?, 'processing', ?)`).run(id, totalItems);
  return id;
}

export function updateBatchJob(id, completedItems, results = null, status = null) {
  let query = 'UPDATE batch_jobs SET completed_items = ?';
  const params = [completedItems];

  if (results !== null) {
    query += ', results = ?';
    params.push(JSON.stringify(results));
  }
  if (status !== null) {
    query += ', status = ?';
    params.push(status);
    if (status === 'completed' || status === 'failed') {
      query += ', completed_at = CURRENT_TIMESTAMP';
    }
  }

  query += ' WHERE id = ?';
  params.push(id);
  db.prepare(query).run(...params);
}

export function getBatchJob(id) {
  const stmt = db.prepare('SELECT * FROM batch_jobs WHERE id = ?');
  const row = stmt.get(id);
  if (!row) return null;
  return { ...row, results: row.results ? JSON.parse(row.results) : null };
}

/**
 * Rule configurations
 */
export function saveRuleConfig(config) {
  const id = config.id || uuidv4();
  db.prepare(`
    INSERT OR REPLACE INTO rule_configs (id, name, description, rules, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(id, config.name, config.description || '', JSON.stringify(config.rules));
  return { id, ...config };
}

export function getRuleConfig(id) {
  const row = db.prepare('SELECT * FROM rule_configs WHERE id = ?').get(id);
  if (!row) return null;
  return { ...row, rules: JSON.parse(row.rules) };
}

export function getAllRuleConfigs() {
  return db.prepare('SELECT * FROM rule_configs ORDER BY name').all().map(row => ({
    ...row, rules: JSON.parse(row.rules)
  }));
}

function parseEvaluationRow(row) {
  return {
    id: row.id,
    dataset_name: row.dataset_name,
    metadata: JSON.parse(row.metadata),
    overall_score: row.overall_score,
    grade: { grade: row.grade, label: row.grade_label },
    categories: JSON.parse(row.categories),
    recommendations: JSON.parse(row.recommendations || '[]'),
    rule_results: JSON.parse(row.rule_results || '[]'),
    standard_profile: row.standard_profile,
    created_at: row.created_at,
    session_id: row.session_id,
    tags: JSON.parse(row.tags || '[]')
  };
}

// Initialize on module load
initializeDatabase();

export { db };

export default {
  db,
  initializeDatabase,
  saveEvaluation,
  getEvaluation,
  getEvaluationHistory,
  getAnalytics,
  deleteEvaluation,
  compareEvaluations,
  getDatasetHistory,
  createBatchJob,
  updateBatchJob,
  getBatchJob,
  saveRuleConfig,
  getRuleConfig,
  getAllRuleConfigs
};
