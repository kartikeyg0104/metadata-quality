/**
 * Metadata Quality Platform - Express API Server
 * Provides REST endpoints for metadata quality evaluation
 */

import express from 'express';
import multer from 'multer';
import { readFileSync } from 'fs';
import {
  evaluateMetadata,
  evaluateMetadataDetailed,
  evaluateWithML,
  getSchema,
  getRules,
  batchEvaluate
} from './evaluator.js';
import * as ml from './ml/index.js';
import { generateHtmlReport } from './reports/htmlReporter.js';
import { generateJsonReport } from './reports/jsonReporter.js';
import { generatePdfReport } from './reports/pdfReporter.js';
import * as db from './database/index.js';
import { getRulesStatistics, categoryConfig } from './rules/index.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/json' || file.originalname.endsWith('.json')) {
      cb(null, true);
    } else {
      cb(new Error('Only JSON files are allowed'), false);
    }
  }
});

// CORS headers - configurable via environment variable
app.use((req, res, next) => {
  const allowedOrigin = process.env.CORS_ORIGIN || '*';
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// ========================================
// API Endpoints
// ========================================

/**
 * GET /
 * API information and documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Metadata Quality Platform API',
    version: '1.0.0',
    description: 'Rule-based metadata quality evaluation service',
    endpoints: {
      'POST /evaluate': 'Evaluate metadata quality (accepts JSON body)',
      'POST /evaluate/detailed': 'Get detailed evaluation with all rule results',
      'POST /evaluate/file': 'Evaluate metadata from uploaded JSON file',
      'POST /batch': 'Batch evaluate multiple metadata records',
      'GET /schema': 'Get the metadata JSON Schema',
      'GET /rules': 'Get all quality evaluation rules',
      'GET /report/html': 'Generate HTML report (POST metadata first)',
      'GET /health': 'Health check endpoint'
    },
    documentation: 'https://github.com/metadata-quality-platform'
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /schema
 * Returns the metadata JSON Schema
 */
app.get('/schema', (req, res) => {
  try {
    const schema = getSchema();
    res.json(schema);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve schema',
      message: error.message
    });
  }
});

/**
 * GET /rules
 * Returns all quality evaluation rules
 */
app.get('/rules', (req, res) => {
  try {
    const rules = getRules();
    res.json({
      total: rules.length,
      rules
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve rules',
      message: error.message
    });
  }
});

/**
 * POST /evaluate
 * Evaluate metadata quality
 * Body: metadata JSON object
 */
app.post('/evaluate', (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const includeDetails = req.query.detailed === 'true';
    const result = evaluateMetadata(metadata, { includeRuleDetails: includeDetails });
    
    res.json(result);
  } catch (error) {
    console.error('Evaluation error:', error);
    res.status(500).json({
      error: 'Evaluation failed',
      message: error.message
    });
  }
});

/**
 * POST /evaluate/detailed
 * Get detailed evaluation with all information
 */
app.post('/evaluate/detailed', (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const result = evaluateMetadataDetailed(metadata);
    res.json(result);
  } catch (error) {
    console.error('Detailed evaluation error:', error);
    res.status(500).json({
      error: 'Evaluation failed',
      message: error.message
    });
  }
});

/**
 * POST /evaluate/file
 * Evaluate metadata from uploaded JSON file
 */
app.post('/evaluate/file', upload.single('metadata'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a JSON file with metadata'
      });
    }
    
    const fileContent = req.file.buffer.toString('utf-8');
    let metadata;
    
    try {
      metadata = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'The uploaded file is not valid JSON'
      });
    }
    
    const result = evaluateMetadata(metadata);
    res.json({
      filename: req.file.originalname,
      ...result
    });
  } catch (error) {
    console.error('File evaluation error:', error);
    res.status(500).json({
      error: 'File evaluation failed',
      message: error.message
    });
  }
});

/**
 * POST /batch
 * Batch evaluate multiple metadata records
 * Body: array of metadata objects
 */
