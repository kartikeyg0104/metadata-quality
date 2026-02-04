/**
 * Text Quality Analyzer using NLP
 * Analyzes metadata text fields for quality metrics using natural language processing
 */

import natural from 'natural';
import compromise from 'compromise';

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');

/**
 * Analyze text quality using multiple NLP metrics
 * @param {string} text - Text to analyze
 * @returns {Object} Quality metrics
 */
export function analyzeTextQuality(text) {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      score: 0,
      metrics: {
        length: 0,
        wordCount: 0,
        sentenceCount: 0,
        avgWordLength: 0,
        vocabularyRichness: 0,
        readabilityScore: 0,
        technicalTermsRatio: 0,
        specificityScore: 0
      },
      suggestions: ['Provide text content for analysis']
    };
  }

  const cleanText = text.trim();
  const tokens = tokenizer.tokenize(cleanText.toLowerCase());
  const doc = compromise(cleanText);
  
  // Basic metrics
  const length = cleanText.length;
  const wordCount = tokens.length;
  const sentences = doc.sentences().out('array');
  const sentenceCount = sentences.length || 1;
  
  // Advanced metrics
  const avgWordLength = wordCount > 0 
    ? tokens.reduce((sum, w) => sum + w.length, 0) / wordCount 
    : 0;
  
  const uniqueWords = new Set(tokens);
  const vocabularyRichness = wordCount > 0 
    ? uniqueWords.size / wordCount 
    : 0;
  
  // Readability (Flesch-Kincaid approximation)
  const avgSentenceLength = wordCount / sentenceCount;
  const syllables = countSyllables(tokens);
  const avgSyllablesPerWord = wordCount > 0 ? syllables / wordCount : 0;
  const readabilityScore = Math.max(0, Math.min(100, 
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ));
  
  // Technical terms detection
  const technicalPatterns = [
    /data(set|base)?/i, /method(ology)?/i, /analysis/i, /measure(ment)?/i,
    /observation/i, /variable/i, /sample/i, /survey/i, /study/i,
    /research/i, /experiment/i, /statistic/i, /geographic/i, /temporal/i,
    /coordinate/i, /format/i, /schema/i, /attribute/i, /record/i
  ];
  const technicalTerms = tokens.filter(t => 
    technicalPatterns.some(p => p.test(t))
  );
  const technicalTermsRatio = wordCount > 0 
    ? technicalTerms.length / wordCount 
    : 0;
  
  // Specificity score (presence of numbers, dates, proper nouns)
  // Use regex-based detection since compromise plugins may not be available
  const numberMatches = text.match(/\d+(\.\d+)?/g) || [];
  const dateMatches = text.match(/\b(19|20)\d{2}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/g) || [];
  const properNouns = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  const specificElements = numberMatches.length + dateMatches.length + Math.min(properNouns.length, 5);
  const specificityScore = Math.min(1, specificElements / 5);
  
  // Calculate overall text quality score
  const metrics = {
    length,
    wordCount,
    sentenceCount,
    avgWordLength: Math.round(avgWordLength * 100) / 100,
    vocabularyRichness: Math.round(vocabularyRichness * 100) / 100,
    readabilityScore: Math.round(readabilityScore),
    technicalTermsRatio: Math.round(technicalTermsRatio * 100) / 100,
    specificityScore: Math.round(specificityScore * 100) / 100
  };
  
  const score = calculateTextScore(metrics);
  const suggestions = generateTextSuggestions(metrics);
  
  return {
    score: Math.round(score),
    metrics,
    suggestions,
    entities: {
      numbers: numberMatches.slice(0, 5),
      dates: dateMatches.slice(0, 5),
      properNouns: properNouns.slice(0, 5)
    }
  };
}

/**
 * Count syllables in words (approximation)
 */
function countSyllables(words) {
  return words.reduce((count, word) => {
    // Simple syllable counting heuristic
    const vowels = word.match(/[aeiouy]+/gi);
    return count + (vowels ? vowels.length : 1);
  }, 0);
}

/**
 * Calculate overall text quality score from metrics
 */
