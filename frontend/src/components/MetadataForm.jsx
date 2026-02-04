import { useState } from 'react';

/**
 * Sample metadata for quick testing
 */
const SAMPLE_METADATA = {
  good: {
    title: "Global Surface Temperature Anomalies Dataset (1880-2023)",
    description: "This comprehensive dataset contains monthly global surface temperature anomaly records from 1880 to 2023, compiled from over 26,000 weather stations worldwide. The dataset provides temperature deviations from the 1951-1980 baseline period, enabling researchers to track long-term climate trends and patterns.",
    authors: "Dr. Sarah Chen, Prof. Michael Torres",
    keywords: "climate change, temperature anomaly, global warming, surface temperature, historical climate data, NOAA, meteorological data",
    license: "CC-BY-4.0",
    publisher: "Global Climate Research Institute",
    publication_date: "2024-01-15",
    version: "4.2.1",
    methodology: "Temperature anomalies are calculated relative to the 1951-1980 climatological baseline. Station data undergoes homogenization to account for station relocations, instrument changes, and time-of-observation biases.",
    funding: "National Science Foundation Grant #AGS-2012345"
  },
  minimal: {
    title: "Test Dataset",
    description: "A dataset for testing.",
    authors: "",
    keywords: "",
    license: "",
    publisher: "",
    publication_date: "",
    version: "",
    methodology: "",
    funding: ""
  }
};

/**
 * MetadataForm Component
 * Form for inputting dataset metadata for quality evaluation
 */
export default function MetadataForm({ onEvaluate, isLoading }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    authors: '',
    keywords: '',
    license: '',
    publisher: '',
    publication_date: '',
    version: '',
    methodology: '',
    funding: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert form data to the expected metadata structure
    const metadata = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      authors: formData.authors ? formData.authors.split(',').map(a => a.trim()).filter(Boolean) : [],
      keywords: formData.keywords ? formData.keywords.split(',').map(k => k.trim()).filter(Boolean) : [],
      license: formData.license.trim() || undefined,
      publisher: formData.publisher.trim() || undefined,
      publication_date: formData.publication_date || undefined,
      version: formData.version.trim() || undefined,
      methodology: formData.methodology.trim() || undefined,
      funding: formData.funding.trim() || undefined
    };

    onEvaluate(metadata);
  };

  const handleLoadSample = (type) => {
    setFormData(SAMPLE_METADATA[type]);
  };

  const handleClear = () => {
    setFormData({
      title: '',
      description: '',
      authors: '',
      keywords: '',
      license: '',
      publisher: '',
      publication_date: '',
      version: '',
      methodology: '',
      funding: ''
    });
  };

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">📝</span>
        Metadata Input
      </h2>
      
      <form className="metadata-form" onSubmit={handleSubmit}>
        {/* Title */}
        <div className="form-group">
          <label htmlFor="title">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="Enter dataset title"
            required
          />
        </div>

        {/* Description */}
        <div className="form-group">
          <label htmlFor="description">Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Detailed description of the dataset content, scope, and purpose"
            rows={4}
            required
          />
          <span className="hint">{formData.description.length} characters (100+ recommended)</span>
        </div>

        {/* Authors & Publisher */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="authors">Authors</label>
            <input
              type="text"
              id="authors"
              name="authors"
              value={formData.authors}
              onChange={handleChange}
              placeholder="Jane Doe, John Smith"
            />
            <span className="hint">Comma-separated</span>
          </div>
          <div className="form-group">
            <label htmlFor="publisher">Publisher</label>
            <input
              type="text"
              id="publisher"
              name="publisher"
              value={formData.publisher}
              onChange={handleChange}
              placeholder="Organization name"
            />
          </div>
        </div>

        {/* Keywords */}
        <div className="form-group">
          <label htmlFor="keywords">Keywords</label>
          <input
            type="text"
            id="keywords"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            placeholder="climate, data, research"
          />
          <span className="hint">Comma-separated (3+ recommended)</span>
        </div>

        {/* License & Date */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="license">License</label>
            <input
              type="text"
              id="license"
              name="license"
              value={formData.license}
              onChange={handleChange}
              placeholder="CC-BY-4.0"
            />
            <span className="hint">SPDX identifier recommended</span>
          </div>
          <div className="form-group">
            <label htmlFor="publication_date">Publication Date</label>
            <input
              type="date"
              id="publication_date"
              name="publication_date"
              value={formData.publication_date}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Version */}
        <div className="form-group">
          <label htmlFor="version">Version</label>
          <input
            type="text"
            id="version"
            name="version"
            value={formData.version}
            onChange={handleChange}
            placeholder="1.0.0"
          />
        </div>

        {/* Methodology */}
        <div className="form-group">
          <label htmlFor="methodology">Methodology</label>
          <textarea
            id="methodology"
            name="methodology"
            value={formData.methodology}
            onChange={handleChange}
            placeholder="Describe data collection and processing methods"
            rows={3}
          />
        </div>

        {/* Funding */}
        <div className="form-group">
          <label htmlFor="funding">Funding</label>
          <input
            type="text"
            id="funding"
            name="funding"
            value={formData.funding}
            onChange={handleChange}
            placeholder="Grant ABC-123"
          />
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner"></span>
                Evaluating...
              </>
            ) : (
              <>Evaluate Metadata</>
            )}
          </button>
          <button type="button" className="btn btn-secondary" onClick={handleClear}>
            Clear
          </button>
        </div>

        {/* Sample Data */}
        <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
          Load sample: 
          <button 
            type="button" 
            onClick={() => handleLoadSample('good')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)', 
              cursor: 'pointer',
              textDecoration: 'underline',
              marginLeft: '0.5rem'
            }}
          >
            Good metadata
          </button>
          <span style={{ margin: '0 0.25rem' }}>|</span>
          <button 
            type="button" 
            onClick={() => handleLoadSample('minimal')}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'var(--color-primary)', 
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Minimal metadata
          </button>
        </div>
      </form>
    </div>
  );
}