app.post('/batch', (req, res) => {
  try {
    const records = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must be an array of metadata objects'
      });
    }
    
    if (records.length > 100) {
      return res.status(400).json({
        error: 'Too many records',
        message: 'Maximum 100 records per batch request'
      });
    }
    
    const results = batchEvaluate(records);
    
    // Calculate summary statistics
    const scores = results.map(r => r.overall_score);
    const summary = {
      total_evaluated: results.length,
      average_score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      min_score: Math.min(...scores),
      max_score: Math.max(...scores),
      grade_distribution: {}
    };
    
    for (const result of results) {
      const grade = result.grade.grade;
      summary.grade_distribution[grade] = (summary.grade_distribution[grade] || 0) + 1;
    }
    
    res.json({
      summary,
      results
    });
  } catch (error) {
    console.error('Batch evaluation error:', error);
    res.status(500).json({
      error: 'Batch evaluation failed',
      message: error.message
    });
  }
});

/**
 * POST /report/html
 * Generate HTML report for metadata
 */
app.post('/report/html', (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const result = evaluateMetadataDetailed(metadata);
    const html = generateHtmlReport(result, metadata);
    
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (error) {
    console.error('HTML report error:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

/**
 * POST /report/json
 * Generate structured JSON report
 */
app.post('/report/json', (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const result = evaluateMetadataDetailed(metadata);
    const report = generateJsonReport(result, metadata);
    
    res.json(report);
  } catch (error) {
    console.error('JSON report error:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

/**
 * POST /report/pdf
 * Generate PDF report
 */
app.post('/report/pdf', async (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const result = evaluateMetadataDetailed(metadata);
    const pdfBuffer = await generatePdfReport(result, metadata);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="metadata-quality-report.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('PDF report error:', error);
    res.status(500).json({
      error: 'Report generation failed',
      message: error.message
    });
  }
});

// ========================================
// History & Analytics Endpoints
// ========================================

/**
 * POST /evaluate/save
 * Evaluate metadata and save to history
 */
app.post('/evaluate/save', (req, res) => {
  try {
    const { metadata, options = {} } = req.body;
    
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain a metadata object'
      });
    }
    
    const result = evaluateMetadataDetailed(metadata);
    const saved = db.saveEvaluation(result, metadata, options);
    
    res.json({
      ...result,
      evaluation_id: saved.id,
      saved: true
    });
  } catch (error) {
    console.error('Save evaluation error:', error);
    res.status(500).json({
      error: 'Failed to save evaluation',
      message: error.message
    });
  }
});

/**
 * GET /history
 * Get evaluation history with pagination and filters
 */
app.get('/history', (req, res) => {
  try {
    const options = {
      limit: parseInt(req.query.limit) || 50,
      offset: parseInt(req.query.offset) || 0,
      orderBy: req.query.orderBy || 'created_at',
      order: req.query.order || 'DESC',
      minScore: req.query.minScore ? parseInt(req.query.minScore) : undefined,
      maxScore: req.query.maxScore ? parseInt(req.query.maxScore) : undefined,
      grade: req.query.grade,
      datasetName: req.query.datasetName,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    
    const history = db.getEvaluationHistory(options);
    res.json(history);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message
    });
  }
});

/**
 * GET /history/:id
 * Get a specific evaluation by ID
 */
app.get('/history/:id', (req, res) => {
  try {
    const evaluation = db.getEvaluation(req.params.id);
    if (!evaluation) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Evaluation not found'
      });
    }
    res.json(evaluation);
  } catch (error) {
    console.error('Get evaluation error:', error);
    res.status(500).json({
      error: 'Failed to fetch evaluation',
      message: error.message
    });
  }
});

/**
 * DELETE /history/:id
 * Delete an evaluation
 */
app.delete('/history/:id', (req, res) => {
  try {
    const deleted = db.deleteEvaluation(req.params.id);
    if (!deleted) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Evaluation not found'
      });
    }
    res.json({ success: true, message: 'Evaluation deleted' });
  } catch (error) {
    console.error('Delete evaluation error:', error);
    res.status(500).json({
      error: 'Failed to delete evaluation',
      message: error.message
    });
  }
});

/**
 * GET /analytics
 * Get analytics dashboard data
 */
app.get('/analytics', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const analytics = db.getAnalytics({ days });
    res.json(analytics);
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      error: 'Failed to fetch analytics',
      message: error.message
    });
  }
});

/**
 * GET /compare/:id1/:id2
 * Compare two evaluations
 */
app.get('/compare/:id1/:id2', (req, res) => {
  try {
    const comparison = db.compareEvaluations(req.params.id1, req.params.id2);
    if (!comparison) {
      return res.status(404).json({
        error: 'Not found',
        message: 'One or both evaluations not found'
      });
    }
    res.json(comparison);
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      error: 'Failed to compare evaluations',
      message: error.message
    });
  }
});