function calculateTextScore(metrics) {
  const weights = {
    length: 0.15,          // Longer is better (up to a point)
    wordCount: 0.15,       // More words = more content
    vocabularyRichness: 0.20,  // Diverse vocabulary
    readabilityScore: 0.15,    // Readability
    technicalTermsRatio: 0.15, // Domain specificity
    specificityScore: 0.20     // Concrete details
  };
  
  // Normalize metrics to 0-100 scale
  const normalized = {
    length: Math.min(100, (metrics.length / 500) * 100),
    wordCount: Math.min(100, (metrics.wordCount / 100) * 100),
    vocabularyRichness: metrics.vocabularyRichness * 100,
    readabilityScore: metrics.readabilityScore,
    technicalTermsRatio: Math.min(100, metrics.technicalTermsRatio * 500),
    specificityScore: metrics.specificityScore * 100
  };
  
  // Weighted sum
  let score = 0;
  for (const [key, weight] of Object.entries(weights)) {
    score += (normalized[key] || 0) * weight;
  }
  
  return score;
}

/**
 * Generate improvement suggestions based on metrics
 */
function generateTextSuggestions(metrics) {
  const suggestions = [];
  
  if (metrics.length < 100) {
    suggestions.push('Expand the text to at least 100 characters for better context');
  }
  if (metrics.wordCount < 20) {
    suggestions.push('Add more details - aim for at least 20 words');
  }
  if (metrics.vocabularyRichness < 0.5) {
    suggestions.push('Use more varied vocabulary to improve clarity');
  }
  if (metrics.readabilityScore < 30) {
    suggestions.push('Simplify sentence structure for better readability');
  }
  if (metrics.technicalTermsRatio < 0.05) {
    suggestions.push('Include domain-specific terminology for precision');
  }
  if (metrics.specificityScore < 0.3) {
    suggestions.push('Add specific details like dates, numbers, or location names');
  }
  
  return suggestions;
}

/**
 * Analyze title quality
 */
export function analyzeTitleQuality(title) {
  if (!title || typeof title !== 'string') {
    return { score: 0, issues: ['No title provided'] };
  }
  
  const doc = compromise(title);
  const tokens = tokenizer.tokenize(title.toLowerCase());
  
  let score = 50; // Base score
  const issues = [];
  const strengths = [];
  
  // Length check
  if (title.length < 10) {
    score -= 20;
    issues.push('Title is too short');
  } else if (title.length >= 20 && title.length <= 100) {
    score += 15;
    strengths.push('Good title length');
  } else if (title.length > 150) {
    score -= 10;
    issues.push('Title is too long');
  }
  
  // Contains data type indicators
  const dataTypes = ['data', 'dataset', 'records', 'measurements', 'observations', 'survey', 'study'];
  if (dataTypes.some(dt => title.toLowerCase().includes(dt))) {
    score += 10;
    strengths.push('Indicates data type');
  }
  
  // Contains temporal information (use regex instead of compromise plugin)
  const hasDatePattern = /\b(19|20)\d{2}\b|\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/.test(title);
  if (hasDatePattern || /\d{4}/.test(title)) {
    score += 10;
    strengths.push('Contains temporal information');
  }
  
  // Contains geographic information (check for common location patterns)
  const locationPatterns = /\b(north|south|east|west|global|regional|local|national|international|world|country|state|city|area|region|county|district|zone|basin|coast|ocean|sea|lake|river|mountain|forest|desert|island|peninsula|valley|plain|plateau)\b/i;
  const hasLocation = locationPatterns.test(title);
  if (hasLocation) {
    score += 10;
    strengths.push('Contains geographic scope');
  }
  
  // Check for generic/placeholder titles
  const genericTerms = ['untitled', 'test', 'sample', 'new dataset', 'data'];
  if (genericTerms.includes(title.toLowerCase().trim())) {
    score -= 30;
    issues.push('Title appears to be a placeholder');
  }
  
  // Word count
  if (tokens.length < 3) {
    issues.push('Title needs more descriptive words');
  } else if (tokens.length >= 5 && tokens.length <= 15) {
    score += 10;
  }
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths,
    wordCount: tokens.length,
    hasDate: hasDatePattern || /\d{4}/.test(title),
    hasLocation: hasLocation
  };
}

/**
 * Analyze keywords quality
 */
