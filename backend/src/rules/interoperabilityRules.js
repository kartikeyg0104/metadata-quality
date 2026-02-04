/**
 * Interoperability Rules - Standards compliance and integration checks
 * Maps to Description and Legal categories in UI
 */

export const interoperabilityRules = [
  {
    id: 'int-schema-defined',
    name: 'Schema Defined',
    description: 'Data schema or structure should be defined',
    category: 'description',
    severity: 'important',
    weight: 6,
    check: (metadata) => {
      const hasSchema = !!(metadata.schema || metadata.schema_url || metadata.columns || 
                          metadata.fields || metadata.structure || metadata.data_dictionary);
      return {
        passed: hasSchema,
        value: metadata.schema || metadata.columns || null,
        message: hasSchema ? 'Data schema defined' : 'No schema defined'
      };
    },
    recommendation: 'Document data structure for interoperability.'
  },
  {
    id: 'int-standard-vocab',
    name: 'Standard Vocabulary',
    description: 'Metadata should use standard vocabularies',
    category: 'description',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const json = JSON.stringify(metadata).toLowerCase();
      const vocabIndicators = ['@context', '@type', 'dcterms:', 'dcat:', 'schema:'];
      const usesVocab = vocabIndicators.some(v => json.includes(v.toLowerCase()));
      return {
        passed: usesVocab,
        message: usesVocab ? 'Uses standard vocabularies' : 'Standard vocabularies not detected'
      };
    },
    recommendation: 'Consider using Dublin Core, DCAT, or Schema.org vocabularies.'
  },
  {
    id: 'int-date-iso8601',
    name: 'ISO 8601 Dates',
    description: 'Dates should follow ISO 8601 format',
    category: 'provenance',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const dateFields = ['publication_date', 'created', 'modified', 'issued'];
      const iso8601Pattern = /^\d{4}(-\d{2}(-\d{2}(T\d{2}:\d{2})?)?)?$/;
      
      let validDates = 0, totalDates = 0;
      for (const field of dateFields) {
        if (metadata[field]) {
          totalDates++;
          if (iso8601Pattern.test(metadata[field])) validDates++;
        }
      }
      if (metadata.temporal_coverage) {
        if (metadata.temporal_coverage.start_date) {
          totalDates++;
          if (iso8601Pattern.test(metadata.temporal_coverage.start_date)) validDates++;
        }
        if (metadata.temporal_coverage.end_date) {
          totalDates++;
          if (iso8601Pattern.test(metadata.temporal_coverage.end_date)) validDates++;
        }
      }
      
      if (totalDates === 0) return { passed: true, message: 'No dates to validate' };
      const allValid = validDates === totalDates;
      return {
        passed: allValid,
        value: `${validDates}/${totalDates}`,
        message: allValid ? 'Dates follow ISO 8601' : `${validDates}/${totalDates} dates in ISO 8601`
      };
    },
    recommendation: 'Use ISO 8601 date format (YYYY-MM-DD).'
  },
  {
    id: 'int-persistent-id',
    name: 'Persistent Identifier',
    description: 'Identifier should be persistent (DOI, ARK, Handle)',
    category: 'identification',
    severity: 'important',
    weight: 6,
    check: (metadata) => {
      const id = metadata.identifier || metadata.doi || metadata.ark || metadata.handle;
      if (!id) return { passed: false, message: 'No identifier present' };
      
      const persistentPatterns = [
        /^10\.\d{4,}/, /^ark:/i, /^hdl:/i, /^urn:/i,
        /^https?:\/\/doi\.org/i, /^https?:\/\/hdl\.handle\.net/i
      ];
      const isPersistent = persistentPatterns.some(p => p.test(id));
      return {
        passed: isPersistent,
        value: id,
        message: isPersistent ? 'Uses persistent identifier' : 'Not a recognized persistent identifier'
      };
    },
    recommendation: 'Use DOI, ARK, or Handle for persistent identification.'
  },
  {
    id: 'int-machine-license',
    name: 'Machine-Readable License',
    description: 'License should be machine-readable (SPDX or URL)',
    category: 'legal',
    severity: 'warning',
    weight: 5,
    check: (metadata) => {
      const license = metadata.license;
      if (!license) return { passed: false, message: 'No license specified' };
      
      const spdxPattern = /^(CC(-BY|-NC|-SA|-ND)*-\d\.\d|MIT|Apache-\d\.\d|GPL-\d\.\d|BSD|CC0|PDDL|ODbL)/i;
      const urlPattern = /^https?:\/\//;
      const isMachineReadable = spdxPattern.test(license) || urlPattern.test(license);
      return {
        passed: isMachineReadable,
        value: license,
        message: isMachineReadable ? 'License is machine-readable' : 'Use SPDX identifier or license URL'
      };
    },
    recommendation: 'Use SPDX license identifier or provide license URL.'
  },
  {
    id: 'int-encoding',
    name: 'Encoding Specified',
    description: 'Character encoding should be specified',
    category: 'description',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasEncoding = !!(metadata.encoding || metadata.charset);
      return {
        passed: hasEncoding,
        value: metadata.encoding || metadata.charset || null,
        message: hasEncoding ? `Encoding: ${metadata.encoding || metadata.charset}` : 'Encoding not specified'
      };
    },
    recommendation: 'Specify character encoding (e.g., UTF-8).'
  },
  {
    id: 'int-related-resources',
    name: 'Related Resources',
    description: 'Related datasets/resources should be linked',
    category: 'provenance',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasRelated = !!(metadata.related_datasets || metadata.related || metadata.references ||
                           metadata.isPartOf || metadata.hasPart || metadata.source);
      return {
        passed: hasRelated,
        message: hasRelated ? 'Related resources linked' : 'No related resources documented'
      };
    },
    recommendation: 'Link related datasets or resources.'
  },
  {
    id: 'int-version-pattern',
    name: 'Version Pattern',
    description: 'Version should follow semantic or date-based pattern',
    category: 'identification',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const version = metadata.version;
      if (!version) return { passed: false, message: 'No version specified' };
      
      const semverPattern = /^\d+\.\d+(\.\d+)?$/;
      const datePattern = /^\d{4}(-\d{2})?(-\d{2})?$/;
      const hasPattern = semverPattern.test(version) || datePattern.test(version);
      return {
        passed: hasPattern,
        value: version,
        message: hasPattern ? `Version: ${version}` : 'Version lacks standard pattern'
      };
    },
    recommendation: 'Use semantic versioning (1.0.0) or date-based versioning.'
  },
  {
    id: 'int-spatial-crs',
    name: 'Spatial Reference',
    description: 'Spatial data should specify coordinate reference system',
    category: 'provenance',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const spatial = metadata.spatial_coverage || metadata.spatial;
      if (!spatial) return { passed: true, message: 'No spatial data' };
      
      const json = typeof spatial === 'string' ? spatial : JSON.stringify(spatial);
      const hasCRS = /WGS\s*84|EPSG:\d+|CRS|coordinates|bbox/i.test(json);
      return {
        passed: hasCRS,
        message: hasCRS ? 'Spatial reference documented' : 'Specify coordinate reference system'
      };
    },
    recommendation: 'Specify coordinate reference system (e.g., WGS84, EPSG code).'
  },
  {
    id: 'int-namespace',
    name: 'Identifier Namespace',
    description: 'Identifier should include organization namespace',
    category: 'identification',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const id = metadata.identifier || metadata.doi || metadata.id;
      if (!id) return { passed: false, message: 'No identifier' };
      
      const hasNamespace = /[:\/\-]/.test(id) || /^[A-Z]+\d+/.test(id);
      return {
        passed: hasNamespace,
        value: id,
        message: hasNamespace ? 'Has namespace prefix' : 'Consider adding organization prefix'
      };
    },
    recommendation: 'Add organization prefix to identifier for uniqueness.'
  }
];