/**
 * GET /dataset/:name/history
 * Get history for a specific dataset
 */
app.get('/dataset/:name/history', (req, res) => {
  try {
    const history = db.getDatasetHistory(decodeURIComponent(req.params.name));
    res.json({
      dataset_name: req.params.name,
      evaluations: history,
      count: history.length
    });
  } catch (error) {
    console.error('Dataset history error:', error);
    res.status(500).json({
      error: 'Failed to fetch dataset history',
      message: error.message
    });
  }
});

// ========================================
// Batch Processing Endpoints
// ========================================

/**
 * POST /batch/start
 * Start an async batch job
 */
app.post('/batch/start', (req, res) => {
  try {
    const { records, options = {} } = req.body;
    
    if (!Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain an array of metadata records'
      });
    }
    
    if (records.length > 500) {
      return res.status(400).json({
        error: 'Too many records',
        message: 'Maximum 500 records per batch job'
      });
    }
    
    const jobId = db.createBatchJob(records.length);
    
    // Process asynchronously
    setImmediate(async () => {
      const results = [];
      for (let i = 0; i < records.length; i++) {
        try {
          const result = evaluateMetadata(records[i]);
          if (options.saveToHistory) {
            db.saveEvaluation(result, records[i], { sessionId: jobId });
          }
          results.push({ index: i, success: true, result });
        } catch (error) {
          results.push({ index: i, success: false, error: error.message });
        }
        db.updateBatchJob(jobId, i + 1);
      }
      db.updateBatchJob(jobId, records.length, results, 'completed');
    });
    
    res.json({
      job_id: jobId,
      total_items: records.length,
      status: 'processing',
      message: 'Batch job started. Poll /batch/:id for status.'
    });
  } catch (error) {
    console.error('Batch start error:', error);
    res.status(500).json({
      error: 'Failed to start batch job',
      message: error.message
    });
  }
});

/**
 * GET /batch/:id
 * Get batch job status and results
 */
app.get('/batch/:id', (req, res) => {
  try {
    const job = db.getBatchJob(req.params.id);
    if (!job) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Batch job not found'
      });
    }
    res.json(job);
  } catch (error) {
    console.error('Batch status error:', error);
    res.status(500).json({
      error: 'Failed to fetch batch status',
      message: error.message
    });
  }
});

// ========================================
// Rules & Configuration Endpoints
// ========================================

/**
 * GET /rules/statistics
 * Get statistics about all rules
 */
app.get('/rules/statistics', (req, res) => {
  try {
    const stats = getRulesStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Rules statistics error:', error);
    res.status(500).json({
      error: 'Failed to fetch rule statistics',
      message: error.message
    });
  }
});

/**
 * GET /rules/categories
 * Get category configuration
 */
app.get('/rules/categories', (req, res) => {
  try {
    res.json(categoryConfig);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

/**
 * GET /config
 * Get all rule configurations
 */
app.get('/config', (req, res) => {
  try {
    const configs = db.getAllRuleConfigs();
    res.json({ configs });
  } catch (error) {
    console.error('Config error:', error);
    res.status(500).json({
      error: 'Failed to fetch configurations',
      message: error.message
    });
  }
});

/**
 * POST /config
 * Save a rule configuration
 */
app.post('/config', (req, res) => {
  try {
    const config = req.body;
    if (!config.name) {
      return res.status(400).json({
        error: 'Invalid config',
        message: 'Configuration must have a name'
      });
    }
    const saved = db.saveRuleConfig(config);
    res.json({ success: true, config: saved });
  } catch (error) {
    console.error('Save config error:', error);
    res.status(500).json({
      error: 'Failed to save configuration',
      message: error.message
    });
  }
});

/**
 * GET /config/:id
 * Get a specific rule configuration
 */
app.get('/config/:id', (req, res) => {
  try {
    const config = db.getRuleConfig(req.params.id);
    if (!config) {
      return res.status(404).json({
        error: 'Not found',
        message: 'Configuration not found'
      });
    }
    res.json(config);
  } catch (error) {
    console.error('Get config error:', error);
    res.status(500).json({
      error: 'Failed to fetch configuration',
      message: error.message
    });
  }
});

// ========================================
// URL Import Endpoint
// ========================================

/**
 * POST /import/url
 * Import metadata from a URL
 */
app.post('/import/url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'URL is required'
      });
    }
    
    // Fetch the metadata from the URL
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!response.ok) {
      return res.status(400).json({
        error: 'Failed to fetch',
        message: `HTTP ${response.status}: ${response.statusText}`
      });
    }
    
    const metadata = await response.json();
    const result = evaluateMetadata(metadata);
    
    res.json({
      source_url: url,
      metadata,
      evaluation: result
    });
  } catch (error) {
    console.error('URL import error:', error);
    res.status(500).json({
      error: 'Import failed',
      message: error.message
    });
  }
});

