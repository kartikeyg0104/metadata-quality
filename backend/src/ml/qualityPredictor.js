/**
 * Quality Prediction Model
 * Neural network for predicting metadata quality scores
 * Uses TensorFlow.js for training and inference
 */

import * as tf from '@tensorflow/tfjs';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { extractFeatures, featuresToArray, getFeatureNames, generateSyntheticData, saveTrainingData, loadTrainingData } from './trainingDataGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MODEL_DIR = join(__dirname, '../../models');

// Model configuration
const MODEL_CONFIG = {
  inputSize: 32, // Number of features from trainingDataGenerator
  hiddenLayers: [64, 32, 16],
  learningRate: 0.001,
  epochs: 100,
  batchSize: 32,
  validationSplit: 0.2
};

let model = null;
let modelLoaded = false;
let trainingHistory = [];

/**
 * Create the neural network model
 */
function createModel() {
  const model = tf.sequential();
  
  // Input layer + first hidden layer
  model.add(tf.layers.dense({
    inputShape: [MODEL_CONFIG.inputSize],
    units: MODEL_CONFIG.hiddenLayers[0],
    activation: 'relu',
    kernelInitializer: 'heNormal',
    kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
  }));
  
  model.add(tf.layers.batchNormalization());
  model.add(tf.layers.dropout({ rate: 0.3 }));
  
  // Additional hidden layers
  for (let i = 1; i < MODEL_CONFIG.hiddenLayers.length; i++) {
    model.add(tf.layers.dense({
      units: MODEL_CONFIG.hiddenLayers[i],
      activation: 'relu',
      kernelInitializer: 'heNormal',
      kernelRegularizer: tf.regularizers.l2({ l2: 0.001 })
    }));
    model.add(tf.layers.batchNormalization());
    model.add(tf.layers.dropout({ rate: 0.2 }));
  }
  
  // Output layer (single value: quality score 0-100)
  model.add(tf.layers.dense({
    units: 1,
    activation: 'sigmoid' // Output 0-1, will scale to 0-100
  }));
  
  // Compile model
  model.compile({
    optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae'] // Mean Absolute Error
  });
  
  return model;
}

/**
 * Train the model with data
 * @param {Array} trainingData - Array of { features, target } objects
 * @param {Object} options - Training options
 */
export async function trainModel(trainingData = null, options = {}) {
  const {
    epochs = MODEL_CONFIG.epochs,
    batchSize = MODEL_CONFIG.batchSize,
    validationSplit = MODEL_CONFIG.validationSplit,
    verbose = 1
  } = options;
  
  // Generate synthetic data if none provided
  if (!trainingData || trainingData.length === 0) {
    console.log('Generating synthetic training data...');
    trainingData = generateSyntheticData(2000);
    saveTrainingData(trainingData, 'synthetic-training-data.json');
  }
  
  // Also load any real training data
  const realData = loadTrainingData('real-training-data.json');
  if (realData && realData.length > 0) {
    console.log(`Adding ${realData.length} real training samples...`);
    trainingData = [...trainingData, ...realData];
  }
  
  console.log(`Training with ${trainingData.length} samples...`);
  
  // Prepare tensors
  const features = trainingData.map(d => d.features);
  const targets = trainingData.map(d => d.target / 100); // Normalize to 0-1
  
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(targets, [targets.length, 1]);
  
  // Create new model
  model = createModel();
  
  // Train
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize,
    validationSplit,
    shuffle: true,
    verbose,
    callbacks: {
      onEpochEnd: (epoch, logs) => {
        if (verbose && epoch % 10 === 0) {
          console.log(`Epoch ${epoch}: loss = ${logs.loss.toFixed(4)}, mae = ${logs.mae.toFixed(4)}`);
        }
      }
    }
  });
  
  trainingHistory = history.history;
  
  // Cleanup tensors
  xs.dispose();
  ys.dispose();
  
  // Save model
  await saveModel();
  
  modelLoaded = true;
  
  // Return training summary
  const finalLoss = history.history.loss[history.history.loss.length - 1];
  const finalMae = history.history.mae[history.history.mae.length - 1];
  
  return {
    success: true,
    epochs: epochs,
    samples: trainingData.length,
    finalLoss: finalLoss.toFixed(4),
    finalMae: (finalMae * 100).toFixed(2), // Scale MAE back to 0-100
    history: {
      loss: history.history.loss.map(l => l.toFixed(4)),
      mae: history.history.mae.map(m => (m * 100).toFixed(2))
    }
  };
}

