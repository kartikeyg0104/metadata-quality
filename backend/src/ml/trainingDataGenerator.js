/**
 * Training Data Generator
 * Generates and manages training data for the ML quality prediction model
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { analyzeMetadataText } from './textAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, '../../models/training-data');

// Ensure data directory exists
if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Feature extraction from metadata for ML model
 * Converts metadata into numerical feature vector
 */
export function extractFeatures(metadata, ruleResults = null) {
  const features = {};
  
  // ===== Basic presence features (0 or 1) =====
  features.hasTitle = metadata.title ? 1 : 0;
  features.hasDescription = metadata.description ? 1 : 0;
  features.hasAuthors = Array.isArray(metadata.authors) && metadata.authors.length > 0 ? 1 : 0;
  features.hasPublisher = metadata.publisher ? 1 : 0;
  features.hasLicense = metadata.license ? 1 : 0;
  features.hasKeywords = Array.isArray(metadata.keywords) && metadata.keywords.length > 0 ? 1 : 0;
  features.hasVersion = metadata.version ? 1 : 0;
  features.hasDoi = metadata.doi ? 1 : 0;
  features.hasPublicationDate = metadata.publication_date ? 1 : 0;
  features.hasMethodology = metadata.methodology ? 1 : 0;
  features.hasAccessUrl = metadata.access_url ? 1 : 0;
  features.hasFunding = metadata.funding ? 1 : 0;
  features.hasContactEmail = metadata.contact_email ? 1 : 0;
  features.hasTemporalCoverage = metadata.temporal_coverage ? 1 : 0;
  features.hasSpatialCoverage = metadata.spatial_coverage ? 1 : 0;
  features.hasDataFormat = Array.isArray(metadata.data_format) && metadata.data_format.length > 0 ? 1 : 0;
  
  // ===== Quantitative features (normalized 0-1) =====
  
  // Title quality
  features.titleLength = metadata.title 
    ? Math.min(1, metadata.title.length / 100) 
    : 0;
  
  // Description quality
  features.descriptionLength = metadata.description 
    ? Math.min(1, metadata.description.length / 500) 
    : 0;
  
  // Author count
  features.authorCount = Array.isArray(metadata.authors) 
    ? Math.min(1, metadata.authors.length / 10) 
    : 0;
  
  // Keyword count  
  features.keywordCount = Array.isArray(metadata.keywords) 
    ? Math.min(1, metadata.keywords.length / 15) 
    : 0;
  
  // Methodology quality
  features.methodologyLength = metadata.methodology 
    ? Math.min(1, metadata.methodology.length / 300) 
    : 0;
  
  // ===== Text quality features from NLP analysis =====
  const textAnalysis = analyzeMetadataText(metadata);
  
  features.titleQualityScore = textAnalysis.fields.title 
    ? textAnalysis.fields.title.score / 100 
    : 0;
  
  features.descriptionQualityScore = textAnalysis.fields.description 
    ? textAnalysis.fields.description.score / 100 
    : 0;
  
  features.keywordsQualityScore = textAnalysis.fields.keywords 
    ? textAnalysis.fields.keywords.score / 100 
    : 0;
  
  features.overallTextQuality = textAnalysis.overallTextQuality / 100;
  
  // ===== Description metrics =====
  if (textAnalysis.fields.description?.metrics) {
    const dm = textAnalysis.fields.description.metrics;
    features.descVocabularyRichness = dm.vocabularyRichness || 0;
    features.descReadabilityScore = (dm.readabilityScore || 0) / 100;
    features.descTechnicalTermsRatio = Math.min(1, (dm.technicalTermsRatio || 0) * 5);
    features.descSpecificityScore = dm.specificityScore || 0;
  } else {
    features.descVocabularyRichness = 0;
    features.descReadabilityScore = 0;
    features.descTechnicalTermsRatio = 0;
    features.descSpecificityScore = 0;
  }
  
  // ===== License quality =====
  const spdxLicenses = ['CC0-1.0', 'CC-BY-4.0', 'CC-BY-SA-4.0', 'MIT', 'Apache-2.0', 'ODbL-1.0'];
  features.hasSpdxLicense = metadata.license && spdxLicenses.some(l => 
    metadata.license.toUpperCase().includes(l.toUpperCase())
  ) ? 1 : 0;
  
  features.hasOpenLicense = metadata.license && 
    /^(CC0|CC-BY|MIT|Apache|BSD|ODbL|PDDL|Public\s*Domain)/i.test(metadata.license) ? 1 : 0;
  
  // ===== Completeness score (percentage of fields filled) =====
  const presenceFields = [
    'hasTitle', 'hasDescription', 'hasAuthors', 'hasPublisher', 'hasLicense',
    'hasKeywords', 'hasVersion', 'hasPublicationDate', 'hasMethodology', 'hasAccessUrl'
  ];
  features.completeness = presenceFields.reduce((sum, f) => sum + features[f], 0) / presenceFields.length;
  
  // ===== Rule-based features (if available) =====
  if (ruleResults) {
    const passed = ruleResults.filter(r => r.passed).length;
    features.rulePassRate = ruleResults.length > 0 ? passed / ruleResults.length : 0;
    
    // Category pass rates
    const categories = ['identification', 'description', 'legal', 'provenance'];
    for (const cat of categories) {
      const catRules = ruleResults.filter(r => r.category === cat);
      const catPassed = catRules.filter(r => r.passed).length;
      features[`${cat}PassRate`] = catRules.length > 0 ? catPassed / catRules.length : 0;
    }
  }
  
  return features;
}

