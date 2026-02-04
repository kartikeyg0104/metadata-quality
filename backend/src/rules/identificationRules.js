/**
 * Title and Identification Rules
 * Rules for evaluating dataset title and core identification fields
 */

export const identificationRules = [
  {
    id: 'title-presence',
    name: 'Title Present',
    description: 'Dataset must have a title',
    category: 'identification',
    weight: 15,
    severity: 'critical',
    check: (metadata) => {
      const hasTitle = metadata.title && typeof metadata.title === 'string' && metadata.title.trim().length > 0;
      return {
        passed: hasTitle,
        value: metadata.title || null,
        message: hasTitle 
          ? 'Title is present' 
          : 'Dataset is missing a title'
      };
    },
    recommendation: 'Provide a clear, concise title that describes the dataset content.'
  },
  
  {
    id: 'title-length',
    name: 'Title Length',
    description: 'Title should be at least 10 characters for clarity',
    category: 'identification',
    weight: 8,
    severity: 'warning',
    check: (metadata) => {
      if (!metadata.title) {
        return { passed: false, value: 0, message: 'No title provided' };
      }
      const length = metadata.title.trim().length;
      const passed = length >= 10;
      return {
        passed,
        value: length,
        message: passed 
          ? `Title length (${length} chars) meets minimum requirement` 
          : `Title is too short (${length} chars, minimum 10 recommended)`
      };
    },
    recommendation: 'Expand the title to be more descriptive (at least 10 characters). Include the subject, data type, and scope.'
  },
  
  {
    id: 'title-not-generic',
    name: 'Title Not Generic',
    description: 'Title should not be overly generic',
    category: 'identification',
    weight: 5,
    severity: 'warning',
    check: (metadata) => {
      if (!metadata.title) {
        return { passed: false, value: null, message: 'No title provided' };
      }
      const genericTitles = ['data', 'dataset', 'file', 'untitled', 'test', 'sample', 'new dataset'];
      const titleLower = metadata.title.trim().toLowerCase();
      const isGeneric = genericTitles.some(g => titleLower === g || titleLower.startsWith(g + ' '));
      return {
        passed: !isGeneric,
        value: metadata.title,
        message: isGeneric 
          ? 'Title appears to be generic or placeholder text' 
          : 'Title is specific and descriptive'
      };
    },
    recommendation: 'Replace generic title with a specific, descriptive name that indicates the dataset content and scope.'
  },
  
  {
    id: 'authors-presence',
    name: 'Authors Listed',
    description: 'Dataset should list at least one author or contributor',
    category: 'identification',
    weight: 10,
    severity: 'important',
    check: (metadata) => {
      const hasAuthors = Array.isArray(metadata.authors) && metadata.authors.length > 0;
      return {
        passed: hasAuthors,
        value: hasAuthors ? metadata.authors.length : 0,
        message: hasAuthors 
          ? `${metadata.authors.length} author(s) listed` 
          : 'No authors listed'
      };
    },
    recommendation: 'Add at least one author name to establish provenance and enable proper citation.'
  },
  
  {
    id: 'publisher-presence',
    name: 'Publisher Identified',
    description: 'Dataset should identify the publishing organization',
    category: 'identification',
    weight: 6,
    severity: 'warning',
    check: (metadata) => {
      const hasPublisher = metadata.publisher && typeof metadata.publisher === 'string' && metadata.publisher.trim().length > 0;
      return {
        passed: hasPublisher,
        value: metadata.publisher || null,
        message: hasPublisher 
          ? 'Publisher is identified' 
          : 'No publisher information provided'
      };
    },
    recommendation: 'Add the name of the organization or entity responsible for publishing this dataset.'
  },
  
  {
    id: 'version-present',
    name: 'Version Specified',
    description: 'Dataset should have a version identifier',
    category: 'identification',
    weight: 4,
    severity: 'suggestion',
    check: (metadata) => {
      const hasVersion = metadata.version && typeof metadata.version === 'string' && metadata.version.trim().length > 0;
      return {
        passed: hasVersion,
        value: metadata.version || null,
        message: hasVersion 
          ? `Version ${metadata.version} specified` 
          : 'No version information provided'
      };
    },
    recommendation: 'Add a version identifier (e.g., "1.0.0", "2024-01") to track dataset updates and enable reproducibility.'
  },
  
  {
    id: 'doi-present',
    name: 'DOI Available',
    description: 'Dataset should have a Digital Object Identifier for persistent citation',
    category: 'identification',
    weight: 5,
    severity: 'suggestion',
    check: (metadata) => {
      const hasDoi = metadata.doi && typeof metadata.doi === 'string' && metadata.doi.trim().length > 0;
      const doiPattern = /^10\.\d{4,}\/[^\s]+$/;
      const validDoi = hasDoi && doiPattern.test(metadata.doi);
      return {
        passed: validDoi,
        value: metadata.doi || null,
        message: validDoi 
          ? 'Valid DOI present' 
          : hasDoi 
            ? 'DOI format appears invalid' 
            : 'No DOI provided'
      };
    },
    recommendation: 'Register a DOI for this dataset to enable persistent identification and proper citation.'
  }
];

export default identificationRules;