// ========================================
// Machine Learning Endpoints
// ========================================

/**
 * POST /ml/evaluate
 * ML-enhanced metadata evaluation
 * Combines rule-based analysis with ML predictions
 */
app.post('/ml/evaluate', async (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object' || Object.keys(metadata).length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata JSON object'
      });
    }
    
    const result = await evaluateWithML(metadata);
    res.json(result);
  } catch (error) {
    console.error('ML evaluation error:', error);
    res.status(500).json({
      error: 'ML evaluation failed',
      message: error.message
    });
  }
});

/**
 * POST /ml/train
 * Train or retrain the ML model
 * Can train with synthetic data or historical evaluations
 */
app.post('/ml/train', async (req, res) => {
  try {
    const { 
      samples = 1000,         // Number of synthetic samples to generate
      epochs = 100,           // Training epochs
      validationSplit = 0.2,  // Validation data proportion
      useHistory = true       // Whether to include historical evaluations
    } = req.body;
    
    console.log(`Starting ML training: ${samples} samples, ${epochs} epochs`);
    
    // Get historical data if requested
    let historicalData = [];
    if (useHistory) {
      try {
        const history = db.getEvaluationHistory({ limit: 1000 });
        historicalData = history.evaluations || [];
        console.log(`Loaded ${historicalData.length} historical evaluations`);
      } catch (err) {
        console.log('No historical data available:', err.message);
      }
    }
    
    // Train the model
    const trainingResult = await ml.trainFromHistory(historicalData, {
      syntheticSamples: samples,
      epochs,
      validationSplit
    });
    
    res.json({
      success: true,
      message: 'Model training completed',
      training: {
        samples_used: trainingResult.samplesUsed || samples,
        historical_samples: historicalData.length,
        epochs_completed: epochs,
        metrics: trainingResult.metrics || null,
        model_saved: trainingResult.modelSaved || false
      }
    });
  } catch (error) {
    console.error('ML training error:', error);
    res.status(500).json({
      error: 'Training failed',
      message: error.message
    });
  }
});

/**
 * GET /ml/status
 * Get ML model status and metrics
 */
app.get('/ml/status', async (req, res) => {
  try {
    const status = await ml.getMLStatus();
    res.json(status);
  } catch (error) {
    console.error('ML status error:', error);
    res.status(500).json({
      error: 'Failed to get ML status',
      message: error.message
    });
  }
});

/**
 * POST /ml/predict
 * Get raw ML prediction for metadata
 * Returns only the ML prediction without rule-based analysis
 */
app.post('/ml/predict', async (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata object'
      });
    }
    
    // Get text analysis
    const textAnalysis = ml.TextAnalyzer.analyzeMetadataText(metadata);
    
    // Get ML prediction
    const prediction = await ml.QualityPredictor.predictQuality(metadata);
    
    res.json({
      text_analysis: textAnalysis,
      ml_prediction: prediction,
      features: ml.TrainingDataGenerator.extractFeatures(metadata)
    });
  } catch (error) {
    console.error('ML prediction error:', error);
    res.status(500).json({
      error: 'Prediction failed',
      message: error.message
    });
  }
});

/**
 * POST /ml/feedback
 * Provide feedback on an evaluation for model improvement
 * This adds training data for future model updates
 */
