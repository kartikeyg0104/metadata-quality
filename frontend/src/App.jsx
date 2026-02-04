import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import MetadataForm from './components/MetadataForm';
import ScoreSummary from './components/ScoreSummary';
import CategoryBreakdown from './components/CategoryBreakdown';
import Recommendations from './components/Recommendations';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import BatchEvaluate from './pages/BatchEvaluate';
import Compare from './pages/Compare';
import Settings from './pages/Settings';
import { evaluateMetadata, evaluateAndSave } from './services/api';

/**
 * Home Page - Metadata Evaluation
 */
function HomePage() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedId, setSavedId] = useState(null);

  const handleEvaluate = async (metadata, saveToHistory = false) => {
    setIsLoading(true);
    setError(null);
    setSavedId(null);
    
    try {
      let evaluationResult;
      if (saveToHistory) {
        evaluationResult = await evaluateAndSave(metadata);
        setSavedId(evaluationResult.evaluation_id);
      } else {
        evaluationResult = await evaluateMetadata(metadata);
      }
      setResult(evaluationResult);
    } catch (err) {
      setError(err.message || 'Failed to evaluate metadata.');
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="main-content">
      <div>
        <MetadataForm onEvaluate={handleEvaluate} isLoading={isLoading} />
        
        <div className="card quick-tips" style={{ marginTop: '1.5rem' }}>
          <h2 className="card-title">
            <span className="icon">💡</span>
            Quick Tips
          </h2>
          <div className="tips-list">
            <div className="tip-item">Write descriptions with at least 100 characters</div>
            <div className="tip-item">Use SPDX license identifiers (e.g., CC-BY-4.0)</div>
            <div className="tip-item">Include at least 3 specific keywords</div>
            <div className="tip-item">Add methodology to explain data collection</div>
          </div>
        </div>
      </div>

      <div className="results-section">
        {error && (
          <div className="error-message">
            <strong>Error:</strong> {error}
          </div>
        )}

        {isLoading && (
          <div className="card">
            <div className="loading">
              <div className="spinner"></div>
              <span>Evaluating metadata quality...</span>
            </div>
          </div>
        )}

        {!result && !isLoading && !error && (
          <div className="card">
            <div className="empty-state">
              <div className="icon">📋</div>
              <h3>No Evaluation Yet</h3>
              <p>Enter your dataset metadata and click "Evaluate" to see the quality assessment.</p>
            </div>
          </div>
        )}

        {result && !isLoading && (
          <>
            {savedId && (
              <div className="success-banner">
                ✓ Saved to history (ID: {savedId.slice(0, 8)}...)
              </div>
            )}
            <ScoreSummary result={result} />
            <CategoryBreakdown categories={result.categories} />
            <Recommendations 
              recommendations={result.recommendations} 
              topImprovements={result.top_improvements}
            />
          </>
        )}
      </div>
    </main>
  );
}

/**
 * Background Decoration Component for Premium Glassmorphism Effect
 */
function BackgroundDecoration() {
  return (
    <div className="bg-decoration" aria-hidden="true">
      <div className="bg-shape bg-shape-1"></div>
      <div className="bg-shape bg-shape-2"></div>
      <div className="bg-shape bg-shape-3"></div>
      <div className="bg-shape bg-shape-4"></div>
      <div className="bg-shape bg-shape-5"></div>
      <div className="bg-shape bg-shape-6"></div>
    </div>
  );
}

/**
 * Main App with Navigation
 */
export default function App() {
  return (
    <Router>
      <BackgroundDecoration />
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div className="header-title">
              <h1>Metadata Quality Platform</h1>
              <p>Evaluate dataset metadata against quality standards</p>
            </div>
            <nav className="main-nav">
              <NavLink to="/" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">📊</span>
                Evaluate
              </NavLink>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">📈</span>
                Dashboard
              </NavLink>
              <NavLink to="/history" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">📜</span>
                History
              </NavLink>
              <NavLink to="/batch" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">📦</span>
                Batch
              </NavLink>
              <NavLink to="/compare" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">⚖️</span>
                Compare
              </NavLink>
              <NavLink to="/settings" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
                <span className="nav-icon">⚙️</span>
                Settings
              </NavLink>
            </nav>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/batch" element={<BatchEvaluate />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>

        <footer className="footer">
          <div className="footer-content">
            <div className="footer-stats">
              <div className="footer-stat">
                <span className="footer-stat-value">71</span>
                <span className="footer-stat-label">Quality Rules</span>
              </div>
              <div className="footer-stat">
                <span className="footer-stat-value">8</span>
                <span className="footer-stat-label">Categories</span>
              </div>
              <div className="footer-stat">
                <span className="footer-stat-value">v2.0</span>
                <span className="footer-stat-label">Version</span>
              </div>
            </div>
            <p>
              <span className="footer-brand">Metadata Quality Platform</span> - Ensuring excellence in dataset documentation
            </p>
          </div>
        </footer>
      </div>
    </Router>
  );
}
