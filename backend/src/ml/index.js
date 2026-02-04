/**
 * ML Module Index
 * Exports all machine learning functionality for metadata quality analysis
 */

import textAnalyzer from './textAnalyzer.js';
import trainingDataGenerator from './trainingDataGenerator.js';
import qualityPredictor from './qualityPredictor.js';

// Re-export individual modules
export { analyzeTextQuality, analyzeTitleQuality, analyzeKeywordsQuality, extractKeyPhrases, analyzeMetadataText } from './textAnalyzer.js';
export { extractFeatures, featuresToArray, getFeatureNames, generateSyntheticData, saveTrainingData, loadTrainingData, addTrainingSample } from './trainingDataGenerator.js';
export { trainModel, loadModel, predictQuality, batchPredictQuality, evaluateModel, getModelInfo, fineTuneModel, initializeModel } from './qualityPredictor.js';

/**
 * Combined ML-enhanced evaluation
 * Combines rule-based evaluation with ML predictions
 */
export async function enhancedEvaluation(metadata, ruleBasedResult = null) {
  // Get NLP text analysis
  const textAnalysis = textAnalyzer.analyzeMetadataText(metadata);
  
  // Get ML prediction
  let mlPrediction = null;
  try {
    mlPrediction = await qualityPredictor.predictQuality(metadata);
  } catch (error) {
    console.error('ML prediction error:', error.message);
  }
  
  // Combine scores if rule-based result is available
  let combinedScore = null;
  if (ruleBasedResult && mlPrediction) {
    // Weighted combination: 70% rules, 30% ML
    combinedScore = Math.round(
      ruleBasedResult.overall_score * 0.7 + mlPrediction.predictedScore * 0.3
    );
  }
  
  return {
    textAnalysis,
    mlPrediction,
    combinedScore,
    insights: generateInsights(textAnalysis, mlPrediction, ruleBasedResult)
  };
}

/**
 * Generate insights from ML analysis
 */
function generateInsights(textAnalysis, mlPrediction, ruleBasedResult) {
  const insights = [];
  
  // Text quality insights
  if (textAnalysis.overallTextQuality < 50) {
    insights.push({
      type: 'warning',
      source: 'nlp',
      message: 'Text quality is below average. Consider improving description clarity.',
      priority: 1
    });
  }
  
  if (textAnalysis.fields.description?.metrics?.vocabularyRichness < 0.4) {
    insights.push({
      type: 'suggestion',
      source: 'nlp',
      message: 'Description vocabulary could be more diverse.',
      priority: 2
    });
  }
  
  if (textAnalysis.fields.description?.metrics?.specificityScore < 0.3) {
    insights.push({
      type: 'suggestion',
      source: 'nlp',
      message: 'Add specific details like dates, numbers, or locations to the description.',
      priority: 2
    });
  }
  
  // ML prediction insights
  if (mlPrediction) {
    if (mlPrediction.confidence < 50) {
      insights.push({
        type: 'info',
        source: 'ml',
        message: 'Low confidence in ML prediction due to missing metadata fields.',
        priority: 3
      });
    }
    
    // Discrepancy between rule-based and ML scores
    if (ruleBasedResult && Math.abs(ruleBasedResult.overall_score - mlPrediction.predictedScore) > 15) {
      insights.push({
        type: 'info',
        source: 'ml',
        message: `ML model predicts ${mlPrediction.predictedScore > ruleBasedResult.overall_score ? 'higher' : 'lower'} quality than rules suggest. Consider reviewing edge cases.`,
        priority: 2
      });
    }
  }
  
  // Keyword suggestions
  if (textAnalysis.suggestedKeywords && textAnalysis.suggestedKeywords.length > 0) {
    insights.push({
      type: 'suggestion',
      source: 'nlp',
      message: `Suggested keywords: ${textAnalysis.suggestedKeywords.join(', ')}`,
      priority: 3
    });
  }
  
  // Sort by priority
  insights.sort((a, b) => a.priority - b.priority);
  
  return insights;
}

/**
 * Train model with existing evaluation history
 */
export async function trainFromHistory(evaluationHistory) {
  const trainingData = evaluationHistory.map(evalRecord => ({
    metadata: evalRecord.metadata,
    features: trainingDataGenerator.featuresToArray(
      trainingDataGenerator.extractFeatures(evalRecord.metadata)
    ),
    target: evalRecord.overall_score
  }));
  
  if (trainingData.length < 50) {
    console.log('Not enough history for training. Adding synthetic data...');
    const syntheticData = trainingDataGenerator.generateSyntheticData(500);
    trainingData.push(...syntheticData);
  }
  
  return await qualityPredictor.trainModel(trainingData, {
    epochs: 50,
    verbose: 1
  });
}

/**
 * Get ML system status
 */
export function getMLStatus() {
  return {
    textAnalyzer: 'ready',
    qualityPredictor: qualityPredictor.getModelInfo()
  };
}

export default {
  // Text analysis
  textAnalyzer,
  analyzeTextQuality: textAnalyzer.analyzeTextQuality,
  analyzeTitleQuality: textAnalyzer.analyzeTitleQuality,
  analyzeKeywordsQuality: textAnalyzer.analyzeKeywordsQuality,
  analyzeMetadataText: textAnalyzer.analyzeMetadataText,
  
  // Training data
  trainingDataGenerator,
  extractFeatures: trainingDataGenerator.extractFeatures,
  generateSyntheticData: trainingDataGenerator.generateSyntheticData,
  addTrainingSample: trainingDataGenerator.addTrainingSample,
  
  // Quality prediction
  qualityPredictor,
  trainModel: qualityPredictor.trainModel,
  predictQuality: qualityPredictor.predictQuality,
  evaluateModel: qualityPredictor.evaluateModel,
  
  // Combined functionality
  enhancedEvaluation,
  trainFromHistory,
  getMLStatus
};

// Export module aliases for server.js compatibility
export const TextAnalyzer = textAnalyzer;
export const TrainingDataGenerator = trainingDataGenerator;
export const QualityPredictor = qualityPredictor;
