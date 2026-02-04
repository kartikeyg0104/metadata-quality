/**
 * Accessibility Rules - Data accessibility and usability checks
 * Maps to Provenance category in UI
 */

export const accessibilityRules = [
  {
    id: 'acc-url-present',
    name: 'Access URL Present',
    description: 'Dataset must have an access URL',
    category: 'provenance',
    severity: 'important',
    weight: 8,
    check: (metadata) => {
      const hasUrl = !!(metadata.access_url || metadata.accessURL || metadata.download_url || metadata.downloadURL);
      return {
        passed: hasUrl,
        value: metadata.access_url || metadata.download_url || null,
        message: hasUrl 
          ? 'Dataset has an access URL'
          : 'Missing access URL - users cannot find where to get the data'
      };
    },
    recommendation: 'Provide a valid HTTP/HTTPS URL where users can access the data.'
  },
  {
    id: 'acc-url-valid',
    name: 'Access URL Valid',
    description: 'Access URL must be a valid HTTP/HTTPS URL',
    category: 'provenance',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const url = metadata.access_url || metadata.accessURL || metadata.download_url;
      if (!url) return { passed: false, message: 'No access URL to validate' };
      
      const urlPattern = /^https?:\/\/[^\s]+$/i;
      const isValid = urlPattern.test(url);
      return {
        passed: isValid,
        value: url,
        message: isValid 
          ? 'Access URL is valid'
          : 'Access URL is not a valid HTTP/HTTPS URL'
      };
    },
    recommendation: 'Ensure the access URL starts with http:// or https:// and contains no spaces.'
  },
  {
    id: 'acc-format-specified',
    name: 'Data Format Specified',
    description: 'Available data formats should be specified',
    category: 'description',
    severity: 'important',
    weight: 6,
    check: (metadata) => {
      const formats = metadata.data_format || metadata.format || metadata.distribution;
      const hasFormats = Array.isArray(formats) ? formats.length > 0 : !!formats;
      return {
        passed: hasFormats,
        value: formats,
        message: hasFormats
          ? `Data format(s) specified: ${Array.isArray(formats) ? formats.join(', ') : formats}`
          : 'No data format specified'
      };
    },
    recommendation: 'Specify the file formats available (e.g., CSV, JSON, Parquet).'
  },
  {
    id: 'acc-multiple-formats',
    name: 'Multiple Formats',
    description: 'Multiple data formats improve accessibility',
    category: 'description',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const formats = metadata.data_format || metadata.format;
      const multipleFormats = Array.isArray(formats) && formats.length >= 2;
      return {
        passed: multipleFormats,
        value: formats,
        message: multipleFormats
          ? `Multiple formats available (${formats.length})`
          : 'Single format available'
      };
    },
    recommendation: 'Provide data in multiple formats to support different use cases.'
  },
  {
    id: 'acc-open-format',
    name: 'Open Format Available',
    description: 'At least one open/standard format should be available',
    category: 'description',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const formats = metadata.data_format || metadata.format || [];
      const formatList = Array.isArray(formats) ? formats : [formats];
      const openFormats = ['csv', 'json', 'xml', 'parquet', 'geojson', 'txt', 'tsv', 'rdf'];
      const hasOpenFormat = formatList.some(f => 
        f && openFormats.some(of => f.toLowerCase().includes(of))
      );
      return {
        passed: hasOpenFormat,
        value: formatList,
        message: hasOpenFormat ? 'Open format available' : 'No open format detected'
      };
    },
    recommendation: 'Include open formats like CSV, JSON, or Parquet.'
  },
  {
    id: 'acc-file-size',
    name: 'File Size Documented',
    description: 'File size helps users plan downloads',
    category: 'description',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasSize = !!(metadata.file_size || metadata.size || metadata.byteSize);
      return {
        passed: hasSize,
        value: metadata.file_size || metadata.size || null,
        message: hasSize ? 'File size documented' : 'File size not documented'
      };
    },
    recommendation: 'Document file size for download planning.'
  },
  {
    id: 'acc-language',
    name: 'Language Specified',
    description: 'Language of dataset should be specified',
    category: 'description',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasLanguage = !!(metadata.language || metadata.lang);
      return {
        passed: hasLanguage,
        value: metadata.language || metadata.lang || null,
        message: hasLanguage ? `Language: ${metadata.language || metadata.lang}` : 'Language not specified'
      };
    },
    recommendation: 'Specify the language (e.g., "en" for English).'
  },
  {
    id: 'acc-documentation',
    name: 'Documentation Link',
    description: 'Link to documentation or data dictionary',
    category: 'description',
    severity: 'important',
    weight: 6,
    check: (metadata) => {
      const hasDoc = !!(metadata.documentation_url || metadata.documentation || 
                       metadata.data_dictionary || metadata.codebook);
      return {
        passed: hasDoc,
        value: metadata.documentation_url || metadata.documentation || null,
        message: hasDoc ? 'Documentation provided' : 'No documentation link'
      };
    },
    recommendation: 'Provide a link to documentation or data dictionary.'
  },
  {
    id: 'acc-record-count',
    name: 'Record Count',
    description: 'Number of records should be documented',
    category: 'description',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasCount = !!(metadata.record_count || metadata.row_count || metadata.num_records);
      return {
        passed: hasCount,
        value: metadata.record_count || metadata.row_count || null,
        message: hasCount ? `Records: ${metadata.record_count || metadata.row_count}` : 'Record count not documented'
      };
    },
    recommendation: 'Document the number of records in the dataset.'
  },
  {
    id: 'acc-api',
    name: 'API Access',
    description: 'Programmatic API access enhances accessibility',
    category: 'provenance',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasApi = !!(metadata.api_url || metadata.api_endpoint || metadata.api);
      return {
        passed: hasApi,
        value: metadata.api_url || null,
        message: hasApi ? 'API access available' : 'No API access documented'
      };
    },
    recommendation: 'Consider providing API access for programmatic use.'
  }
];
