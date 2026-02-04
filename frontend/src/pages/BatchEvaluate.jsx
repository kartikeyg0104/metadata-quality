import { useState } from 'react';
import { batchEvaluate, startBatchJob, getBatchStatus } from '../services/api';

export default function BatchEvaluate() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);

  const handleBatchEvaluate = async (useAsync = false) => {
    setError(null);
    setResults(null);
    setSummary(null);
    setJobId(null);
    setJobStatus(null);

    try {
      const records = JSON.parse(input);
      if (!Array.isArray(records)) {
        throw new Error('Input must be a JSON array of metadata objects');
      }
      if (records.length === 0) {
        throw new Error('Array is empty');
      }
      if (records.length > 100) {
        throw new Error('Maximum 100 records for sync evaluation. Use async for larger batches.');
      }

      setLoading(true);

      if (useAsync) {
        const response = await startBatchJob(records, { saveToHistory: true });
        setJobId(response.job_id);
        pollJobStatus(response.job_id);
      } else {
        const response = await batchEvaluate(records);
        setResults(response.results);
        setSummary(response.summary);
        setLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const pollJobStatus = async (id) => {
    try {
      const status = await getBatchStatus(id);
      setJobStatus(status);

      if (status.status === 'completed') {
        setResults(status.results);
        setLoading(false);
      } else if (status.status === 'failed') {
        setError('Batch job failed');
        setLoading(false);
      } else {
        setTimeout(() => pollJobStatus(id), 1000);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const loadSampleData = () => {
    const sample = [
      {
        title: "Climate Temperature Records 2020-2023",
        description: "Global temperature measurements from weather stations",
        authors: ["Climate Research Institute"],
        license: "CC-BY-4.0",
        keywords: ["climate", "temperature", "weather"]
      },
      {
        title: "Urban Traffic Flow Data",
        description: "Vehicle counts and traffic patterns in major cities",
        authors: ["Transportation Dept"],
        license: "ODbL-1.0"
      },
      {
        title: "Bird Migration Patterns",
        description: "GPS tracking data for migratory birds across continents",
        authors: ["Wildlife Conservation Society"],
        license: "CC0-1.0",
        keywords: ["birds", "migration", "GPS", "wildlife"]
      }
    ];
    setInput(JSON.stringify(sample, null, 2));
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

  const recordCount = () => {
    try {
      const parsed = JSON.parse(input);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  return (
    <main className="page-content batch-page">
      <div className="page-header">
        <div>
          <h2>📦 Batch Evaluation</h2>
          <p>Evaluate multiple metadata records at once</p>
        </div>
      </div>

      <div className="batch-layout">
        {/* Input Section */}
        <div className="batch-input-section">
          <div className="card batch-input-card">
            <div className="batch-input-header">
              <h3 className="card-title">📝 Input (JSON Array)</h3>
              <button className="btn btn-secondary btn-small" onClick={loadSampleData}>
                <span>📋</span> Load Sample
              </button>
            </div>
            
            <div className="textarea-wrapper">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder='[\n  {"title": "Dataset 1", "description": "...", ...},\n  {"title": "Dataset 2", "description": "...", ...}\n]'
                className="batch-textarea"
              />
              {input && (
                <div className="textarea-info">
                  <span className="record-count">
                    {recordCount()} records detected
                  </span>
                </div>
              )}
            </div>

            <div className="batch-actions">
              <button 
                className="btn btn-primary batch-btn" 
                onClick={() => handleBatchEvaluate(false)}
                disabled={loading || !input.trim()}
              >
                {loading ? (
                  <><span className="spinner-small"></span> Processing...</>
                ) : (
                  <><span className="btn-icon">⚡</span> Evaluate (Sync)</>
                )}
              </button>
              <button 
                className="btn btn-secondary batch-btn" 
                onClick={() => handleBatchEvaluate(true)}
                disabled={loading || !input.trim()}
              >
                <span className="btn-icon">💾</span> Evaluate & Save
              </button>
            </div>

            <div className="batch-tips">
              <div className="tip-item">💡 JSON array with up to 100 metadata objects</div>
              <div className="tip-item">💡 "Save" option stores results in history</div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="batch-results-section">
          {error && <div className="error-message">⚠️ {error}</div>}

          {loading && (
            <div className="card batch-loading-card">
              <div className="batch-loading">
                <div className="spinner-large"></div>
                <div className="loading-text">
                  {jobStatus 
                    ? `Processing ${jobStatus.completed_items}/${jobStatus.total_items}...`
                    : 'Evaluating batch...'}
                </div>
                {jobStatus && (
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${(jobStatus.completed_items / jobStatus.total_items) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {summary && (
            <div className="card batch-summary-card">
              <h3 className="card-title">📊 Summary</h3>
              <div className="batch-summary-grid">
                <div className="summary-stat">
                  <div className="summary-stat-icon">📝</div>
                  <div className="summary-stat-value">{summary.total_evaluated}</div>
                  <div className="summary-stat-label">Evaluated</div>
                </div>
                <div className="summary-stat highlight">
                  <div className="summary-stat-icon">⭐</div>
                  <div className="summary-stat-value" style={{ color: getScoreColor(summary.average_score) }}>
                    {summary.average_score}
                  </div>
                  <div className="summary-stat-label">Avg Score</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-icon">📉</div>
                  <div className="summary-stat-value">{summary.min_score}</div>
                  <div className="summary-stat-label">Minimum</div>
                </div>
                <div className="summary-stat">
                  <div className="summary-stat-icon">📈</div>
                  <div className="summary-stat-value">{summary.max_score}</div>
                  <div className="summary-stat-label">Maximum</div>
                </div>
              </div>
              {summary.grade_distribution && (
                <div className="grade-distribution">
                  <h4>Grade Distribution</h4>
                  <div className="grade-badges">
                    {Object.entries(summary.grade_distribution).map(([grade, count]) => (
                      <div key={grade} className={`grade-dist-item ${getGradeClass(grade)}`}>
                        <span className="grade-letter">{grade}</span>
                        <span className="grade-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {results && results.length > 0 && (
            <div className="card batch-results-card">
              <h3 className="card-title">📋 Results ({results.length})</h3>
              <div className="results-table-container">
                <table className="batch-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Title</th>
                      <th>Score</th>
                      <th>Grade</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => {
                      const score = r.result?.overall_score ?? r.overall_score;
                      const grade = r.result?.grade?.grade || r.grade?.grade;
                      const title = r.result?.metadata?.title || r.error || 'N/A';
                      const isError = r.success === false;
                      
                      return (
                        <tr key={i} className={isError ? 'error-row' : ''}>
                          <td className="row-number">{r.index !== undefined ? r.index + 1 : i + 1}</td>
                          <td className="row-title">
                            <span className="title-text">{title}</span>
                          </td>
                          <td className="row-score">
                            {score !== undefined && score !== null ? (
                              <span className="score-value" style={{ color: getScoreColor(score) }}>
                                {score}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="row-grade">
                            {grade ? (
                              <span className={`grade-badge ${getGradeClass(grade)}`}>
                                {grade}
                              </span>
                            ) : isError ? (
                              <span className="error-badge">Error</span>
                            ) : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!results && !loading && !error && (
            <div className="card batch-empty-state">
              <div className="empty-icon">📦</div>
              <h3>Ready to Evaluate</h3>
              <p>Paste a JSON array of metadata objects on the left and click Evaluate to see results.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
