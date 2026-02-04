/**
 * Citation Rules - Proper citation and attribution checks
 * Maps to Identification and Provenance categories in UI
 */

export const citationRules = [
  {
    id: 'cit-doi-present',
    name: 'DOI Present',
    description: 'Dataset should have a DOI for citation',
    category: 'identification',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const doi = metadata.doi || metadata.identifier;
      const hasDoi = doi && /^10\.\d{4,}/.test(doi.replace(/^https?:\/\/doi\.org\//, ''));
      return {
        passed: hasDoi,
        value: doi || null,
        message: hasDoi ? 'Dataset has a DOI' : 'No DOI for citation'
      };
    },
    recommendation: 'Register a DOI for proper dataset citation.'
  },
  {
    id: 'cit-citation-text',
    name: 'Citation Text',
    description: 'Preferred citation text should be provided',
    category: 'identification',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasCitation = !!(metadata.citation || metadata.cite_as || metadata.suggested_citation);
      return {
        passed: hasCitation,
        value: metadata.citation || null,
        message: hasCitation ? 'Citation format provided' : 'No suggested citation format'
      };
    },
    recommendation: 'Provide a suggested citation format for users.'
  },
  {
    id: 'cit-author-orcid',
    name: 'Author Identifiers',
    description: 'Authors should have ORCID or persistent identifiers',
    category: 'identification',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const authors = metadata.authors || metadata.creator || metadata.contributors || [];
      if (!Array.isArray(authors) || authors.length === 0) {
        return { passed: false, message: 'No authors specified' };
      }
      
      const hasIdentifiers = authors.some(author => {
        if (typeof author === 'string') return /orcid/i.test(author);
        return author.orcid || author.identifier || author.ORCID;
      });
      return {
        passed: hasIdentifiers,
        message: hasIdentifiers ? 'Author identifiers present' : 'No author ORCIDs'
      };
    },
    recommendation: 'Add ORCID for authors.'
  },
  {
    id: 'cit-pub-date',
    name: 'Publication Date for Citation',
    description: 'Publication date is required for citation',
    category: 'provenance',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const hasDate = !!(metadata.publication_date || metadata.issued || metadata.datePublished ||
                        metadata.created || metadata.date);
      return {
        passed: hasDate,
        value: metadata.publication_date || metadata.issued || null,
        message: hasDate ? 'Publication date present' : 'Publication date missing'
      };
    },
    recommendation: 'Publication date is required for proper citation.'
  },
  {
    id: 'cit-publisher',
    name: 'Publisher for Citation',
    description: 'Publisher/repository should be identified',
    category: 'identification',
    severity: 'warning',
    weight: 4,
    check: (metadata) => {
      const hasPublisher = !!(metadata.publisher || metadata.repository || metadata.organization);
      return {
        passed: hasPublisher,
        value: metadata.publisher || metadata.repository || null,
        message: hasPublisher ? 'Publisher identified' : 'Publisher not specified'
      };
    },
    recommendation: 'Identify the publisher or hosting repository.'
  },
  {
    id: 'cit-version',
    name: 'Citable Version',
    description: 'Version should be specified for precise citation',
    category: 'identification',
    severity: 'warning',
    weight: 3,
    check: (metadata) => {
      const hasVersion = !!metadata.version;
      return {
        passed: hasVersion,
        value: metadata.version || null,
        message: hasVersion ? 'Version can be cited' : 'Version not specified'
      };
    },
    recommendation: 'Add version for reproducible citations.'
  },
  {
    id: 'cit-funding',
    name: 'Funding for Citation',
    description: 'Funding sources should be acknowledged',
    category: 'provenance',
    severity: 'suggestion',
    weight: 2,
    check: (metadata) => {
      const hasFunding = !!(metadata.funding || metadata.funder || metadata.grant || metadata.sponsor);
      return {
        passed: hasFunding,
        value: metadata.funding || null,
        message: hasFunding ? 'Funding acknowledged' : 'No funding information'
      };
    },
    recommendation: 'Acknowledge funding sources if applicable.'
  },
  {
    id: 'cit-publications',
    name: 'Related Publications',
    description: 'Related publications should be referenced',
    category: 'provenance',
    severity: 'suggestion',
    weight: 3,
    check: (metadata) => {
      const hasPubs = !!(metadata.related_publications || metadata.publications ||
                        metadata.isReferencedBy || metadata.papers);
      return {
        passed: hasPubs,
        message: hasPubs ? 'Related publications linked' : 'No related publications'
      };
    },
    recommendation: 'Link related publications that use this dataset.'
  }
];
