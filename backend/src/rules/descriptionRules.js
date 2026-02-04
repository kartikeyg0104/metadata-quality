/**
 * Description Rules
 * Rules for evaluating dataset description quality
 */

export const descriptionRules = [
  {
    id: 'description-presence',
    name: 'Description Present',
    description: 'Dataset must have a description',
    category: 'description',
    weight: 12,
    severity: 'critical',
    check: (metadata) => {
      const hasDescription = metadata.description && 
        typeof metadata.description === 'string' && 
        metadata.description.trim().length > 0;
      return {
        passed: hasDescription,
        value: metadata.description || null,
        message: hasDescription 
          ? 'Description is present' 
          : 'Dataset is missing a description'
      };
    },
    recommendation: 'Add a description explaining what the dataset contains, its purpose, and how it was created.'
  },
  
  {
    id: 'description-length-minimum',
    name: 'Description Minimum Length',
    description: 'Description should be at least 100 characters',
    category: 'description',
    weight: 10,
    severity: 'important',
    check: (metadata) => {
      if (!metadata.description) {
        return { passed: false, value: 0, message: 'No description provided' };
      }
      const length = metadata.description.trim().length;
      const passed = length >= 100;
      return {
        passed,
        value: length,
        message: passed 
          ? `Description length (${length} chars) meets minimum requirement` 
          : `Description is too short (${length} chars, minimum 100 recommended)`
      };
    },
    recommendation: 'Expand the description to at least 100 characters. Include information about the data content, collection methods, and intended use.'
  },
  
  {
    id: 'description-comprehensive',
    name: 'Description Comprehensive',
    description: 'Description should be detailed (at least 250 characters for good quality)',
    category: 'description',
    weight: 6,
    severity: 'suggestion',
    check: (metadata) => {
      if (!metadata.description) {
        return { passed: false, value: 0, message: 'No description provided' };
      }
      const length = metadata.description.trim().length;
      const passed = length >= 250;
      return {
        passed,
        value: length,
        message: passed 
          ? `Description is comprehensive (${length} chars)` 
          : `Description could be more detailed (${length} chars, 250+ recommended for best quality)`
      };
    },
    recommendation: 'For best quality, expand the description to 250+ characters covering data scope, methodology, temporal/spatial coverage, and limitations.'
  },
  
  {
    id: 'methodology-present',
    name: 'Methodology Documented',
    description: 'Dataset should document collection or processing methodology',
    category: 'description',
    weight: 8,
    severity: 'important',
    check: (metadata) => {
      const hasMethodology = metadata.methodology && 
        typeof metadata.methodology === 'string' && 
        metadata.methodology.trim().length > 0;
      return {
        passed: hasMethodology,
        value: hasMethodology ? metadata.methodology.length : 0,
        message: hasMethodology 
          ? 'Methodology is documented' 
          : 'No methodology documentation provided'
      };
    },
    recommendation: 'Add methodology documentation explaining how the data was collected, processed, and validated.'
  },
  
  {
    id: 'methodology-detailed',
    name: 'Methodology Detailed',
    description: 'Methodology should be sufficiently detailed (at least 50 characters)',
    category: 'description',
    weight: 4,
    severity: 'suggestion',
    check: (metadata) => {
      if (!metadata.methodology) {
        return { passed: false, value: 0, message: 'No methodology provided' };
      }
      const length = metadata.methodology.trim().length;
      const passed = length >= 50;
      return {
        passed,
        value: length,
        message: passed 
          ? `Methodology is adequately detailed (${length} chars)` 
          : `Methodology description is brief (${length} chars, 50+ recommended)`
      };
    },
    recommendation: 'Expand methodology to include specific collection instruments, sampling methods, processing steps, and quality assurance measures.'
  },
  
  {
    id: 'data-format-specified',
    name: 'Data Format Specified',
    description: 'Dataset should specify available data formats',
    category: 'description',
    weight: 5,
    severity: 'warning',
    check: (metadata) => {
      const hasFormats = Array.isArray(metadata.data_format) && metadata.data_format.length > 0;
      return {
        passed: hasFormats,
        value: hasFormats ? metadata.data_format : [],
        message: hasFormats 
          ? `Data formats specified: ${metadata.data_format.join(', ')}` 
          : 'No data formats specified'
      };
    },
    recommendation: 'Specify the file formats available for this dataset (e.g., CSV, JSON, Parquet, GeoJSON).'
  }
];

export default descriptionRules;