/**
 * Save model to disk using JSON serialization
 */
async function saveModel() {
  if (!model) return;
  
  const modelPath = join(MODEL_DIR, 'quality-predictor');
  if (!existsSync(modelPath)) {
    mkdirSync(modelPath, { recursive: true });
  }
  
  // Get model architecture and weights
  const modelJSON = model.toJSON();
  const weights = model.getWeights();
  const weightData = weights.map(w => ({
    name: w.name,
    shape: w.shape,
    dtype: w.dtype,
    data: Array.from(w.dataSync())
  }));
  
  // Save model architecture
  writeFileSync(join(modelPath, 'model.json'), JSON.stringify(modelJSON, null, 2));
  
  // Save weights
  writeFileSync(join(modelPath, 'weights.json'), JSON.stringify(weightData, null, 2));
  
  // Save metadata
  const metadata = {
    createdAt: new Date().toISOString(),
    config: MODEL_CONFIG,
    featureNames: getFeatureNames(),
    trainingHistory: trainingHistory
  };
  writeFileSync(join(modelPath, 'metadata.json'), JSON.stringify(metadata, null, 2));
  
  console.log(`Model saved to ${modelPath}`);
}

/**
 * Load model from disk
 */
export async function loadModel() {
  const modelPath = join(MODEL_DIR, 'quality-predictor');
  
  if (!existsSync(join(modelPath, 'model.json'))) {
    console.log('No saved model found. Will train on first use.');
    return false;
  }
  
  try {
    // Load model architecture
    const modelJSON = JSON.parse(readFileSync(join(modelPath, 'model.json'), 'utf-8'));
    
    // Check if weights exist
    if (!existsSync(join(modelPath, 'weights.json'))) {
      console.log('No weights found. Will retrain model.');
      return false;
    }
    
    // Recreate model from architecture
    model = await tf.models.modelFromJSON(modelJSON);
    
    // Load and set weights
    const weightData = JSON.parse(readFileSync(join(modelPath, 'weights.json'), 'utf-8'));
    const weights = weightData.map(w => tf.tensor(w.data, w.shape, w.dtype));
    model.setWeights(weights);
    
    model.compile({
      optimizer: tf.train.adam(MODEL_CONFIG.learningRate),
      loss: 'meanSquaredError',
      metrics: ['mae']
    });
    modelLoaded = true;
    console.log('Model loaded successfully');
    return true;
  } catch (error) {
    console.error('Error loading model:', error.message);
    return false;
  }
}

/**
 * Predict quality score for metadata
 * @param {Object} metadata - Metadata object to evaluate
 * @returns {Object} Prediction result with score and confidence
 */
export async function predictQuality(metadata) {
  // Ensure model is loaded
  if (!modelLoaded) {
    const loaded = await loadModel();
    if (!loaded) {
      // Train a new model if none exists
      console.log('Training new model...');
      await trainModel(null, { epochs: 50, verbose: 0 });
    }
  }
  
  // Extract features
  const features = extractFeatures(metadata);
  const featureArray = featuresToArray(features);
  
  // Make prediction
  const inputTensor = tf.tensor2d([featureArray]);
  const prediction = model.predict(inputTensor);
  const score = (await prediction.data())[0] * 100; // Scale back to 0-100
  
  // Cleanup
  inputTensor.dispose();
  prediction.dispose();
  
  // Calculate confidence based on feature completeness
  const filledFeatures = featureArray.filter(f => f > 0).length;
  const confidence = Math.min(100, (filledFeatures / featureArray.length) * 100 + 20);
  
  // Get feature importance (approximation)
  const featureImportance = await getFeatureImportance(featureArray);
  
  return {
    predictedScore: Math.round(Math.max(0, Math.min(100, score))),
    confidence: Math.round(confidence),
    features: features,
    featureImportance: featureImportance.slice(0, 5), // Top 5 important features
    modelVersion: '1.0'
  };
}

/**
 * Get feature importance through gradient-based analysis
 */
async function getFeatureImportance(featureArray) {
  const featureNames = getFeatureNames();
  
  // Calculate importance as feature value * position weight
  // (simplified approximation without actual gradients)
  const importance = featureNames.map((name, i) => ({
    feature: name,
    value: featureArray[i],
    importance: featureArray[i] * (1 - i * 0.02) // Decay importance by position
  }));
  
  // Sort by importance
  importance.sort((a, b) => b.importance - a.importance);
  
  return importance;
}

