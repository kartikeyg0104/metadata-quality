/**
 * HTML Report Generator
 * Generates human-readable HTML reports for metadata quality evaluation
 */

/**
 * Generate HTML report from evaluation results
 * @param {Object} evaluation - Evaluation results from evaluateMetadataDetailed
 * @param {Object} metadata - Original metadata
 * @returns {string} HTML report
 */
export function generateHtmlReport(evaluation, metadata) {
  const { overall_score, grade, categories, summary, recommendations, rule_results } = evaluation;
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Metadata Quality Report - ${escapeHtml(metadata.title || 'Untitled Dataset')}</title>
  <style>
    :root {
      --color-excellent: #22c55e;
      --color-good: #84cc16;
      --color-acceptable: #eab308;
      --color-needs-improvement: #f97316;
      --color-poor: #ef4444;
      --color-bg: #f8fafc;
      --color-card: #ffffff;
      --color-border: #e2e8f0;
      --color-text: #334155;
      --color-text-light: #64748b;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--color-bg);
      color: var(--color-text);
      line-height: 1.6;
      padding: 2rem;
    }
    
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2rem;
    }
    
    .header h1 {
      font-size: 1.75rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    
    .header .subtitle {
      color: var(--color-text-light);
      font-size: 0.95rem;
    }
    
    .card {
      background: var(--color-card);
      border-radius: 12px;
      border: 1px solid var(--color-border);
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }
    
    .card-title {
      font-size: 1.1rem;
      font-weight: 600;
      margin-bottom: 1rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .score-section {
      display: flex;
      align-items: center;
      gap: 2rem;
    }
    
    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border: 8px solid ${grade.color};
      background: linear-gradient(135deg, ${grade.color}10, ${grade.color}05);
    }
    
    .score-value {
      font-size: 2.5rem;
      font-weight: 700;
      color: ${grade.color};
    }
    
    .score-label {
      font-size: 0.85rem;
      color: var(--color-text-light);
      margin-top: -0.25rem;
    }
    
    .score-details {
      flex: 1;
    }
    
    .grade-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      background: ${grade.color}15;
      color: ${grade.color};
      font-weight: 600;
      margin-bottom: 0.75rem;
    }
    
    .grade-letter {
      font-size: 1.25rem;
    }
    
    .score-description {
      color: var(--color-text-light);
      font-size: 0.9rem;
    }
    
    .category-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    
    .category-item {
      padding: 1rem;
      border-radius: 8px;
      background: var(--color-bg);
    }
    
    .category-name {
      font-size: 0.85rem;
      color: var(--color-text-light);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    
    .category-score {
      font-size: 1.75rem;
      font-weight: 700;
    }
    
    .category-bar {
      height: 6px;
      background: var(--color-border);
      border-radius: 3px;
      margin-top: 0.5rem;
      overflow: hidden;
    }
    
    .category-bar-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.5s ease;
    }
    
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1rem;
      text-align: center;
    }
    
    .summary-item {
      padding: 1rem;
      background: var(--color-bg);
      border-radius: 8px;
    }
    
    .summary-value {
      font-size: 1.5rem;
      font-weight: 700;
    }
    
    .summary-label {
      font-size: 0.8rem;
      color: var(--color-text-light);
    }
    
    .recommendation-list {
      list-style: none;
    }
    
    .recommendation-item {
      padding: 1rem;
      border-radius: 8px;
      background: var(--color-bg);
      margin-bottom: 0.75rem;
      display: flex;
      gap: 1rem;
      align-items: flex-start;
    }
    
    .recommendation-number {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--color-border);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.85rem;
      flex-shrink: 0;
    }
    
    .recommendation-content {
      flex: 1;
    }
    
    .severity-badge {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 0.5rem;
    }
    
    .severity-critical { background: #fecaca; color: #dc2626; }
    .severity-important { background: #fed7aa; color: #ea580c; }
    .severity-warning { background: #fef08a; color: #ca8a04; }
    .severity-suggestion { background: #e0e7ff; color: #4f46e5; }
    
    .rule-results {
      font-size: 0.9rem;
    }
    
    .rule-item {
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .rule-item:last-child {
      border-bottom: none;
    }
    
    .rule-status {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    
    .rule-passed {
      background: #dcfce7;
      color: #16a34a;
    }
    
    .rule-failed {
      background: #fee2e2;
      color: #dc2626;
    }
    
    .rule-name {
      font-weight: 500;
      flex: 1;
    }
    
    .rule-category {
      font-size: 0.8rem;
      color: var(--color-text-light);
      text-transform: capitalize;
    }
    
    .metadata-section {
      font-size: 0.9rem;
    }
    
    .metadata-field {
      padding: 0.5rem 0;
      display: flex;
      border-bottom: 1px solid var(--color-border);
    }
    
    .metadata-field:last-child {
      border-bottom: none;
    }
    
    .metadata-key {
      font-weight: 500;
      width: 150px;
      flex-shrink: 0;
    }
    
    .metadata-value {
      color: var(--color-text-light);
      word-break: break-word;
    }
    
    .footer {
      text-align: center;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
      color: var(--color-text-light);
      font-size: 0.85rem;
    }
    
    @media (max-width: 600px) {
      body { padding: 1rem; }
      .score-section { flex-direction: column; text-align: center; }
      .summary-grid { grid-template-columns: repeat(2, 1fr); }
      .category-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>Metadata Quality Report</h1>
      <p class="subtitle">${escapeHtml(metadata.title || 'Untitled Dataset')}</p>
    </header>
    
    <!-- Overall Score -->
    <div class="card">
      <div class="score-section">
        <div class="score-circle">
          <span class="score-value">${overall_score}</span>
          <span class="score-label">out of 100</span>
        </div>
        <div class="score-details">
          <div class="grade-badge">
            <span class="grade-letter">${grade.grade}</span>
            <span>${grade.label}</span>
          </div>
          <p class="score-description">${grade.description}</p>
        </div>
      </div>
    </div>
    
    <!-- Category Scores -->
    <div class="card">
      <h2 class="card-title">Category Breakdown</h2>
      <div class="category-grid">
        ${generateCategoryCards(categories)}
      </div>
    </div>
    
    <!-- Summary Statistics -->
    <div class="card">
      <h2 class="card-title">Evaluation Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">${summary.total_rules}</div>
          <div class="summary-label">Total Rules</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: var(--color-excellent)">${summary.passed}</div>
          <div class="summary-label">Passed</div>
        </div>
        <div class="summary-item">
          <div class="summary-value" style="color: var(--color-poor)">${summary.failed}</div>
          <div class="summary-label">Failed</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${summary.pass_rate}%</div>
          <div class="summary-label">Pass Rate</div>
        </div>
      </div>
    </div>
    
    <!-- Recommendations -->
    ${generateRecommendationsSection(recommendations)}
    
    <!-- Rule Results -->
    <div class="card">
      <h2 class="card-title">Detailed Rule Results</h2>
      <div class="rule-results">
        ${generateRuleResults(rule_results)}
      </div>
    </div>
    
    <!-- Metadata Preview -->
    <div class="card">
      <h2 class="card-title">Metadata Evaluated</h2>
      <div class="metadata-section">
        ${generateMetadataPreview(metadata)}
      </div>
    </div>
    
    <footer class="footer">
      <p>Generated by Metadata Quality Platform &bull; ${new Date().toISOString().split('T')[0]}</p>
    </footer>
  </div>
</body>
</html>`;

  return html;
}

/**
 * Generate category score cards
 */
function generateCategoryCards(categories) {
  const categoryNames = {
    identification: 'Identification',
    description: 'Description',
    legal: 'Legal',
    provenance: 'Provenance'
  };
  
  return Object.entries(categories)
    .map(([key, score]) => {
      const color = getScoreColor(score);
      return `
        <div class="category-item">
          <div class="category-name">${categoryNames[key] || key}</div>
          <div class="category-score" style="color: ${color}">${score}</div>
          <div class="category-bar">
            <div class="category-bar-fill" style="width: ${score}%; background: ${color}"></div>
          </div>
        </div>
      `;
    })
    .join('');
}

/**
 * Generate recommendations section
 */
function generateRecommendationsSection(recommendations) {
  if (!recommendations || recommendations.type !== 'grouped' || !recommendations.categories?.length) {
    return '';
  }
  
  const highPriority = recommendations.categories
    .flatMap(cat => cat.items.filter(i => i.isPriority))
    .slice(0, 5);
  
  if (highPriority.length === 0) {
    return `
      <div class="card">
        <h2 class="card-title">Recommendations</h2>
        <p style="color: var(--color-text-light)">No critical improvements needed. Great work!</p>
      </div>
    `;
  }
  
  return `
    <div class="card">
      <h2 class="card-title">Priority Recommendations</h2>
      <ul class="recommendation-list">
        ${highPriority.map((item, index) => `
          <li class="recommendation-item">
            <span class="recommendation-number">${index + 1}</span>
            <div class="recommendation-content">
              <strong>${escapeHtml(item.rule)}</strong>
              <span class="severity-badge severity-${item.severity}">${item.severity}</span>
              <p style="margin-top: 0.25rem; color: var(--color-text-light)">${escapeHtml(item.recommendation)}</p>
            </div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;
}

/**
 * Generate rule results list
 */
function generateRuleResults(ruleResults) {
  const passed = ruleResults.filter(r => r.passed);
  const failed = ruleResults.filter(r => !r.passed);
  
  // Show failed first, then passed
  const sorted = [...failed, ...passed];
  
  return sorted.map(rule => `
    <div class="rule-item">
      <div class="rule-status ${rule.passed ? 'rule-passed' : 'rule-failed'}">
        ${rule.passed ? '✓' : '✗'}
      </div>
      <span class="rule-name">${escapeHtml(rule.ruleName)}</span>
      <span class="rule-category">${escapeHtml(rule.category)}</span>
    </div>
  `).join('');
}

/**
 * Generate metadata preview
 */
function generateMetadataPreview(metadata) {
  const fields = [
    ['Title', metadata.title],
    ['Description', metadata.description ? (metadata.description.substring(0, 200) + (metadata.description.length > 200 ? '...' : '')) : null],
    ['Authors', Array.isArray(metadata.authors) ? metadata.authors.join(', ') : metadata.authors],
    ['Keywords', Array.isArray(metadata.keywords) ? metadata.keywords.join(', ') : metadata.keywords],
    ['License', metadata.license],
    ['Publisher', metadata.publisher],
    ['Publication Date', metadata.publication_date],
    ['Version', metadata.version],
    ['DOI', metadata.doi]
  ];
  
  return fields
    .filter(([_, value]) => value)
    .map(([key, value]) => `
      <div class="metadata-field">
        <span class="metadata-key">${key}</span>
        <span class="metadata-value">${escapeHtml(String(value))}</span>
      </div>
    `)
    .join('');
}

/**
 * Get color based on score
 */
function getScoreColor(score) {
  if (score >= 90) return '#22c55e';
  if (score >= 80) return '#84cc16';
  if (score >= 70) return '#eab308';
  if (score >= 60) return '#f97316';
  return '#ef4444';
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default { generateHtmlReport };
