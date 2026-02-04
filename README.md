# Open Dataset Metadata Quality & Compliance Platform

A full-stack platform that evaluates open dataset metadata against rule-based quality and compliance standards to generate explainable scores and actionable recommendations.

## Overview

Many open datasets are underused or rejected not because the data is bad, but because the metadata is incomplete, unclear, or non-compliant with publishing standards. This platform addresses that problem by providing:

- **Structured quality assessment** - Not just pass/fail, but weighted scores
- **Explainable results** - Every score traces back to specific rules
- **Actionable recommendations** - Prioritized guidance on what to improve
- **Interactive web UI** - User-friendly interface for evaluation
- **Multiple output formats** - JSON for automation, HTML for humans

## Quick Start

### Local Development

#### 1. Start the Backend

```bash
cd backend
npm install
npm start
# API Server runs at http://localhost:3000
```

#### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
# Web UI runs at http://localhost:5173
```

#### 3. Use the Application

1. Open http://localhost:5173 in your browser
2. Enter dataset metadata in the form
3. Click "Evaluate Metadata"
4. View your quality score and recommendations

### Production Deployment

**Backend:** Deploy to [Render](https://render.com)  
**Frontend:** Deploy to [Vercel](https://vercel.com)

📖 **See [DEPLOYMENT.md](DEPLOYMENT.md) for complete deployment instructions**

Quick deploy checklist:
- ✅ Push code to GitHub
- ✅ Deploy backend to Render (auto-detects `backend/render.yaml`)
- ✅ Deploy frontend to Vercel (auto-detects Vite)
- ✅ Set `VITE_API_URL` in Vercel to your Render backend URL
- ✅ Set `CORS_ORIGIN` in Render to your Vercel frontend URL

### CLI Usage

```bash
# Basic evaluation
node backend/src/cli.js examples/good-metadata.json

# Detailed output with HTML report
node backend/src/cli.js examples/good-metadata.json --detailed --html report.html
```

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React + Vite)                  │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────┐    │
│  │MetadataForm │  │ScoreSummary │  │CategoryBreakdown │    │
│  └─────────────┘  └─────────────┘  └──────────────────┘    │
└───────────────────────────┬─────────────────────────────────┘
                            │ REST API
┌───────────────────────────▼─────────────────────────────────┐
│                    Backend (Node.js + Express)              │
│  ┌───────────────┐  ┌─────────────┐  ┌────────────────┐    │
│  │Schema Validator│  │Rules Engine │  │Score Calculator│    │
│  └───────────────┘  └─────────────┘  └────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Features

### Web Interface

- **Metadata Input Form** - Enter all metadata fields with helpful hints
- **Visual Score Display** - Color-coded quality score with grade (A-F)
- **Category Breakdown** - See scores for Identification, Description, Legal, Provenance
- **Priority Recommendations** - Actionable suggestions sorted by impact

### Rule-Based Quality Engine

The platform uses a deterministic rules engine with 25+ quality checks across four categories:

| Category | Description | Example Rules |
|----------|-------------|---------------|
| **Identification** | Core dataset identity | Title quality, author attribution, DOI |
| **Description** | Content clarity | Description length, keywords, methodology |
| **Legal** | Licensing compliance | SPDX license, openness, contact info |
| **Provenance** | Data origin & access | Publication date, temporal coverage, URL |

### Weighted Scoring System

- Overall score: 0-100
- Category breakdown scores
- Grade system: A (Excellent) to F (Poor)
- Rules weighted by importance

### Multiple Output Formats

- **JSON reports** - Machine-readable for CI/CD integration
- **HTML reports** - Human-readable with visual score breakdown
- **CLI output** - Colored terminal output with progress bars

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/evaluate` | POST | Evaluate metadata, return score and recommendations |
| `/evaluate/detailed` | POST | Full evaluation with all rule results |
| `/evaluate/file` | POST | Upload JSON file for evaluation |
| `/batch` | POST | Evaluate multiple metadata records |
| `/schema` | GET | Get the metadata JSON Schema |
| `/rules` | GET | Get all evaluation rules |
| `/report/html` | POST | Generate HTML report |
| `/report/json` | POST | Generate structured JSON report |
| `/health` | GET | Health check |