/**
 * Convert features object to array for model input
 */
export function featuresToArray(features) {
  // Define consistent feature order
  const featureOrder = [
    // Presence features
    'hasTitle', 'hasDescription', 'hasAuthors', 'hasPublisher', 'hasLicense',
    'hasKeywords', 'hasVersion', 'hasDoi', 'hasPublicationDate', 'hasMethodology',
    'hasAccessUrl', 'hasFunding', 'hasContactEmail', 'hasTemporalCoverage',
    'hasSpatialCoverage', 'hasDataFormat',
    // Quantitative features
    'titleLength', 'descriptionLength', 'authorCount', 'keywordCount', 'methodologyLength',
    // NLP features
    'titleQualityScore', 'descriptionQualityScore', 'keywordsQualityScore', 'overallTextQuality',
    'descVocabularyRichness', 'descReadabilityScore', 'descTechnicalTermsRatio', 'descSpecificityScore',
    // License features
    'hasSpdxLicense', 'hasOpenLicense',
    // Completeness
    'completeness'
  ];
  
  return featureOrder.map(f => features[f] || 0);
}

/**
 * Get feature names in order
 */
export function getFeatureNames() {
  return [
    'hasTitle', 'hasDescription', 'hasAuthors', 'hasPublisher', 'hasLicense',
    'hasKeywords', 'hasVersion', 'hasDoi', 'hasPublicationDate', 'hasMethodology',
    'hasAccessUrl', 'hasFunding', 'hasContactEmail', 'hasTemporalCoverage',
    'hasSpatialCoverage', 'hasDataFormat',
    'titleLength', 'descriptionLength', 'authorCount', 'keywordCount', 'methodologyLength',
    'titleQualityScore', 'descriptionQualityScore', 'keywordsQualityScore', 'overallTextQuality',
    'descVocabularyRichness', 'descReadabilityScore', 'descTechnicalTermsRatio', 'descSpecificityScore',
    'hasSpdxLicense', 'hasOpenLicense',
    'completeness'
  ];
}

/**
 * Generate synthetic training data
 * Creates metadata samples with known quality levels
 */
