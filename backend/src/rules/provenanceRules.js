/**
 * Provenance Rules
 * Rules for evaluating data provenance, temporal validity, and funding information
 */

export const provenanceRules = [
  {
    id: 'publication-date-present',
    name: 'Publication Date Present',
    description: 'Dataset should specify publication date',
    category: 'provenance',
    weight: 8,
    severity: 'important',
    check: (metadata) => {
      const hasDate = metadata.publication_date && 
        typeof metadata.publication_date === 'string' && 
        metadata.publication_date.trim().length > 0;
      return {
        passed: hasDate,
        value: metadata.publication_date || null,
        message: hasDate 
          ? `Publication date: ${metadata.publication_date}` 
          : 'No publication date provided'
      };
    },
    recommendation: 'Add a publication date in ISO format (YYYY-MM-DD) to establish data currency.'
  },
  
  {
    id: 'publication-date-valid',
    name: 'Publication Date Valid',
    description: 'Publication date should be a valid date',
    category: 'provenance',
    weight: 5,
    severity: 'warning',
    check: (metadata) => {
      if (!metadata.publication_date) {
        return { passed: false, value: null, message: 'No publication date provided' };
      }
      const date = new Date(metadata.publication_date);
      const isValid = !isNaN(date.getTime());
      return {
        passed: isValid,
        value: metadata.publication_date,
        message: isValid 
          ? 'Publication date is valid' 
          : 'Publication date format is invalid'
      };
    },
    recommendation: 'Use a valid date format (YYYY-MM-DD recommended, e.g., 2024-01-15).'
  },
  
  {
    id: 'publication-date-not-future',
    name: 'Publication Date Not Future',
    description: 'Publication date should not be in the future',
    category: 'provenance',
    weight: 4,
    severity: 'warning',
    check: (metadata) => {
      if (!metadata.publication_date) {
        return { passed: false, value: null, message: 'No publication date provided' };
      }
      const date = new Date(metadata.publication_date);
      if (isNaN(date.getTime())) {
        return { passed: false, value: metadata.publication_date, message: 'Invalid date format' };
      }
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      const isFuture = date > today;
      return {
        passed: !isFuture,
        value: metadata.publication_date,
        message: isFuture 
          ? 'Publication date is in the future' 
          : 'Publication date is valid (not in future)'
      };
    },
    recommendation: 'Correct the publication date to reflect when the dataset was actually published.'
  },
  
  {
    id: 'temporal-coverage-present',
    name: 'Temporal Coverage Specified',
    description: 'Dataset should specify the time period covered by the data',
    category: 'provenance',
    weight: 5,
    severity: 'suggestion',
    check: (metadata) => {
      const hasTemporal = metadata.temporal_coverage && 
        (metadata.temporal_coverage.start_date || metadata.temporal_coverage.end_date);
      return {
        passed: hasTemporal,
        value: metadata.temporal_coverage || null,
        message: hasTemporal 
          ? 'Temporal coverage is specified' 
          : 'No temporal coverage information provided'
      };
    },
    recommendation: 'Add temporal coverage information (start_date and end_date) to indicate when the data was collected.'
  },
  
  {
    id: 'spatial-coverage-present',
    name: 'Spatial Coverage Specified',
    description: 'Dataset should specify geographic coverage',
    category: 'provenance',
    weight: 4,
    severity: 'suggestion',
    check: (metadata) => {
      const hasSpatial = metadata.spatial_coverage && 
        typeof metadata.spatial_coverage === 'string' && 
        metadata.spatial_coverage.trim().length > 0;
      return {
        passed: hasSpatial,
        value: metadata.spatial_coverage || null,
        message: hasSpatial 
          ? `Spatial coverage: ${metadata.spatial_coverage}` 
          : 'No spatial coverage information provided'
      };
    },
    recommendation: 'Add geographic coverage information (e.g., country, region, coordinates) if applicable to the dataset.'
  },
  
  {
    id: 'funding-present',
    name: 'Funding Acknowledged',
    description: 'Dataset should acknowledge funding sources',
    category: 'provenance',
    weight: 4,
    severity: 'suggestion',
    check: (metadata) => {
      const hasFunding = metadata.funding && 
        typeof metadata.funding === 'string' && 
        metadata.funding.trim().length > 0;
      return {
        passed: hasFunding,
        value: metadata.funding || null,
        message: hasFunding 
          ? 'Funding source acknowledged' 
          : 'No funding information provided'
      };
    },
    recommendation: 'If applicable, add funding source information including grant numbers for transparency and compliance.'
  },
  
  {
    id: 'access-url-present',
    name: 'Access URL Provided',
    description: 'Dataset should provide an access URL',
    category: 'provenance',
    weight: 6,
    severity: 'warning',
    check: (metadata) => {
      const hasUrl = metadata.access_url && 
        typeof metadata.access_url === 'string' && 
        metadata.access_url.trim().length > 0;
      return {
        passed: hasUrl,
        value: metadata.access_url || null,
        message: hasUrl 
          ? 'Access URL provided' 
          : 'No access URL provided'
      };
    },
    recommendation: 'Add an access URL where users can download or access the dataset.'
  },
  
  {
    id: 'access-url-valid',
    name: 'Access URL Valid Format',
    description: 'Access URL should be a valid URL format',
    category: 'provenance',
    weight: 3,
    severity: 'warning',
    check: (metadata) => {
      if (!metadata.access_url) {
        return { passed: false, value: null, message: 'No access URL provided' };
      }
      const urlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
      const isValid = urlPattern.test(metadata.access_url.trim());
      return {
        passed: isValid,
        value: metadata.access_url,
        message: isValid 
          ? 'Access URL format is valid' 
          : 'Access URL format appears invalid'
      };
    },
    recommendation: 'Provide a valid HTTP/HTTPS URL (e.g., https://example.com/datasets/my-dataset).'
  },
  
  {
    id: 'citations-present',
    name: 'Citations Listed',
    description: 'Dataset should list related publications or citations',
    category: 'provenance',
    weight: 3,
    severity: 'suggestion',
    check: (metadata) => {
      const hasCitations = Array.isArray(metadata.citations) && metadata.citations.length > 0;
      return {
        passed: hasCitations,
        value: hasCitations ? metadata.citations.length : 0,
        message: hasCitations 
          ? `${metadata.citations.length} citation(s) listed` 
          : 'No citations or related publications listed'
      };
    },
    recommendation: 'Add related publications, papers, or documentation that describe or use this dataset.'
  }
];

export default provenanceRules;