app.post('/ml/feedback', async (req, res) => {
  try {
    const { metadata, actual_score, notes } = req.body;
    
    if (!metadata || actual_score === undefined) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'metadata and actual_score are required'
      });
    }
    
    if (actual_score < 0 || actual_score > 100) {
      return res.status(400).json({
        error: 'Invalid score',
        message: 'actual_score must be between 0 and 100'
      });
    }
    
    // Store the feedback as a training sample
    ml.TrainingDataGenerator.addTrainingSample(metadata, actual_score / 100);
    
    res.json({
      success: true,
      message: 'Feedback recorded for model improvement',
      feedback: {
        received_at: new Date().toISOString(),
        actual_score,
        notes: notes || null
      }
    });
  } catch (error) {
    console.error('ML feedback error:', error);
    res.status(500).json({
      error: 'Failed to record feedback',
      message: error.message
    });
  }
});

/**
 * POST /ml/analyze-text
 * Analyze text quality of metadata using NLP
 */
app.post('/ml/analyze-text', (req, res) => {
  try {
    const metadata = req.body;
    
    if (!metadata || typeof metadata !== 'object') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body must contain metadata object'
      });
    }
    
    const analysis = ml.TextAnalyzer.analyzeMetadataText(metadata);
    res.json(analysis);
  } catch (error) {
    console.error('Text analysis error:', error);
    res.status(500).json({
      error: 'Text analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /ml/fine-tune
 * Fine-tune the model with new training samples
 */
app.post('/ml/fine-tune', async (req, res) => {
  try {
    const { samples, epochs = 50 } = req.body;
    
    if (!Array.isArray(samples) || samples.length === 0) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'samples must be a non-empty array of {metadata, score} objects'
      });
    }
    
    // Validate samples
    for (const sample of samples) {
      if (!sample.metadata || sample.score === undefined) {
        return res.status(400).json({
          error: 'Invalid sample',
          message: 'Each sample must have metadata and score properties'
        });
      }
    }
    
    // Add samples to training data
    for (const sample of samples) {
      ml.TrainingDataGenerator.addTrainingSample(
        sample.metadata, 
        sample.score > 1 ? sample.score / 100 : sample.score
      );
    }
    
    // Fine-tune the model
    const result = await ml.QualityPredictor.fineTuneModel(samples, epochs);
    
    res.json({
      success: true,
      message: 'Model fine-tuned successfully',
      samples_used: samples.length,
      ...result
    });
  } catch (error) {
    console.error('Fine-tune error:', error);
    res.status(500).json({
      error: 'Fine-tuning failed',
      message: error.message
    });
  }
});

// ========================================
// Error Handling
// ========================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Endpoint ${req.method} ${req.path} does not exist`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: 'File upload error',
      message: err.message
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ========================================
// Server Start
// ========================================

app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║     Metadata Quality Platform - API Server v2.0          ║
║           🤖 AI/ML Enhanced Edition                      ║
╠══════════════════════════════════════════════════════════╣
║  Server: http://localhost:${PORT}                           ║
╠══════════════════════════════════════════════════════════╣
║  Core Endpoints:                                         ║
║    POST /evaluate          - Evaluate metadata           ║
║    POST /evaluate/detailed - Detailed evaluation         ║
║    POST /evaluate/save     - Evaluate and save           ║
║    POST /batch             - Batch evaluation            ║
║    POST /batch/start       - Async batch job             ║
╠══════════════════════════════════════════════════════════╣
║  🧠 ML/AI Endpoints:                                     ║
║    POST /ml/evaluate       - ML-enhanced evaluation      ║
║    POST /ml/train          - Train the ML model          ║
║    GET  /ml/status         - Model status & metrics      ║
║    POST /ml/predict        - Raw ML prediction           ║
║    POST /ml/analyze-text   - NLP text analysis           ║
║    POST /ml/feedback       - Submit feedback             ║
║    POST /ml/fine-tune      - Fine-tune model             ║
╠══════════════════════════════════════════════════════════╣
║  History & Analytics:                                    ║
║    GET  /history           - Evaluation history          ║
║    GET  /analytics         - Dashboard analytics         ║
║    GET  /compare/:id1/:id2 - Compare evaluations         ║
╠══════════════════════════════════════════════════════════╣
║  Reports:                                                ║
║    POST /report/html       - HTML report                 ║
║    POST /report/json       - JSON report                 ║
║    POST /report/pdf        - PDF report                  ║
╠══════════════════════════════════════════════════════════╣
║  Configuration:                                          ║
║    GET  /rules             - All rules                   ║
║    GET  /rules/statistics  - Rule statistics             ║
║    GET  /rules/categories  - Category config             ║
║    GET  /config            - Rule configurations         ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