export function generateSyntheticData(count = 1000) {
  const data = [];
  
  for (let i = 0; i < count; i++) {
    const quality = Math.random(); // 0-1 quality target
    const metadata = generateMetadataForQuality(quality);
    const features = extractFeatures(metadata);
    
    data.push({
      metadata,
      features: featuresToArray(features),
      target: quality * 100 // 0-100 score
    });
  }
  
  return data;
}

/**
 * Generate metadata with approximate target quality
 */
function generateMetadataForQuality(quality) {
  const metadata = {};
  
  // Higher quality = more likely to have each field
  if (Math.random() < quality + 0.3) {
    metadata.title = generateTitle(quality);
  }
  
  if (Math.random() < quality + 0.2) {
    metadata.description = generateDescription(quality);
  }
  
  if (Math.random() < quality) {
    metadata.authors = generateAuthors(quality);
  }
  
  if (Math.random() < quality) {
    metadata.publisher = generatePublisher();
  }
  
  if (Math.random() < quality + 0.1) {
    metadata.license = generateLicense(quality);
  }
  
  if (Math.random() < quality) {
    metadata.keywords = generateKeywords(quality);
  }
  
  if (Math.random() < quality * 0.8) {
    metadata.version = generateVersion();
  }
  
  if (Math.random() < quality * 0.6) {
    metadata.doi = generateDoi();
  }
  
  if (Math.random() < quality) {
    metadata.publication_date = generateDate();
  }
  
  if (Math.random() < quality * 0.7) {
    metadata.methodology = generateMethodology(quality);
  }
  
  if (Math.random() < quality * 0.8) {
    metadata.access_url = generateUrl();
  }
  
  if (Math.random() < quality * 0.5) {
    metadata.funding = generateFunding();
  }
  
  if (Math.random() < quality * 0.6) {
    metadata.contact_email = generateEmail();
  }
  
  return metadata;
}

// Generator helpers
const domains = ['climate', 'health', 'economic', 'environmental', 'social', 'demographic', 'geographic', 'transportation', 'energy', 'agricultural'];
const dataTypes = ['measurements', 'observations', 'records', 'survey results', 'statistics', 'time series', 'spatial data', 'census data'];
const regions = ['United States', 'European Union', 'Global', 'North America', 'Asia Pacific', 'United Kingdom', 'Australia'];
const years = ['2020', '2021', '2022', '2023', '2024', '2025'];

