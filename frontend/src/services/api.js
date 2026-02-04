/**
 * API Service
 * Handles all communication with the backend evaluation API
 */

import axios from 'axios';

// Configure base URL - use environment variable or default
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// ========================================
// Core Evaluation
// ========================================

/**
 * Evaluate metadata quality
 */
export async function evaluateMetadata(metadata) {
  try {
    const response = await apiClient.post('/evaluate/detailed', metadata);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Evaluate and save to history
 */
export async function evaluateAndSave(metadata, options = {}) {
  try {
    const response = await apiClient.post('/evaluate/save', { metadata, options });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Batch evaluate multiple records
 */
export async function batchEvaluate(records) {
  try {
    const response = await apiClient.post('/batch', records);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Start async batch job
 */
export async function startBatchJob(records, options = {}) {
  try {
    const response = await apiClient.post('/batch/start', { records, options });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get batch job status
 */
export async function getBatchStatus(jobId) {
  try {
    const response = await apiClient.get(`/batch/${jobId}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// History & Analytics
// ========================================

/**
 * Get evaluation history
 */
export async function getHistory(params = {}) {
  try {
    const response = await apiClient.get('/history', { params });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get a specific evaluation
 */
export async function getEvaluation(id) {
  try {
    const response = await apiClient.get(`/history/${id}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Delete an evaluation
 */
export async function deleteEvaluation(id) {
  try {
    const response = await apiClient.delete(`/history/${id}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get analytics data
 */
export async function getAnalytics(days = 30) {
  try {
    const response = await apiClient.get('/analytics', { params: { days } });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Compare two evaluations
 */
export async function compareEvaluations(id1, id2) {
  try {
    const response = await apiClient.get(`/compare/${id1}/${id2}`);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// Rules & Configuration
// ========================================

/**
 * Get all evaluation rules
 */
export async function getRules() {
  try {
    const response = await apiClient.get('/rules');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get rules statistics
 */
export async function getRulesStatistics() {
  try {
    const response = await apiClient.get('/rules/statistics');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get category configuration
 */
export async function getCategories() {
  try {
    const response = await apiClient.get('/rules/categories');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get the metadata JSON schema
 */
export async function getSchema() {
  try {
    const response = await apiClient.get('/schema');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// Reports
// ========================================

/**
 * Generate HTML report
 */
export async function generateHtmlReport(metadata) {
  try {
    const response = await apiClient.post('/report/html', metadata, {
      responseType: 'text'
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Generate PDF report - returns blob URL
 */
export async function generatePdfReport(metadata) {
  try {
    const response = await apiClient.post('/report/pdf', metadata, {
      responseType: 'blob'
    });
    return URL.createObjectURL(response.data);
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// Import
// ========================================

/**
 * Import metadata from URL
 */
export async function importFromUrl(url) {
  try {
    const response = await apiClient.post('/import/url', { url });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// Machine Learning / AI
// ========================================

/**
 * ML-Enhanced evaluation
 * Combines rule-based analysis with ML predictions
 */
export async function evaluateWithML(metadata) {
  try {
    const response = await apiClient.post('/ml/evaluate', metadata);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Train the ML model
 */
export async function trainMLModel(options = {}) {
  try {
    const response = await apiClient.post('/ml/train', options, {
      timeout: 120000 // 2 minute timeout for training
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get ML model status
 */
export async function getMLStatus() {
  try {
    const response = await apiClient.get('/ml/status');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Get raw ML prediction
 */
export async function getMLPrediction(metadata) {
  try {
    const response = await apiClient.post('/ml/predict', metadata);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Analyze text quality using NLP
 */
export async function analyzeText(metadata) {
  try {
    const response = await apiClient.post('/ml/analyze-text', metadata);
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Submit feedback for model improvement
 */
export async function submitMLFeedback(metadata, actualScore, notes) {
  try {
    const response = await apiClient.post('/ml/feedback', {
      metadata,
      actual_score: actualScore,
      notes
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Fine-tune the ML model with new samples
 */
export async function fineTuneModel(samples, epochs = 50) {
  try {
    const response = await apiClient.post('/ml/fine-tune', { samples, epochs }, {
      timeout: 120000 // 2 minute timeout for fine-tuning
    });
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

// ========================================
// Health
// ========================================

/**
 * Check API health
 */
export async function checkHealth() {
  try {
    const response = await apiClient.get('/health');
    return response.data;
  } catch (error) {
    throw handleError(error);
  }
}

/**
 * Handle API errors
 */
function handleError(error) {
  if (error.response) {
    const message = error.response.data?.message || error.response.data?.error || 'Server error';
    const err = new Error(message);
    err.status = error.response.status;
    return err;
  } else if (error.request) {
    const err = new Error('Unable to connect to the server. Please ensure the backend is running.');
    err.status = 0;
    return err;
  } else {
    return new Error(error.message);
  }
}

export default {
  evaluateMetadata,
  evaluateAndSave,
  batchEvaluate,
  startBatchJob,
  getBatchStatus,
  getHistory,
  getEvaluation,
  deleteEvaluation,
  getAnalytics,
  compareEvaluations,
  getRules,
  getRulesStatistics,
  getCategories,
  getSchema,
  generateHtmlReport,
  generatePdfReport,
  importFromUrl,
  checkHealth,
  // ML/AI Functions
  evaluateWithML,
  trainMLModel,
  getMLStatus,
  getMLPrediction,
  analyzeText,
  submitMLFeedback,
  fineTuneModel
};