/**
 * Batch predict quality for multiple metadata records
 */
export async function batchPredictQuality(metadataRecords) {
  if (!modelLoaded) {
    await loadModel() || await trainModel(null, { epochs: 50, verbose: 0 });
  }
  
  const features = metadataRecords.map(m => featuresToArray(extractFeatures(m)));
  const inputTensor = tf.tensor2d(features);
  const predictions = model.predict(inputTensor);
  const scores = await predictions.data();
  
  inputTensor.dispose();
  predictions.dispose();
  
  return metadataRecords.map((metadata, i) => ({
    metadata,
    predictedScore: Math.round(Math.max(0, Math.min(100, scores[i] * 100)))
  }));
}

/**
 * Evaluate model performance
 */
export async function evaluateModel(testData = null) {
  if (!modelLoaded) {
    const loaded = await loadModel();
    if (!loaded) return { error: 'No model available' };
  }
  
  // Generate test data if none provided
  if (!testData) {
    testData = generateSyntheticData(200);
  }
  
  const features = testData.map(d => d.features);
  const targets = testData.map(d => d.target);
  
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(targets.map(t => t / 100), [targets.length, 1]);
  
  const evaluation = await model.evaluate(xs, ys);
  const [loss, mae] = await Promise.all(evaluation.map(t => t.data()));
  
  xs.dispose();
  ys.dispose();
  evaluation.forEach(t => t.dispose());
  
  // Calculate R² score
  const predictions = await batchPredictQuality(testData.map(d => d.metadata));
  const predScores = predictions.map(p => p.predictedScore);
  const actualScores = targets;
  
  const meanActual = actualScores.reduce((a, b) => a + b, 0) / actualScores.length;
  const ssRes = actualScores.reduce((sum, actual, i) => 
    sum + Math.pow(actual - predScores[i], 2), 0);
  const ssTot = actualScores.reduce((sum, actual) => 
    sum + Math.pow(actual - meanActual, 2), 0);
  const r2 = 1 - (ssRes / ssTot);
  
  return {
    loss: loss[0].toFixed(4),
    mae: (mae[0] * 100).toFixed(2),
    r2Score: (r2 * 100).toFixed(2) + '%',
    samplesEvaluated: testData.length
  };
}

/**
 * Get model info
 */
export function getModelInfo() {
  return {
    loaded: modelLoaded,
    config: MODEL_CONFIG,
    featureCount: MODEL_CONFIG.inputSize,
    featureNames: getFeatureNames(),
    layers: model ? model.layers.map(l => ({
      name: l.name,
      units: l.units || 0,
      activation: l.activation?.name || 'none'
    })) : []
  };
}

/**
 * Fine-tune model with new data
 */
export async function fineTuneModel(newData, options = {}) {
  if (!modelLoaded) {
    await loadModel() || await trainModel(null, { epochs: 50, verbose: 0 });
  }
  
  const {
    epochs = 20,
    learningRate = 0.0001 // Lower learning rate for fine-tuning
  } = options;
  
  // Recompile with lower learning rate
  model.compile({
    optimizer: tf.train.adam(learningRate),
    loss: 'meanSquaredError',
    metrics: ['mae']
  });
  
  const features = newData.map(d => d.features);
  const targets = newData.map(d => d.target / 100);
  
  const xs = tf.tensor2d(features);
  const ys = tf.tensor2d(targets, [targets.length, 1]);
  
  const history = await model.fit(xs, ys, {
    epochs,
    batchSize: 16,
    verbose: 0
  });
  
  xs.dispose();
  ys.dispose();
  
  await saveModel();
  
  return {
    success: true,
    epochs: epochs,
    finalLoss: history.history.loss[history.history.loss.length - 1].toFixed(4)
  };
}

/**
 * Initialize model on module load
 */
export async function initializeModel() {
  try {
    const loaded = await loadModel();
    if (!loaded) {
      console.log('No pre-trained model found. Model will be trained on first use.');
    }
    return loaded;
  } catch (error) {
    console.error('Error initializing model:', error.message);
    return false;
  }
}

export default {
  trainModel,
  loadModel,
  predictQuality,
  batchPredictQuality,
  evaluateModel,
  getModelInfo,
  fineTuneModel,
  initializeModel
};
