/**
 * ScoreSummary Component
 * Displays the overall quality score with grade and summary statistics
 */
export default function ScoreSummary({ result }) {
  if (!result) return null;

  const { overall_score, grade, summary } = result;
  
  // Get color based on score
  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--color-excellent)';
    if (score >= 80) return 'var(--color-good)';
    if (score >= 70) return 'var(--color-acceptable)';
    if (score >= 60) return 'var(--color-needs-improvement)';
    return 'var(--color-poor)';
  };

  const scoreColor = getScoreColor(overall_score);

  return (
    <div className="card">
      <h2 className="card-title">
        <span className="icon">📊</span>
        Quality Score
      </h2>
      
      <div className="score-summary">
        {/* Score Circle */}
        <div 
          className="score-circle" 
          style={{ 
            color: scoreColor,
            '--rotation': `${(overall_score / 100) * 270 - 45}deg`
          }}
        >
          <span className="score-value" style={{ color: scoreColor }}>
            {overall_score}
          </span>
          <span className="score-label">out of 100</span>
        </div>

        {/* Grade Badge */}
        <div 
          className="grade-badge" 
          style={{ 
            backgroundColor: `${scoreColor}15`,
            color: scoreColor
          }}
        >
          <span className="grade-letter">{grade.letter}</span>
          <span>{grade.label}</span>
        </div>

        {/* Description */}
        <p className="score-description">{grade.description}</p>

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{summary.total_rules}</div>
            <div className="stat-label">Rules Evaluated</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--color-success)' }}>
              {summary.passed}
            </div>
            <div className="stat-label">Passed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
              {summary.failed}
            </div>
            <div className="stat-label">Failed</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{summary.pass_rate}%</div>
            <div className="stat-label">Pass Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
}