export function analyzeKeywordsQuality(keywords) {
  if (!Array.isArray(keywords) || keywords.length === 0) {
    return { score: 0, issues: ['No keywords provided'] };
  }
  
  const issues = [];
  const strengths = [];
  let score = 50;
  
  // Count check
  if (keywords.length < 3) {
    score -= 15;
    issues.push('Add more keywords (minimum 3 recommended)');
  } else if (keywords.length >= 5 && keywords.length <= 15) {
    score += 20;
    strengths.push('Good keyword count');
  } else if (keywords.length > 20) {
    score -= 10;
    issues.push('Too many keywords may reduce discoverability');
  }
  
  // Check for uniqueness
  const lowerKeywords = keywords.map(k => k.toLowerCase().trim());
  const uniqueKeywords = new Set(lowerKeywords);
  if (uniqueKeywords.size < keywords.length) {
    score -= 10;
    issues.push('Remove duplicate keywords');
  }
  
  // Check for generic keywords
  const genericKeywords = ['data', 'dataset', 'information', 'file', 'research'];
  const genericFound = keywords.filter(k => genericKeywords.includes(k.toLowerCase()));
  if (genericFound.length > 0) {
    score -= 5 * genericFound.length;
    issues.push(`Replace generic keywords: ${genericFound.join(', ')}`);
  }
  
  // Check keyword quality
  const shortKeywords = keywords.filter(k => k.length < 3);
  if (shortKeywords.length > 0) {
    score -= 5;
    issues.push('Some keywords are too short');
  }
  
  // Check for domain coverage
  const avgLength = keywords.reduce((sum, k) => sum + k.length, 0) / keywords.length;
  if (avgLength >= 5) {
    score += 10;
    strengths.push('Keywords are descriptive');
  }
  
  // Semantic diversity (using TF-IDF concept)
  const tfidf = new TfIdf();
  keywords.forEach(k => tfidf.addDocument(k));
  
  return {
    score: Math.max(0, Math.min(100, score)),
    issues,
    strengths,
    count: keywords.length,
    uniqueCount: uniqueKeywords.size,
    avgLength: Math.round(avgLength * 10) / 10
  };
}

/**
 * Extract key phrases from text using TF-IDF
 */
export function extractKeyPhrases(text, maxPhrases = 10) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const doc = compromise(text);
  
  // Extract noun phrases
  const nounPhrases = doc.nouns().out('array');
  
  // Extract verbs for action phrases
  const actionPhrases = doc.verbs().out('array');
  
  // Combine and deduplicate
  const allPhrases = [...new Set([...nounPhrases, ...actionPhrases])]
    .filter(p => p.length > 3 && p.split(' ').length <= 4)
    .slice(0, maxPhrases);
  
  return allPhrases;
}

/**
 * Analyze complete metadata for text quality
 */
export function analyzeMetadataText(metadata) {
  const results = {
    title: metadata.title ? analyzeTitleQuality(metadata.title) : null,
    description: metadata.description ? analyzeTextQuality(metadata.description) : null,
    keywords: metadata.keywords ? analyzeKeywordsQuality(metadata.keywords) : null,
    methodology: metadata.methodology ? analyzeTextQuality(metadata.methodology) : null
  };
  
  // Calculate overall text quality score
  const scores = [];
  const weights = { title: 0.25, description: 0.35, keywords: 0.20, methodology: 0.20 };
  
  for (const [field, weight] of Object.entries(weights)) {
    if (results[field]) {
      scores.push({ score: results[field].score, weight });
    }
  }
  
  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0);
  const overallScore = totalWeight > 0
    ? scores.reduce((sum, s) => sum + s.score * s.weight, 0) / totalWeight
    : 0;
  
  // Suggest keywords from description if missing
  let suggestedKeywords = [];
  if (!metadata.keywords && metadata.description) {
    suggestedKeywords = extractKeyPhrases(metadata.description, 5);
  }
  
  return {
    overallTextQuality: Math.round(overallScore),
    fields: results,
    suggestedKeywords,
    summary: generateTextQualitySummary(results)
  };
}

/**
 * Generate summary of text quality analysis
 */
function generateTextQualitySummary(results) {
  const allIssues = [];
  const allStrengths = [];
  
  if (results.title?.issues) allIssues.push(...results.title.issues);
  if (results.title?.strengths) allStrengths.push(...results.title.strengths);
  if (results.description?.suggestions) allIssues.push(...results.description.suggestions);
  if (results.keywords?.issues) allIssues.push(...results.keywords.issues);
  if (results.keywords?.strengths) allStrengths.push(...results.keywords.strengths);
  if (results.methodology?.suggestions) allIssues.push(...results.methodology.suggestions);
  
  return {
    totalIssues: allIssues.length,
    issues: allIssues.slice(0, 5),
    strengths: allStrengths.slice(0, 5)
  };
}

export default {
  analyzeTextQuality,
  analyzeTitleQuality,
  analyzeKeywordsQuality,
  extractKeyPhrases,
  analyzeMetadataText
};