function generateTitle(quality) {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
  
  if (quality < 0.3) {
    // Poor quality titles
    const poor = ['data', 'dataset', 'test', 'sample', 'untitled', `${domain} data`];
    return poor[Math.floor(Math.random() * poor.length)];
  } else if (quality < 0.6) {
    // Medium quality
    return `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${dataType}`;
  } else {
    // High quality
    const year = years[Math.floor(Math.random() * years.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    return `${domain.charAt(0).toUpperCase() + domain.slice(1)} ${dataType} for ${region} (${year})`;
  }
}

function generateDescription(quality) {
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];
  
  if (quality < 0.3) {
    return `${dataType} about ${domain}.`;
  } else if (quality < 0.6) {
    return `This dataset contains ${dataType} related to ${domain}. It includes various measurements and observations collected over multiple time periods.`;
  } else {
    const region = regions[Math.floor(Math.random() * regions.length)];
    return `Comprehensive ${domain} ${dataType} collected across ${region}. This dataset includes detailed measurements, observations, and analysis results. Data was gathered using standardized methodologies and has undergone quality assurance processes. It covers temporal periods from 2010 to 2024 and includes geographic coordinates for spatial analysis.`;
  }
}

function generateAuthors(quality) {
  const count = quality < 0.5 ? 1 : Math.floor(Math.random() * 5) + 1;
  const names = ['Research Institute', 'University Lab', 'Dr. Smith', 'Prof. Johnson', 'Data Science Team', 'Analytics Department'];
  return names.slice(0, count);
}

function generatePublisher() {
  const publishers = ['National Research Council', 'Open Data Initiative', 'University Press', 'Government Statistics Office', 'Science Foundation'];
  return publishers[Math.floor(Math.random() * publishers.length)];
}

function generateLicense(quality) {
  if (quality > 0.7) {
    const open = ['CC-BY-4.0', 'CC0-1.0', 'MIT', 'Apache-2.0', 'ODbL-1.0'];
    return open[Math.floor(Math.random() * open.length)];
  } else if (quality > 0.4) {
    const mixed = ['CC-BY-NC-4.0', 'CC-BY-SA-4.0', 'Custom License'];
    return mixed[Math.floor(Math.random() * mixed.length)];
  } else {
    return 'proprietary';
  }
}

function generateKeywords(quality) {
  const count = quality < 0.4 ? 2 : Math.floor(quality * 10) + 3;
  const keywords = ['climate', 'environmental', 'analysis', 'statistics', 'geographic', 'temporal', 'survey', 'measurement', 'observation', 'research', 'scientific', 'government', 'public', 'open'];
  return keywords.slice(0, Math.min(count, keywords.length));
}

function generateVersion() {
  const major = Math.floor(Math.random() * 3) + 1;
  const minor = Math.floor(Math.random() * 10);
  return `${major}.${minor}.0`;
}

function generateDoi() {
  return `10.${Math.floor(Math.random() * 9000) + 1000}/${Math.random().toString(36).substr(2, 9)}`;
}

function generateDate() {
  const year = 2020 + Math.floor(Math.random() * 6);
  const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generateMethodology(quality) {
  if (quality < 0.4) {
    return 'Standard data collection methods.';
  } else {
    return 'Data was collected using standardized survey instruments and validated measurement protocols. Quality assurance included automated validation checks, manual review of outliers, and cross-referencing with external sources. Sampling methodology followed established statistical guidelines.';
  }
}

function generateUrl() {
  const sites = ['data.gov', 'opendata.org', 'repository.edu', 'dataverse.harvard.edu', 'figshare.com'];
  return `https://${sites[Math.floor(Math.random() * sites.length)]}/dataset/${Math.random().toString(36).substr(2, 8)}`;
}

function generateFunding() {
  const funders = ['National Science Foundation', 'European Research Council', 'Government Grant', 'Private Foundation', 'Research Council'];
  return `${funders[Math.floor(Math.random() * funders.length)]} Grant #${Math.floor(Math.random() * 900000) + 100000}`;
}

function generateEmail() {
  const domains = ['research.org', 'university.edu', 'gov.agency', 'institute.org'];
  return `contact@${domains[Math.floor(Math.random() * domains.length)]}`;
}

/**
 * Save training data to file
 */
export function saveTrainingData(data, filename = 'training-data.json') {
  const filepath = join(DATA_DIR, filename);
  writeFileSync(filepath, JSON.stringify(data, null, 2));
  return filepath;
}

/**
 * Load training data from file
 */
export function loadTrainingData(filename = 'training-data.json') {
  const filepath = join(DATA_DIR, filename);
  if (!existsSync(filepath)) {
    return null;
  }
  return JSON.parse(readFileSync(filepath, 'utf-8'));
}

/**
 * Add real evaluation result to training data
 * Used to improve model with actual evaluations
 */
export function addTrainingSample(metadata, actualScore, filename = 'real-training-data.json') {
  const filepath = join(DATA_DIR, filename);
  
  let data = [];
  if (existsSync(filepath)) {
    data = JSON.parse(readFileSync(filepath, 'utf-8'));
  }
  
  const features = extractFeatures(metadata);
  data.push({
    metadata,
    features: featuresToArray(features),
    target: actualScore,
    timestamp: new Date().toISOString()
  });
  
  writeFileSync(filepath, JSON.stringify(data, null, 2));
  return data.length;
}

export default {
  extractFeatures,
  featuresToArray,
  getFeatureNames,
  generateSyntheticData,
  saveTrainingData,
  loadTrainingData,
  addTrainingSample
};
