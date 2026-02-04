/**
 * Recommendations Component
 * Displays prioritized recommendations for improving metadata quality
 */
export default function Recommendations({ recommendations, topImprovements }) {
  // Combine and prioritize recommendations
  const items = [];
  
  // Add top improvements if available
  if (topImprovements && topImprovements.length > 0) {
    topImprovements.forEach((item, index) => {
      items.push({
        id: `improvement-${index}`,
        text: item.recommendation,
        severity: item.severity || 'suggestion',
        weight: item.weight || 0
      });
    });
  }
  
  // If no detailed improvements, use simple recommendations
  if (items.length === 0 && recommendations && recommendations.length > 0) {
    recommendations.forEach((text, index) => {
      items.push({
        id: `rec-${index}`,
        text,
        severity: index < 2 ? 'important' : 'suggestion',
        weight: 10 - index
      });
    });
  }

  // Get priority class
  const getPriorityClass = (severity) => {
    switch (severity) {
      case 'critical': return 'priority-critical';
      case 'important': return 'priority-important';
      case 'warning': return 'priority-warning';
      default: return 'priority-suggestion';
    }
  };

  // Get priority label
  const getPriorityLabel = (severity) => {
    switch (severity) {
      case 'critical': return '!';
      case 'important': return '!!';
      case 'warning': return '!';
      default: return '?';
    }
  };

  // No recommendations needed
  if (items.length === 0) {
    return (
      <div className="card">
        <h2 className="card-title">
          <span className="icon">💡</span>
          Recommendations
        </h2>
        <div className="empty-state" style={{ padding: '2rem' }}>
          <div className="icon">🎉</div>
          <h3>Excellent!</h3>
          <p>No critical improvements needed. Your metadata quality is great!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">💡</span>
        Priority Recommendations
      </h2>
      
      <div className="recommendations-list">
        {items.slice(0, 8).map((item, index) => (
          <div key={item.id} className="recommendation-item">
            <div className={`recommendation-priority ${getPriorityClass(item.severity)}`}>
              {index + 1}
            </div>
            <div className="recommendation-content">
              <p className="recommendation-text">{item.text}</p>
              {item.weight > 0 && (
                <span style={{ 
                  fontSize: '0.75rem', 
                  color: 'var(--color-text-secondary)',
                  display: 'inline-block',
                  marginTop: '0.25rem'
                }}>
                  Potential impact: +{item.weight} points
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ 
        marginTop: '1rem', 
        paddingTop: '1rem', 
        borderTop: '1px solid var(--color-border)',
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.75rem',
        color: 'var(--color-text-secondary)'
      }}>
        <span><span className="priority-critical" style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', marginRight: '0.25rem' }}>!</span> Critical</span>
        <span><span className="priority-important" style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', marginRight: '0.25rem' }}>!!</span> Important</span>
        <span><span className="priority-warning" style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', marginRight: '0.25rem' }}>!</span> Warning</span>
        <span><span className="priority-suggestion" style={{ padding: '0.125rem 0.375rem', borderRadius: '4px', marginRight: '0.25rem' }}>?</span> Suggestion</span>
      </div>
    </div>
  );
}
