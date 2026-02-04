import { useState, useEffect } from 'react';
import { getRules, getRulesStatistics, getCategories } from '../services/api';

const CATEGORY_ICONS = {
  identification: '🏷️',
  description: '📝',
  legal: '⚖️',
  provenance: '📜',
  accessibility: '♿',
  interoperability: '🔗',
  citation: '📚',
  reusability: '♻️'
};

export default function Settings() {
  const [rules, setRules] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [rulesData, statsData, catData] = await Promise.all([
        getRules(),
        getRulesStatistics(),
        getCategories()
      ]);
      setRules(rulesData.rules || []);
      setStatistics(statsData);
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter(rule => {
    const matchesCategory = selectedCategory === 'all' || rule.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      rule.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rule.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getSeverityClass = (severity) => {
    const classes = { critical: 'critical', major: 'major', minor: 'minor' };
    return classes[severity] || '';
  };

  if (loading) {
    return (
      <main className="page-content">
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading rules...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="page-content settings-page">
      <div className="page-header">
        <div>
          <h2>⚙️ Rules & Configuration</h2>
          <p>View all quality rules and their weights</p>
        </div>
      </div>

      {/* Statistics Overview */}
      {statistics && (
        <div className="settings-stats">
          <div className="settings-stat-card">
            <div className="stat-icon-circle">📋</div>
            <div className="stat-info">
              <span className="stat-number">{statistics.totalRules}</span>
              <span className="stat-text">Total Rules</span>
            </div>
          </div>
          <div className="settings-stat-card">
            <div className="stat-icon-circle">📁</div>
            <div className="stat-info">
              <span className="stat-number">{statistics.categoryCount}</span>
              <span className="stat-text">Categories</span>
            </div>
          </div>
          <div className="settings-stat-card severity-critical">
            <div className="stat-icon-circle">🚨</div>
            <div className="stat-info">
              <span className="stat-number">{statistics.severityCounts?.critical || 0}</span>
              <span className="stat-text">Critical</span>
            </div>
          </div>
          <div className="settings-stat-card severity-major">
            <div className="stat-icon-circle">⚠️</div>
            <div className="stat-info">
              <span className="stat-number">{statistics.severityCounts?.major || 0}</span>
              <span className="stat-text">Major</span>
            </div>
          </div>
          <div className="settings-stat-card severity-minor">
            <div className="stat-icon-circle">ℹ️</div>
            <div className="stat-info">
              <span className="stat-number">{statistics.severityCounts?.minor || 0}</span>
              <span className="stat-text">Minor</span>
            </div>
          </div>
        </div>
      )}

      {/* Category Overview */}
      <div className="card categories-section">
        <h3 className="card-title">📂 Categories</h3>
        <div className="categories-grid">
          {Object.entries(categories).map(([key, config]) => (
            <div 
              key={key} 
              className={`category-card ${selectedCategory === key ? 'selected' : ''}`}
              onClick={() => setSelectedCategory(selectedCategory === key ? 'all' : key)}
            >
              <div className="category-card-header">
                <span className="category-icon">{CATEGORY_ICONS[key] || '📌'}</span>
                <span className="category-name" style={{ color: config.color }}>
                  {config.name}
                </span>
              </div>
              <div className="category-desc">{config.description}</div>
              <div className="category-footer">
                <div className="category-weight-bar">
                  <div 
                    className="category-weight-fill" 
                    style={{ width: `${config.weight * 100}%`, backgroundColor: config.color }}
                  />
                </div>
                <span className="category-weight-text">{Math.round(config.weight * 100)}%</span>
              </div>
              <div 
                className="category-accent" 
                style={{ backgroundColor: config.color }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Rules List */}
      <div className="card rules-section">
        <div className="rules-header">
          <h3 className="card-title">📜 Rules <span className="rules-count">{filteredRules.length}</span></h3>
          <div className="rules-filters">
            <div className="search-input-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search rules..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
              )}
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="category-select"
            >
              <option value="all">All Categories</option>
              {Object.entries(categories).map(([key, config]) => (
                <option key={key} value={key}>{config.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="rules-table-container">
          <table className="rules-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Rule</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map(rule => (
                <tr key={rule.id}>
                  <td>
                    <span className="rule-id">{rule.id}</span>
                  </td>
                  <td className="rule-info-cell">
                    <div className="rule-name">{rule.name}</div>
                    <div className="rule-desc">{rule.description}</div>
                  </td>
                  <td>
                    <span 
                      className="category-tag"
                      style={{ 
                        backgroundColor: categories[rule.category]?.color + '18',
                        color: categories[rule.category]?.color,
                        borderColor: categories[rule.category]?.color + '40'
                      }}
                    >
                      <span className="tag-icon">{CATEGORY_ICONS[rule.category] || '📌'}</span>
                      {rule.category}
                    </span>
                  </td>
                  <td>
                    <span className={`severity-badge ${getSeverityClass(rule.severity)}`}>
                      {rule.severity}
                    </span>
                  </td>
                  <td>
                    <span className="weight-badge">{rule.weight}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRules.length === 0 && (
          <div className="no-rules">
            <span className="no-rules-icon">🔍</span>
            <p>No rules found matching your criteria</p>
          </div>
        )}
      </div>

      {/* API Info */}
      <div className="card api-section">
        <h3 className="card-title">🔌 API Endpoints</h3>
        <p className="api-description">Use these endpoints to integrate with the Metadata Quality Platform</p>
        <div className="api-endpoints-grid">
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge post">POST</span>
              <code className="endpoint-path">/evaluate</code>
            </div>
            <p className="endpoint-desc">Evaluate metadata quality</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge post">POST</span>
              <code className="endpoint-path">/evaluate/save</code>
            </div>
            <p className="endpoint-desc">Evaluate and save to history</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge get">GET</span>
              <code className="endpoint-path">/history</code>
            </div>
            <p className="endpoint-desc">Get evaluation history</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge get">GET</span>
              <code className="endpoint-path">/analytics</code>
            </div>
            <p className="endpoint-desc">Get analytics data</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge post">POST</span>
              <code className="endpoint-path">/batch</code>
            </div>
            <p className="endpoint-desc">Batch evaluate multiple datasets</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge post">POST</span>
              <code className="endpoint-path">/report/pdf</code>
            </div>
            <p className="endpoint-desc">Generate PDF report</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge post">POST</span>
              <code className="endpoint-path">/import/url</code>
            </div>
            <p className="endpoint-desc">Import metadata from URL</p>
          </div>
          <div className="endpoint-card">
            <div className="endpoint-header">
              <span className="method-badge get">GET</span>
              <code className="endpoint-path">/rules</code>
            </div>
            <p className="endpoint-desc">Get all quality rules</p>
          </div>
        </div>
      </div>
    </main>
  );
}
