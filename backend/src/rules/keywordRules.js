/**
 * Keyword Rules
 * Rules for evaluating keyword/tag quality for discoverability
 */

export const keywordRules = [
  {
    id: 'keywords-presence',
    name: 'Keywords Present',
    description: 'Dataset should have keywords for discoverability',
    category: 'description',
    weight: 8,
    severity: 'important',
    check: (metadata) => {
      const hasKeywords = Array.isArray(metadata.keywords) && metadata.keywords.length > 0;
      return {
        passed: hasKeywords,
        value: hasKeywords ? metadata.keywords : [],
        message: hasKeywords 
          ? `${metadata.keywords.length} keyword(s) present` 
          : 'No keywords provided'
      };
    },
    recommendation: 'Add keywords that describe the dataset topic, domain, and content to improve discoverability.'
  },
  
  {
    id: 'keywords-minimum-count',
    name: 'Minimum Keyword Count',
    description: 'Dataset should have at least 3 keywords',
    category: 'description',
    weight: 6,
    severity: 'warning',
    check: (metadata) => {
      if (!Array.isArray(metadata.keywords)) {
        return { passed: false, value: 0, message: 'No keywords provided' };
      }
      const count = metadata.keywords.length;
      const passed = count >= 3;
      return {
        passed,
        value: count,
        message: passed 
          ? `Adequate keyword coverage (${count} keywords)` 
          : `Insufficient keywords (${count}, minimum 3 recommended)`
      };
    },
    recommendation: 'Add at least 3 keywords covering: (1) the subject domain, (2) data type or format, (3) geographic or temporal scope.'
  },
  
  {
    id: 'keywords-not-excessive',
    name: 'Keywords Not Excessive',
    description: 'Dataset should not have too many keywords (more than 15 may indicate tag spam)',
    category: 'description',
    weight: 2,
    severity: 'suggestion',
    check: (metadata) => {
      if (!Array.isArray(metadata.keywords)) {
        return { passed: true, value: 0, message: 'No keywords to evaluate' };
      }
      const count = metadata.keywords.length;
      const passed = count <= 15;
      return {
        passed,
        value: count,
        message: passed 
          ? `Keyword count is reasonable (${count} keywords)` 
          : `Too many keywords (${count}, consider reducing to most relevant 10-15)`
      };
    },
    recommendation: 'Reduce keywords to the most relevant 10-15 terms. Excessive tagging can reduce search effectiveness.'
  },
  
  {
    id: 'keywords-unique',
    name: 'Keywords Unique',
    description: 'Keywords should not contain duplicates',
    category: 'description',
    weight: 3,
    severity: 'warning',
    check: (metadata) => {
      if (!Array.isArray(metadata.keywords) || metadata.keywords.length === 0) {
        return { passed: true, value: [], message: 'No keywords to evaluate' };
      }
      const lowerKeywords = metadata.keywords.map(k => k.toLowerCase().trim());
      const uniqueKeywords = [...new Set(lowerKeywords)];
      const hasDuplicates = uniqueKeywords.length !== lowerKeywords.length;
      const duplicates = lowerKeywords.filter((k, i) => lowerKeywords.indexOf(k) !== i);
      return {
        passed: !hasDuplicates,
        value: duplicates,
        message: hasDuplicates 
          ? `Duplicate keywords found: ${[...new Set(duplicates)].join(', ')}` 
          : 'All keywords are unique'
      };
    },
    recommendation: 'Remove duplicate keywords to maintain clean metadata.'
  },
  
  {
    id: 'keywords-length',
    name: 'Keyword Quality',
    description: 'Keywords should be meaningful (not too short)',
    category: 'description',
    weight: 3,
    severity: 'suggestion',
    check: (metadata) => {
      if (!Array.isArray(metadata.keywords) || metadata.keywords.length === 0) {
        return { passed: true, value: [], message: 'No keywords to evaluate' };
      }
      const shortKeywords = metadata.keywords.filter(k => k.trim().length < 3);
      const passed = shortKeywords.length === 0;
      return {
        passed,
        value: shortKeywords,
        message: passed 
          ? 'All keywords are meaningful length' 
          : `Some keywords are too short: ${shortKeywords.join(', ')}`
      };
    },
    recommendation: 'Replace very short keywords with more descriptive terms (minimum 3 characters recommended).'
  },
  
  {
    id: 'keywords-no-generic',
    name: 'Keywords Specific',
    description: 'Keywords should be specific (avoid overly generic terms)',
    category: 'description',
    weight: 3,
    severity: 'suggestion',
    check: (metadata) => {
      if (!Array.isArray(metadata.keywords) || metadata.keywords.length === 0) {
        return { passed: true, value: [], message: 'No keywords to evaluate' };
      }
      const genericTerms = ['data', 'dataset', 'information', 'file', 'files', 'database', 'research', 'study'];
      const genericFound = metadata.keywords.filter(k => 
        genericTerms.includes(k.toLowerCase().trim())
      );
      const passed = genericFound.length === 0;
      return {
        passed,
        value: genericFound,
        message: passed 
          ? 'Keywords are specific' 
          : `Generic keywords found: ${genericFound.join(', ')}`
      };
    },
    recommendation: 'Replace generic keywords like "data" or "dataset" with more specific domain terms.'
  }
];

export default keywordRules;
