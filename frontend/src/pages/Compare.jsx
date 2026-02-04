import { useState, useEffect } from 'react';
import { getHistory, compareEvaluations } from '../services/api';

export default function Compare() {
  const [history, setHistory] = useState([]);
  const [id1, setId1] = useState('');
  const [id2, setId2] = useState('');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await getHistory({ limit: 50 });
      setHistory(data.evaluations);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCompare = async () => {
    if (!id1 || !id2) {
      setError('Please select two evaluations to compare');
      return;
    }
    if (id1 === id2) {
      setError('Please select different evaluations');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await compareEvaluations(id1, id2);
      setComparison(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatChange = (value) => {
    if (value > 0) return <span className="change-positive">+{value}</span>;
    if (value < 0) return <span className="change-negative">{value}</span>;
    return <span className="change-neutral">0</span>;
  };

  const getGradeClass = (grade) => {
    const classes = { A: 'excellent', B: 'good', C: 'acceptable', D: 'needs-work', F: 'poor' };
    return classes[grade] || '';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10b981';
    if (score >= 75) return '#22c55e';
    if (score >= 60) return '#f59e0b';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <main className="page-content compare-page">
      <div className="page-header">
        <div>
          <h2>⚖️ Compare Evaluations</h2>
          <p>Track improvements between evaluation versions</p>
        </div>
      </div>

      {/* Selection Card */}
      <div className="card compare-selector-card">
        <h3 className="card-title">📊 Select Evaluations</h3>
        <div className="compare-selectors">
          <div className="selector-box">
            <div className="selector-header">
              <span className="selector-icon">📋</span>
              <span className="selector-label">Before</span>
            </div>
            <select value={id1} onChange={(e) => setId1(e.target.value)} className="compare-select">
              <option value="">Select evaluation...</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>
                  {h.dataset_name} ({h.overall_score}) - {new Date(h.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          <div className="selector-vs">
            <span>VS</span>
          </div>

          <div className="selector-box">
            <div className="selector-header">
              <span className="selector-icon">📋</span>
              <span className="selector-label">After</span>
            </div>
            <select value={id2} onChange={(e) => setId2(e.target.value)} className="compare-select">
              <option value="">Select evaluation...</option>
              {history.map(h => (
                <option key={h.id} value={h.id}>
                  {h.dataset_name} ({h.overall_score}) - {new Date(h.created_at).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="compare-action">
          <button 
            className="btn btn-primary btn-compare" 
            onClick={handleCompare}
            disabled={loading || !id1 || !id2}
          >
            {loading ? (
              <><span className="spinner-small"></span> Comparing...</>
            ) : (
              <><span className="btn-icon">🔍</span> Compare Evaluations</>
            )}
          </button>
        </div>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {comparison && (
        <div className="comparison-results">
          {/* Score Comparison */}
          <div className="card score-comparison-card">
            <h3 className="card-title">📈 Score Comparison</h3>
            <div className="score-comparison-grid">
              <div className="score-card before">
                <div className="score-card-label">Before</div>
                <div 
                  className="score-card-value" 
                  style={{ color: getScoreColor(comparison.evaluation1.overall_score) }}
                >
                  {comparison.evaluation1.overall_score}
                </div>
                <span className={`grade-badge ${getGradeClass(comparison.evaluation1.grade?.grade)}`}>
                  Grade {comparison.evaluation1.grade?.grade}
                </span>
              </div>

              <div className="score-diff-display">
                <div className={`diff-arrow ${comparison.comparison.scoreImproved ? 'improved' : comparison.comparison.scoreDiff < 0 ? 'declined' : 'neutral'}`}>
                  {comparison.comparison.scoreImproved ? '↗' : comparison.comparison.scoreDiff < 0 ? '↘' : '→'}
                </div>
                <div className={`diff-value ${comparison.comparison.scoreImproved ? 'improved' : comparison.comparison.scoreDiff < 0 ? 'declined' : 'neutral'}`}>
                  {comparison.comparison.scoreDiff > 0 ? '+' : ''}{comparison.comparison.scoreDiff}
                </div>
                <div className="diff-label">points</div>
              </div>

              <div className="score-card after">
                <div className="score-card-label">After</div>
                <div 
                  className="score-card-value" 
                  style={{ color: getScoreColor(comparison.evaluation2.overall_score) }}
                >
                  {comparison.evaluation2.overall_score}
                </div>
                <span className={`grade-badge ${getGradeClass(comparison.evaluation2.grade?.grade)}`}>
                  Grade {comparison.evaluation2.grade?.grade}
                </span>
              </div>
            </div>
          </div>

          {/* Category Changes */}
          <div className="card category-changes-card">
            <h3 className="card-title">📂 Category Changes</h3>
            <div className="category-changes-list">
              {Object.entries(comparison.comparison.categoryDiffs).map(([cat, diff]) => (
                <div key={cat} className="category-change-item">
                  <div className="category-change-name">
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </div>
                  <div className="category-change-bars">
                    <div className="bar-container">
                      <div 
                        className="bar before" 
                        style={{ width: `${comparison.evaluation1.categories[cat] || 0}%` }}
                      />
                      <span className="bar-label">{comparison.evaluation1.categories[cat] || 0}%</span>
                    </div>
                    <div className="bar-container">
                      <div 
                        className="bar after" 
                        style={{ width: `${comparison.evaluation2.categories[cat] || 0}%` }}
                      />
                      <span className="bar-label">{comparison.evaluation2.categories[cat] || 0}%</span>
                    </div>
                  </div>
                  <div className={`category-change-diff ${diff > 0 ? 'positive' : diff < 0 ? 'negative' : ''}`}>
                    {formatChange(diff)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rule Changes */}
          {comparison.comparison.ruleChanges.length > 0 && (
            <div className="card rule-changes-card">
              <h3 className="card-title">✏️ Rule Changes ({comparison.comparison.ruleChanges.length})</h3>
              <div className="rule-changes-list">
                {comparison.comparison.ruleChanges.map((change, i) => (
                  <div key={i} className={`rule-change-item ${change.improvement ? 'improved' : 'regressed'}`}>
                    <div className="rule-change-icon">
                      {change.improvement ? '✅' : '❌'}
                    </div>
                    <div className="rule-change-info">
                      <span className="rule-change-name">{change.rule}</span>
                      <span className="rule-change-status">
                        {change.improvement ? 'Now passing' : 'Now failing'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations Comparison */}
          <div className="recommendations-grid">
            {comparison.comparison.recommendationsResolved.length > 0 && (
              <div className="card resolved-card">
                <h3 className="card-title resolved-title">
                  <span>✅</span> Resolved Issues
                  <span className="count-badge success">{comparison.comparison.recommendationsResolved.length}</span>
                </h3>
                <ul className="rec-list">
                  {comparison.comparison.recommendationsResolved.slice(0, 5).map((rec, i) => (
                    <li key={i} className="rec-item resolved">
                      <span className="rec-icon">✓</span>
                      <span className="rec-text">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {comparison.comparison.newRecommendations.length > 0 && (
              <div className="card new-issues-card">
                <h3 className="card-title new-issues-title">
                  <span>⚠️</span> New Issues
                  <span className="count-badge warning">{comparison.comparison.newRecommendations.length}</span>
                </h3>
                <ul className="rec-list">
                  {comparison.comparison.newRecommendations.slice(0, 5).map((rec, i) => (
                    <li key={i} className="rec-item new-issue">
                      <span className="rec-icon">!</span>
                      <span className="rec-text">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {!comparison && !loading && !error && (
        <div className="card compare-empty-state">
          <div className="empty-icon">⚖️</div>
          <h3>Select Two Evaluations</h3>
          <p>Choose evaluations from the dropdowns above to compare quality scores and see what changed.</p>
        </div>
      )}
    </main>
  );
}