### Example Response

```json
{
  "overall_score": 72,
  "grade": {
    "letter": "C",
    "label": "Acceptable",
    "description": "Metadata quality is acceptable but could benefit from improvements."
  },
  "categories": {
    "identification": 85,
    "description": 65,
    "legal": 80,
    "provenance": 55
  },
  "recommendations": [
    "Add methodology documentation explaining how the data was collected",
    "Add at least 3 keywords covering the subject domain",
    "Add temporal coverage information to indicate when the data was collected"
  ]
}
```

## Metadata Schema

The platform expects metadata in this structure:

```json
{
  "title": "Dataset Title (required)",
  "description": "Detailed description",
  "authors": ["Author Name"],
  "keywords": ["keyword1", "keyword2"],
  "license": "CC-BY-4.0",
  "publisher": "Organization Name",
  "publication_date": "2024-01-15",
  "version": "1.0.0",
  "doi": "10.5281/zenodo.1234567",
  "methodology": "Data collection methods...",
  "funding": "Grant information",
  "temporal_coverage": {
    "start_date": "2020-01-01",
    "end_date": "2023-12-31"
  },
  "spatial_coverage": "Geographic scope",
  "data_format": ["CSV", "JSON"],
  "access_url": "https://example.com/data",
  "contact_email": "contact@example.com"
}
```

See [backend/src/schema/metadata.schema.json](backend/src/schema/metadata.schema.json) for the complete JSON Schema.

## Project Structure

```
metadata-quality-platform/
├── backend/
│   ├── src/
│   │   ├── schema/              # JSON Schema definition
│   │   ├── rules/               # 33 quality rule implementations
│   │   ├── scoring/             # Score calculation
│   │   ├── recommendations/     # Recommendation generation
│   │   ├── reports/             # Report generators
│   │   ├── evaluator.js         # Core evaluation logic
│   │   ├── server.js            # Express API
│   │   └── cli.js               # CLI interface
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetadataForm.jsx
│   │   │   ├── ScoreSummary.jsx
│   │   │   ├── CategoryBreakdown.jsx
│   │   │   └── Recommendations.jsx
│   │   ├── services/api.js
│   │   ├── App.jsx
│   │   └── index.css
│   ├── index.html
│   └── package.json
├── examples/                    # Sample metadata files
├── reports/                     # Generated reports
├── docs/                        # Documentation
└── README.md
```

## Documentation

- [Rules Documentation](docs/rules-explained.md) - All quality rules explained
- [Scoring Model](docs/scoring-model.md) - How scores are calculated

## Design Philosophy

1. **Explainability over automation** - Users understand every score
2. **Determinism over heuristics** - Results are reproducible
3. **Governance-first thinking** - Quality as policy compliance

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express
- **Validation:** AJV (JSON Schema)
- **Output:** JSON, HTML

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Styling:** Custom CSS

## Use Cases

- Dataset authors validating metadata before submission
- Data portals enforcing quality standards
- Research organizations auditing collections
- CI/CD pipelines for data publishing

## User Flow

1. User opens web application at http://localhost:5173
2. Enters or pastes dataset metadata in the form
3. Clicks "Evaluate Metadata"
4. System returns:
   - Quality score (0-100) with grade (A-F)
   - Category breakdown with visual bars
   - Prioritized recommendations
5. User improves metadata and re-evaluates

## Resume Entry

```
Open Dataset Metadata Quality & Compliance Platform
JavaScript, React, Node.js, Express, JSON Schema

• Built a full-stack platform to evaluate metadata quality for open datasets
• Implemented 33 rule-based quality checks with weighted scoring system
• Designed React frontend with interactive evaluation and visual feedback
• Generated actionable recommendations to improve metadata compliance
```

## Limitations

- Evaluates metadata quality, not data quality
- Rules are configurable but not ML-based
- Focus on governance, not visualization

## Future Enhancements

- Custom rule configuration files
- Batch processing for large repositories
- Webhook integrations
- Additional metadata standards (DataCite, Dublin Core)

## License

MIT License

---

*This project focuses on the governance and compliance layer of data quality, complementing visualization-focused approaches.*
# metadata-quality
