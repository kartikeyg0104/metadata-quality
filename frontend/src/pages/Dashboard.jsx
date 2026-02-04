import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, Area, AreaChart
} from 'recharts';
import { getAnalytics, getRulesStatistics } from '../services/api';

const GRADE_COLORS = {
  'A': '#10b981',
  'B': '#22c55e', 
  'C': '#eab308',
  'D': '#f97316',
  'F': '#ef4444'
};

const CATEGORY_COLORS = {
  identification: '#6366f1',
  description: '#8b5cf6',
  legal: '#10b981',
  provenance: '#f59e0b',
  accessibility: '#06b6d4',
  interoperability: '#ec4899',
  citation: '#84cc16',
  reusability: '#f43f5e'
};

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="tooltip-label">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="tooltip-value" style={{ color: entry.color }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [rulesStats, setRulesStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [analyticsData, statsData] = await Promise.all([
        getAnalytics(days),
        getRulesStatistics()
      ]);
      setAnalytics(analyticsData);
      setRulesStats(statsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <main className="page-content">
        <div className="loading">
          <div className="spinner"></div>
          <span>Loading analytics...</span>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="page-content">
        <div className="error-message">Error: {error}</div>
      </main>
    );
  }

  const gradeData = analytics?.gradeDistribution?.map(g => ({
    name: g.grade,
    value: g.count,
    fill: GRADE_COLORS[g.grade] || '#6b7280'
  })) || [];

  const categoryData = analytics?.categoryAverages ? 
    Object.entries(analytics.categoryAverages)
      .map(([key, value]) => ({
        name: key.charAt(0).toUpperCase() + key.slice(1),
        score: Math.round(value),
        fill: CATEGORY_COLORS[key] || '#6b7280'
      }))
      .sort((a, b) => b.score - a.score) : [];

  const trendData = analytics?.dailyTrend?.map(d => ({
    date: d.date.split('-').slice(1).join('/'),
    evaluations: d.evaluations,
    score: Math.round(d.avg_score)
  })) || [];

  const totalEvaluations = analytics?.overall?.total_evaluations || 0;
  const avgScore = analytics?.overall?.avg_score || 0;
  const highQuality = analytics?.overall?.high_quality_count || 0;
  const lowQuality = analytics?.overall?.low_quality_count || 0;
  const qualityRate = totalEvaluations > 0 ? Math.round((highQuality / totalEvaluations) * 100) : 0;

  return (
    <main className="page-content dashboard">
      <div className="page-header">
        <div>
          <h2>📊 Analytics Dashboard</h2>
          <p>Track metadata quality trends and insights</p>
        </div>
        <div className="period-selector">
          <select value={days} onChange={(e) => setDays(Number(e.target.value))}>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-content">
            <div className="stat-value">{totalEvaluations}</div>
            <div className="stat-label">Total Evaluations</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <div className="stat-value">{avgScore}</div>
            <div className="stat-label">Average Score</div>
          </div>
        </div>
        <div className="stat-card highlight-success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{highQuality}</div>
            <div className="stat-label">High Quality (A/B)</div>
          </div>
          {totalEvaluations > 0 && <div className="stat-badge">{qualityRate}%</div>}
        </div>
        <div className="stat-card highlight-warning">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{lowQuality}</div>
            <div className="stat-label">Needs Work (D/F)</div>
          </div>
        </div>
      </div>

      {/* Rules Statistics */}
      {rulesStats && (
        <div className="card rules-overview-card">
          <h3 className="card-title">🔍 Rules Overview</h3>
          <div className="rules-stats-grid">
            <div className="rule-stat-item">
              <div className="rule-stat-circle">
                <span className="rule-stat-number">{rulesStats.totalRules}</span>
              </div>
              <span className="rule-stat-label">Total Rules</span>
            </div>
            <div className="rule-stat-item">
              <div className="rule-stat-circle categories">
                <span className="rule-stat-number">{rulesStats.categoryCount}</span>
              </div>
              <span className="rule-stat-label">Categories</span>
            </div>
            <div className="rule-stat-item">
              <div className="rule-stat-circle critical">
                <span className="rule-stat-number">{rulesStats.severityCounts?.critical || 0}</span>
              </div>
              <span className="rule-stat-label">Critical</span>
            </div>
            <div className="rule-stat-item">
              <div className="rule-stat-circle major">
                <span className="rule-stat-number">{rulesStats.severityCounts?.major || 0}</span>
              </div>
              <span className="rule-stat-label">Major</span>
            </div>
            <div className="rule-stat-item">
              <div className="rule-stat-circle minor">
                <span className="rule-stat-number">{rulesStats.severityCounts?.minor || 0}</span>
              </div>
              <span className="rule-stat-label">Minor</span>
            </div>
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="charts-grid">
        {/* Grade Distribution */}
        <div className="card chart-card">
          <h3 className="card-title">🎯 Grade Distribution</h3>
          {gradeData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={gradeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                  >
                    {gradeData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} strokeWidth={0} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="chart-legend-custom">
                {gradeData.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span className="legend-color" style={{ background: entry.fill }}></span>
                    <span className="legend-label">Grade {entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-chart">
              <span className="empty-icon">📊</span>
              <p>No evaluation data yet</p>
            </div>
          )}
        </div>

        {/* Category Averages */}
        <div className="card chart-card">
          <h3 className="card-title">📈 Category Performance</h3>
          {categoryData.length > 0 ? (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={categoryData} layout="vertical" margin={{ left: 20, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" horizontal={true} vertical={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }} />
                  <YAxis type="category" dataKey="name" width={95} tick={{ fill: '#334155', fontSize: 13, fontWeight: 500 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={24}>
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-chart">
              <span className="empty-icon">📊</span>
              <p>No category data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Trends */}
      {trendData.length > 0 && (
        <div className="card chart-card full-width">
          <h3 className="card-title">📅 Daily Trend</h3>
          <div className="chart-container trend-chart">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorEval" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={{ stroke: 'rgba(148, 163, 184, 0.3)' }} />
                <YAxis yAxisId="left" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                <Area yAxisId="left" type="monotone" dataKey="evaluations" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorEval)" name="Evaluations" dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
                <Area yAxisId="right" type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" name="Avg Score" dot={{ fill: '#10b981', strokeWidth: 0, r: 4 }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Common Issues */}
      {analytics?.commonIssues?.length > 0 && (
        <div className="card issues-card">
          <h3 className="card-title">🚨 Most Common Issues</h3>
          <div className="issues-list">
            {analytics.commonIssues.slice(0, 8).map((issue, i) => (
              <div key={i} className="issue-item">
                <div className="issue-rank">#{i + 1}</div>
                <div className="issue-info">
                  <span className="issue-rule">{issue.rule}</span>
                </div>
                <div className="issue-count-badge">
                  {issue.count} <span>failures</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
