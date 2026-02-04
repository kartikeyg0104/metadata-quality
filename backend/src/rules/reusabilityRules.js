/**
 * Reusability Rules - Data reuse and reproducibility checks
 * Maps to Description and Legal categories in UI
 */

export const reusabilityRules = [
  {
    id: 'reu-license-reuse',
    name: 'License Allows Reuse',
    description: 'License should explicitly allow data reuse',
    category: 'legal',
    severity: 'important',
    weight: 6,
    check: (metadata) => {
      const license = metadata.license;
      if (!license) return { passed: false, message: 'No license specified' };
      
      const reuseAllowed = /^(CC(-BY|-0)|MIT|Apache|BSD|ODC|PDDL|ODbL|Public\s*Domain|Unlicense)/i;
      const canReuse = reuseAllowed.test(license);
      return {
        passed: canReuse,
        value: license,
        message: canReuse ? 'License allows reuse' : 'License may restrict reuse'
      };
    },
    recommendation: 'Use open licenses like CC-BY or CC0 for maximum reusability.'
  },
  {
    id: 'reu-methodology',
    name: 'Methodology Documented',
    description: 'Data collection methodology should be documented',
    category: 'description',
    severity: 'warning',
    weight: 5,
    check: (metadata) => {
      const methodology = metadata.methodology || metadata.methods || metadata.collection_method;
      const hasMethodology = methodology && methodology.length > 50;
      return {
        passed: hasMethodology,
        value: methodology ? methodology.substring(0, 100) : null,
        message: hasMethodology ? 'Methodology documented' : 'Methodology missing or incomplete'
      };
    },
    recommendation: 'Document data collection methodology for reproducibility.'
  },
  {
    id: 'reu-processing',
    name: 'Processing Steps',
    description: 'Data processing/cleaning steps should be documented',
    category: 'description',
    severity: 'suggestion',
    weight: 4,
    check: (metadata) => {
      const hasProcessing = !!(metadata.processing || metadata.processing_steps || 
                              metadata.data_processing || metadata.transformations);
      return {
        passed: hasProcessing,
        message: hasProcessing ? 'Processing steps documented' : 'Processing steps not documented'
      };
    },
    recommendation: 'Document any data processing or cleaning steps.'
  },
  {
    id: 'reu-quality-metrics',
    name: 'Quality Metrics',
    description: 'Data quality metrics should be included',
    category: 'description',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasQuality = !!(metadata.quality || metadata.accuracy || metadata.completeness ||
                           metadata.validation || metadata.quality_assessment);
      return {
        passed: hasQuality,
        message: hasQuality ? 'Quality metrics included' : 'No quality metrics'
      };
    },
    recommendation: 'Include data quality metrics or validation results.'
  },
  {
    id: 'reu-limitations',
    name: 'Limitations Documented',
    description: 'Known limitations should be documented',
    category: 'description',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const hasLimitations = !!(metadata.limitations || metadata.known_issues || metadata.caveats ||
                                (metadata.description && /limitation|caveat|issue/i.test(metadata.description)));
      return {
        passed: hasLimitations,
        message: hasLimitations ? 'Limitations documented' : 'Limitations not documented'
      };
    },
    recommendation: 'Document known limitations, caveats, or issues.'
  },
  {
    id: 'reu-sample-data',
    name: 'Sample Data',
    description: 'Sample data or preview should be available',
    category: 'description',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasSample = !!(metadata.sample || metadata.preview || metadata.example || metadata.sample_data);
      return {
        passed: hasSample,
        message: hasSample ? 'Sample data available' : 'No sample data'
      };
    },
    recommendation: 'Provide sample data or preview.'
  },
  {
    id: 'reu-update-frequency',
    name: 'Update Frequency',
    description: 'Update frequency should be specified',
    category: 'provenance',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasFrequency = !!(metadata.update_frequency || metadata.accrualPeriodicity || metadata.frequency);
      return {
        passed: hasFrequency,
        value: metadata.update_frequency || metadata.accrualPeriodicity || null,
        message: hasFrequency ? 'Update frequency specified' : 'Update frequency not specified'
      };
    },
    recommendation: 'Specify update frequency.'
  },
  {
    id: 'reu-intended-use',
    name: 'Intended Use',
    description: 'Intended use cases should be documented',
    category: 'description',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasUse = !!(metadata.intended_use || metadata.use_cases || metadata.purpose ||
                       (metadata.description && /intended|purpose|use case/i.test(metadata.description)));
      return {
        passed: hasUse,
        message: hasUse ? 'Intended use documented' : 'Intended use not documented'
      };
    },
    recommendation: 'Document intended use cases.'
  },
  {
    id: 'reu-variables',
    name: 'Variable Definitions',
    description: 'Variable/column definitions should be provided',
    category: 'description',
    severity: 'important',
    weight: 5,
    check: (metadata) => {
      const hasDefs = !!(metadata.variables || metadata.columns || metadata.fields ||
                        metadata.data_dictionary || metadata.schema || metadata.codebook);
      return {
        passed: hasDefs,
        message: hasDefs ? 'Variable definitions provided' : 'No variable definitions'
      };
    },
    recommendation: 'Provide definitions for all variables/columns.'
  },
  {
    id: 'reu-units',
    name: 'Units Specified',
    description: 'Units of measurement should be specified',
    category: 'description',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasUnits = !!(metadata.units || metadata.measurement_units ||
                         (metadata.variables && JSON.stringify(metadata.variables).includes('unit')));
      return {
        passed: hasUnits,
        message: hasUnits ? 'Units specified' : 'Units not specified'
      };
    },
    recommendation: 'Specify units of measurement for numeric data.'
  }
];
