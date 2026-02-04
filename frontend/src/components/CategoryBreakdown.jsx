/**
 * CategoryBreakdown Component
 * Displays score breakdown by category with visual bars
 */
export default function CategoryBreakdown({ categories }) {
  if (!categories) return null;

  // Category display names and icons
  const categoryInfo = {
    identification: { name: 'Identification', icon: '🏷️' },
    description: { name: 'Description', icon: '📝' },
    legal: { name: 'Legal', icon: '⚖️' },
    provenance: { name: 'Provenance', icon: '📍' }
  };

  // Get color based on score
  const getBarColor = (score) => {
    if (score >= 90) return 'var(--color-excellent)';
    if (score >= 80) return 'var(--color-good)';
    if (score >= 70) return 'var(--color-acceptable)';
    if (score >= 60) return 'var(--color-needs-improvement)';
    return 'var(--color-poor)';
  };

  // Get text color class
  const getScoreClass = (score) => {
    if (score >= 90) return 'text-excellent';
    if (score >= 80) return 'text-good';
    if (score >= 70) return 'text-acceptable';
    if (score >= 60) return 'text-needs-improvement';
    return 'text-poor';
  };

  // Order categories
  const orderedCategories = ['identification', 'description', 'legal', 'provenance'];

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">📈</span>
        Category Breakdown
      </h2>
      
      <div className="category-list">
        {orderedCategories.map(key => {
          const score = categories[key] ?? 0;
          const info = categoryInfo[key] || { name: key, icon: '📋' };
          
          return (
            <div key={key} className="category-item">
              <div className="category-name">
                <span style={{ marginRight: '0.5rem' }}>{info.icon}</span>
                {info.name}
              </div>
              <div className="category-bar-container">
                <div 
                  className="category-bar"
                  style={{ 
                    width: `${score}%`,
                    backgroundColor: getBarColor(score)
                  }}
                />
              </div>
              <div className={`category-score ${getScoreClass(score)}`}>
                {score}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Explanations */}
      <div style={{ 
        marginTop: '1.5rem', 
        padding: '1rem', 
        background: 'var(--color-bg)', 
        borderRadius: '8px',
        fontSize: '0.8rem',
        color: 'var(--color-text-secondary)'
      }}>
        <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>What each category measures:</div>
        <ul style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <li><strong>Identification:</strong> Title, authors, publisher, version, DOI</li>
          <li><strong>Description:</strong> Description quality, keywords, methodology</li>
          <li><strong>Legal:</strong> License validity, openness, contact information</li>
          <li><strong>Provenance:</strong> Dates, temporal/spatial coverage, funding, access</li>
        </ul>
      </div>
    </div>
  );
}
